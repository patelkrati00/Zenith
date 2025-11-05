import { WebSocketServer } from 'ws';
import { spawn } from 'child_process';
import { nanoid } from 'nanoid';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

/**
 * Convert a host path to a Docker-friendly POSIX path.
 */
function toDockerPosixPath(hostPath) {
    if (!hostPath) return hostPath;
    let p = path.resolve(hostPath);

    if (os.platform() !== 'win32') {
        return p.split(path.sep).join('/');
    }

    p = p.split(path.sep).join('/');
    const m = p.match(/^([A-Za-z]):\/(.*)/);
    if (m) {
        const drive = m[1].toLowerCase();
        const rest = m[2];
        const drivePrefix = '/host_mnt';
        return `${drivePrefix}/${drive}/${rest}`;
    }

    if (p.startsWith('/')) return p;
    return `/${p}`;
}

/**
 * Language to Docker image mapping
 */
const LANGUAGE_IMAGES = {
    node: 'node:18-alpine',
    python: 'python:3.11-alpine',
    cpp: 'gcc:latest'
};

/**
 * Language command templates
 */
const LANGUAGE_COMMANDS = {
    node: (file) => `node ${file}`,
    python: (file) => `python3 ${file}`,
    cpp: (file) => `g++ ${file} -o a.out && chmod +x a.out && ./a.out`

};

/**
 * Active running containers (jobId -> dockerProcess)
 */
const activeContainers = new Map();

/**
 * Initialize WebSocket server for streaming code execution
 */
