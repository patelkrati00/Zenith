import { WebSocketServer } from 'ws';
import { spawn, execSync } from 'child_process';
import { nanoid } from 'nanoid';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get executor scripts directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const EXECUTOR_DIR = path.resolve(__dirname, '../executor');

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
 * Language to Docker image mapping (can be overridden via env vars)
 */
const LANGUAGE_IMAGES = {
    node: process.env.DOCKER_IMAGE_NODE || 'node:18-alpine',
    python: process.env.DOCKER_IMAGE_PYTHON || 'python:3.11-alpine',
    cpp: process.env.DOCKER_IMAGE_CPP || 'gcc:latest',
    java: process.env.DOCKER_IMAGE_JAVA || 'eclipse-temurin:17-jdk-alpine'
};

/**
 * Language command templates using executor scripts
 * These scripts handle dependency installation and project execution
 */
const LANGUAGE_COMMANDS = {
    node: (file) => `/executor/run_node.sh ${file}`,
    python: (file) => `/executor/run_python.sh ${file}`,
    cpp: (file) => `/executor/run_cpp.sh ${file}`,
    java: (file) => `/executor/run_java.sh ${file}`
};

/**
 * Active running containers (jobId -> dockerProcess)
 */
const activeContainers = new Map();

/**
 * Make executor scripts executable on the host filesystem.
 */
export async function makeExecutorScriptsExecutable() {
    if (os.platform() === 'win32') {
        console.log('ℹ️  Skipping chmod on Windows (not required)');
        return;
    }

    try {
        const files = await fs.readdir(EXECUTOR_DIR);
        const shellScripts = files.filter(f => f.endsWith('.sh'));

        for (const script of shellScripts) {
            const scriptPath = path.join(EXECUTOR_DIR, script);
            try {
                await fs.chmod(scriptPath, 0o755);
                console.log(`✓ Made executable: ${script}`);
            } catch (chmodError) {
                if (chmodError.code === 'EROFS' || chmodError.code === 'EPERM') {
                    console.warn(`⚠️  Cannot chmod ${script} (read-only filesystem), continuing...`);
                } else {
                    throw chmodError;
                }
            }
        }
    } catch (error) {
        console.error('Warning: Failed to make executor scripts executable:', error.message);
    }
}

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

        const send = (type, data, code = null) => {
            if (ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify({ type, data, code }));
            }
        };

        const cleanup = async () => {
            if (executionTimeout) clearTimeout(executionTimeout);

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

        ws.on('message', async (message) => {
            try {
                const { language, code, filename, command, workspaceId: existingWorkspaceId } = JSON.parse(message.toString());

                if (!language) {
                    send('error', 'Missing required field: language');
                    return;
                }
                if (!LANGUAGE_IMAGES[language]) {
                    send('error', `Unsupported language: ${language}`);
                    return;
                }

                const defaultFilenames = {
                    node: 'index.js',
                    python: 'main.py',
                    cpp: 'main.cpp'
                };
                const targetFilename = filename || defaultFilenames[language];

                if (existingWorkspaceId) {
                    jobId = existingWorkspaceId;
                    workspacePath = path.join(config.workspaceBase, existingWorkspaceId);
                    try {
                        await fs.access(workspacePath);
                        console.log(`🔄 Using existing workspace ${existingWorkspaceId}`);
                        send('info', `Using workspace ${existingWorkspaceId}`, existingWorkspaceId);
                    } catch {
                        send('error', `Workspace ${existingWorkspaceId} not found`);
                        return;
                    }
                } else {
                    if (!code) {
                        send('error', 'Missing required field: code (when workspaceId not provided)');
                        return;
                    }
                    jobId = nanoid(10);
                    workspacePath = path.join(config.workspaceBase, jobId);
                    await fs.mkdir(workspacePath, { recursive: true });
                    await fs.writeFile(path.join(workspacePath, targetFilename), code, 'utf8');
                    console.log(`📦 Created workspace for job ${jobId}`);
                    send('info', `Job ${jobId} started`, jobId);
                }

                // ✅ Auto-install Node dependencies if package.json exists
                if (language === 'node') {
                    const packageJsonPath = path.join(workspacePath, 'package.json');
                    try {
                        await fs.access(packageJsonPath);
                        send('info', '📦 Detected package.json — installing dependencies...');
                        console.log(`📦 Installing dependencies for job ${jobId}`);
                        execSync('npm install --omit=dev --no-audit --no-fund', {
                            cwd: workspacePath,
                            stdio: 'inherit',
                            shell: true
                        });
                        send('info', '✅ Dependencies installed successfully');
                    } catch {
                        // no package.json present, skip silently
                    }
                }

                // ✅ Auto-install Python dependencies if requirements.txt exists
                if (language === 'python') {
                    const requirementsPath = path.join(workspacePath, 'requirements.txt');
                    try {
                        await fs.access(requirementsPath);
                        send('info', '📦 Detected requirements.txt — installing Python dependencies...');
                        console.log(`📦 Installing Python dependencies for job ${jobId}`);
                        execSync(`pip install --no-cache-dir -r requirements.txt`, {
                            cwd: workspacePath,
                            stdio: 'inherit',
                            shell: true
                        });
                        send('info', '✅ Python dependencies installed successfully');
                    } catch {
                        // No requirements.txt, skip silently
                    }
                }

                // Build Docker command
                const image = LANGUAGE_IMAGES[language];
                const execCommand = command || LANGUAGE_COMMANDS[language](targetFilename);
                const dockerHostPath = toDockerPosixPath(workspacePath);

                let userOption = '0:0';
                if (os.platform() !== 'win32') {
                    try {
                        userOption = `${process.getuid()}:${process.getgid()}`;
                    } catch {
                        userOption = '0:0';
                    }
                }

                const dockerExecutorPath = toDockerPosixPath(EXECUTOR_DIR);

                const dockerArgs = [
                    'run', '--rm', '-i',
                    '--network=none',
                    `--memory=${config.dockerMemory}`,
                    `--cpus=${config.dockerCpu}`,
                    `--pids-limit=${config.dockerPids}`,
                    '--security-opt=no-new-privileges',
                    '--tmpfs', '/tmp',
                    '-v', `${dockerHostPath}:/workspace:rw`,
                    '-v', `${dockerExecutorPath}:/executor:ro`,
                    '-w', '/workspace',
                    '--user', userOption,
                    image,
                    'sh', '-c', `timeout ${config.dockerTimeout}s ${execCommand}`
                ];

                console.log('🐳 docker', dockerArgs.join(' '));

                dockerProcess = spawn('docker', dockerArgs, { stdio: ['ignore', 'pipe', 'pipe'] });
                activeContainers.set(jobId, dockerProcess);

                dockerProcess.stdout.on('data', (data) => send('stdout', data.toString()));
                dockerProcess.stderr.on('data', (data) => send('stderr', data.toString()));

                dockerProcess.on('close', async (exitCode) => {
                    console.log(`✅ Job ${jobId} exited with code ${exitCode}`);
                    send('exit', `Process exited with code ${exitCode}`, exitCode);
                    await cleanup();
                });

                dockerProcess.on('error', async (error) => {
                    console.error(`❌ Docker error for job ${jobId}:`, error.message);
                    send('error', error.message);
                    await cleanup();
                });

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

        ws.on('close', async () => {
            console.log('🔌 Client disconnected');
            await cleanup();
        });

        ws.on('error', (error) => console.error('WebSocket error:', error.message));
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