export function initWebSocketServer(httpServer, config) {
    const wss = new WebSocketServer({
        server: httpServer,
        path: '/ws/run'
    });

    console.log('📡 WebSocket server initialized on /ws/run');

    wss.on('connection', (ws) => {
        console.log('🔌 Client connected to WebSocket');

        let jobId = null;
        let dockerProcess = null;
        let workspacePath = null;
        let executionTimeout = null;

        /**
         * Send a message to the client
         */
        const send = (type, data, code = null) => {
            if (ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify({ type, data, code }));
            }
        };

        /**
         * Cleanup resources
         */
        const cleanup = async () => {
            if (executionTimeout) {
                clearTimeout(executionTimeout);
            }

            if (dockerProcess && !dockerProcess.killed) {
                console.log(`⚠️ Killing container for job ${jobId}`);
                dockerProcess.kill('SIGKILL');
                activeContainers.delete(jobId);
            }

            if (workspacePath) {
                try {
                    await fs.rm(workspacePath, { recursive: true, force: true });
                    console.log(`🗑️ Cleaned workspace: ${workspacePath}`);
                } catch (error) {
                    console.error('Cleanup error:', error.message);
                }
            }
        };

        /**
         * Handle incoming messages from client
         */
        ws.on('message', async (message) => {
            try {
                const { language, code, filename, command, workspaceId: existingWorkspaceId } = JSON.parse(message.toString());

                // Validation
                if (!language) {
                    send('error', 'Missing required field: language');
                    return;
                }

                if (!LANGUAGE_IMAGES[language]) {
                    send('error', `Unsupported language: ${language}`);
                    return;
                }

                // Default filenames
                const defaultFilenames = {
                    node: 'index.js',
                    python: 'main.py',
                    cpp: 'main.cpp'
                };

                const targetFilename = filename || defaultFilenames[language];

                // Use existing workspace or create new one
                if (existingWorkspaceId) {
                    // Use existing workspace
                    jobId = existingWorkspaceId;
                    workspacePath = path.join(config.workspaceBase, existingWorkspaceId);

                    // Verify workspace exists
                    try {
                        await fs.access(workspacePath);
                        console.log(`🔄 Using existing workspace ${existingWorkspaceId}`);
                        send('info', `Using workspace ${existingWorkspaceId}`, existingWorkspaceId);
                    } catch {
                        send('error', `Workspace ${existingWorkspaceId} not found`);
                        return;
                    }
                } else {
                    // Create new workspace with provided code
                    if (!code) {
                        send('error', 'Missing required field: code (when workspaceId not provided)');
                        return;
                    }

                    jobId = nanoid(10);
                    workspacePath = path.join(config.workspaceBase, jobId);

                    // Create workspace
                    await fs.mkdir(workspacePath, { recursive: true });
                    await fs.writeFile(path.join(workspacePath, targetFilename), code, 'utf8');

                    console.log(`📦 Created workspace for job ${jobId}`);
                    send('info', `Job ${jobId} started`, jobId);
                }

                // Build Docker command
                const image = LANGUAGE_IMAGES[language];
                const execCommand = command || LANGUAGE_COMMANDS[language](targetFilename);
                const dockerHostPath = toDockerPosixPath(workspacePath);

                // Determine user option
                let userOption = '1000:1000';
                if (os.platform() !== 'win32') {
                    try {
                        userOption = `${process.getuid()}:${process.getgid()}`;
                    } catch (err) {
                        userOption = '1000:1000';
                    }
                }

                const dockerArgs = [
                    'run',
                    '--rm',
                    '-i', // Interactive (for potential stdin support)
                    '--network=none',
                    `--memory=${config.dockerMemory}`,
                    `--cpus=${config.dockerCpu}`,
                    `--pids-limit=${config.dockerPids}`,
                    '--security-opt=no-new-privileges',
                    '--read-only',
                    '--tmpfs', '/tmp',
                    '-v', `${dockerHostPath}:/workspace:rw`,
                    '-w', '/workspace',
                    '--user', userOption,
                    image,
                    'sh', '-c', `timeout ${config.dockerTimeout}s ${execCommand}`
                ];

                console.log('🐳 docker', dockerArgs.join(' '));

                // Spawn Docker process
                dockerProcess = spawn('docker', dockerArgs, {
                    stdio: ['ignore', 'pipe', 'pipe']
                });

                activeContainers.set(jobId, dockerProcess);

                // Stream stdout
                dockerProcess.stdout.on('data', (data) => {
                    send('stdout', data.toString());
                });

                // Stream stderr
                dockerProcess.stderr.on('data', (data) => {
                    send('stderr', data.toString());
                });

                // Handle process exit
                dockerProcess.on('close', async (exitCode) => {
                    console.log(`✅ Job ${jobId} exited with code ${exitCode}`);
                    send('exit', `Process exited with code ${exitCode}`, exitCode);
                    await cleanup();
                });

                // Handle process errors
                dockerProcess.on('error', async (error) => {
                    console.error(`❌ Docker error for job ${jobId}:`, error.message);
                    send('error', error.message);
                    await cleanup();
                });

                // Set timeout to force kill
                executionTimeout = setTimeout(async () => {
                    console.log(`⏱️ Job ${jobId} timed out`);
                    send('error', 'Execution timeout exceeded');
                    await cleanup();
                    ws.close();
                }, (config.dockerTimeout + 5) * 1000);

            } catch (error) {
                console.error('WebSocket message error:', error);
                send('error', error.message);
            }
        });

        /**
         * Handle client disconnect
         */
        ws.on('close', async () => {
            console.log('🔌 Client disconnected');
            await cleanup();
        });

        /**
         * Handle errors
         */
        ws.on('error', (error) => {
            console.error('WebSocket error:', error.message);
        });
    });

    return wss;
}

/**
 * Get active container count
 */
export function getActiveContainerCount() {
    return activeContainers.size;
}

/**
 * Kill all active containers (for graceful shutdown)
 */
export async function killAllContainers() {
    console.log(`🛑 Killing ${activeContainers.size} active containers...`);
    for (const [jobId, proc] of activeContainers.entries()) {
        try {
            proc.kill('SIGKILL');
            console.log(`   ✓ Killed job ${jobId}`);
        } catch (error) {
            console.error(`   ✗ Failed to kill job ${jobId}:`, error.message);
        }
    }
    activeContainers.clear();
}
