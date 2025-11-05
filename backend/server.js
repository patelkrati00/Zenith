import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { nanoid } from 'nanoid';
import { exec, spawn } from 'child_process';
import os from 'os';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import http from 'http';
import { initWebSocketServer, killAllContainers } from './ws-runner.js';
import { createProjectRouter } from './projects.js';

dotenv.config();

const execAsync = promisify(exec);
const app = express();

// Configuration
const PORT = process.env.PORT || 3001;
const WORKSPACE_BASE = process.env.WORKSPACE_BASE_PATH || '/tmp/ide-runner';
const DOCKER_MEMORY = process.env.DOCKER_MEMORY_LIMIT || '256m';
const DOCKER_CPU = process.env.DOCKER_CPU_LIMIT || '0.5';
const DOCKER_PIDS = process.env.DOCKER_PIDS_LIMIT || '64';
const DOCKER_TIMEOUT = parseInt(process.env.DOCKER_TIMEOUT_SECONDS || '30');
const MAX_OUTPUT = parseInt(process.env.MAX_OUTPUT_SIZE || '1048576'); // 1MB

/**
 * Convert a host path to a Docker-friendly POSIX path.
 * - On non-Windows returns path with forward slashes.
 * - On Windows converts "C:\..." -> "/c/..." (or "/mnt/c/..." if you change drivePrefix).
 */
function toDockerPosixPath(hostPath) {
    if (!hostPath) return hostPath;
    // resolve to absolute first
    let p = path.resolve(hostPath);

    // Non-windows: just ensure forward slashes
    if (os.platform() !== 'win32') {
        return p.split(path.sep).join('/');
    }

    // Windows: convert backslashes to slashes
    p = p.split(path.sep).join('/');

    // If drive letter exists (C:/...), convert to /c/...
    const m = p.match(/^([A-Za-z]):\/(.*)/);
    if (m) {
        const drive = m[1].toLowerCase();
        const rest = m[2];
        // Default prefix — change to '/mnt/c' or '/host_mnt/c' if your Docker expects that.
        const drivePrefix = '/host_mnt';
        return `${drivePrefix}/${drive}/${rest}`;
    }

    // If path already starts with '/', return as-is
    if (p.startsWith('/')) return p;
    return `/${p}`;
}


// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Mount project/workspace routes
const projectConfig = {
    workspaceBase: WORKSPACE_BASE
};
app.use('/projects', createProjectRouter(projectConfig));

// Language to Docker image mapping
const LANGUAGE_IMAGES = {
    node: 'node:18-alpine',
    python: 'python:3.11-alpine',
    cpp: 'gcc:latest'
};

// Language command templates
const LANGUAGE_COMMANDS = {
    node: (file) => `node ${file}`,
    python: (file) => `python3 ${file}`,
    cpp: (file) => `g++ ${file} -o a.out && chmod +x a.out && ./a.out`
};

/**
 * Ensure workspace base directory exists
 */
async function ensureWorkspaceBase() {
    try {
        await fs.mkdir(WORKSPACE_BASE, { recursive: true });
    } catch (error) {
        console.error('Failed to create workspace base:', error.message);
    }
}

/**
 * Create a temporary workspace for code execution
 */
async function createWorkspace(code, filename) {
    const jobId = nanoid(10);
    const workspacePath = path.join(WORKSPACE_BASE, jobId);

    await fs.mkdir(workspacePath, { recursive: true });
    await fs.writeFile(path.join(workspacePath, filename), code, 'utf8');

    return { jobId, workspacePath };
}

/**
 * Clean up workspace after execution
 */
async function cleanupWorkspace(workspacePath) {
    try {
        await fs.rm(workspacePath, { recursive: true, force: true });
    } catch (error) {
        console.error('Cleanup failed:', error.message);
    }
}

/**
 * Execute code in a Docker container with security constraints
 */
async function runInContainer(language, workspacePath, filename) {
    const image = LANGUAGE_IMAGES[language];
    const command = LANGUAGE_COMMANDS[language](filename);

    if (!image || !command) {
        throw new Error(`Unsupported language: ${language}`);
    }

    // Convert host workspace path to Docker-friendly path
    const dockerHostPath = toDockerPosixPath(workspacePath);

    // Determine user option:
    // - On Windows, just use 1000:1000 (no process.getuid)
    // - On POSIX, use actual uid:gid from node if available
    let userOption = '1000:1000';
    if (os.platform() !== 'win32') {
        try {
            // process.getuid/getgid exist only on POSIX
            userOption = `${process.getuid()}:${process.getgid()}`;
        } catch (err) {
            userOption = '1000:1000';
        }
    }

    // Build docker args as an array (no shell concatenation)
    const dockerArgs = [
        'run',
        '--rm',
        '--network=none',
        `--memory=${DOCKER_MEMORY}`,
        `--cpus=${DOCKER_CPU}`,
        `--pids-limit=${DOCKER_PIDS}`,
        '--security-opt=no-new-privileges',
        '--read-only',
        '--tmpfs', '/tmp',
        '-v', `${workspacePath}:/workspace:rw`,
        '-w', '/workspace',
        '--user', userOption,
        image,
        'sh', '-c', `timeout ${DOCKER_TIMEOUT}s ${command}`
    ];

    console.log('docker', dockerArgs.join(' '));

    return new Promise((resolve) => {
        const proc = spawn('docker', dockerArgs, { stdio: ['ignore', 'pipe', 'pipe'] });

        let stdout = '';
        let stderr = '';

        proc.stdout.on('data', (d) => (stdout += d.toString()));
        proc.stderr.on('data', (d) => (stderr += d.toString()));

        proc.on('error', (err) => {
            resolve({
                success: false,
                stdout: '',
                stderr: err.message,
                exitCode: null
            });
        });

        proc.on('close', async (code) => {
            // Code finished — optionally cleanup done by caller
            resolve({
                success: code === 0,
                stdout: stdout || '',
                stderr: stderr || '',
                exitCode: code === null ? 1 : code
            });
        });
    });
}


/**
 * POST /run
 * Execute code in a sandboxed container
 */
app.post('/run', async (req, res) => {
    const { language, code, filename } = req.body;

    // Validation
    if (!language || !code) {
        return res.status(400).json({
            error: 'Missing required fields: language, code'
        });
    }

    if (!LANGUAGE_IMAGES[language]) {
        return res.status(400).json({
            error: `Unsupported language: ${language}. Supported: ${Object.keys(LANGUAGE_IMAGES).join(', ')}`
        });
    }

    if (code.length > MAX_OUTPUT) {
        return res.status(400).json({
            error: `Code size exceeds maximum allowed: ${MAX_OUTPUT} bytes`
        });
    }

    // Default filenames
    const defaultFilenames = {
        node: 'index.js',
        python: 'main.py',
        cpp: 'main.cpp'
    };

    const targetFilename = filename || defaultFilenames[language];
    let workspacePath;

    try {
        // Create workspace
        const workspace = await createWorkspace(code, targetFilename);
        workspacePath = workspace.workspacePath;

        // Execute in container
        const result = await runInContainer(language, workspacePath, targetFilename);

        // Return result
        res.json({
            jobId: workspace.jobId,
            language,
            filename: targetFilename,
            ...result,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Execution error:', error);
        res.status(500).json({
            error: 'Execution failed',
            message: error.message
        });
    } finally {
        // Cleanup workspace
        if (workspacePath) {
            await cleanupWorkspace(workspacePath);
        }
    }
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        supportedLanguages: Object.keys(LANGUAGE_IMAGES)
    });
});

/**
 * GET /
 * API info
 */
app.get('/', (req, res) => {
    res.json({
        name: 'Zenith Runner API',
        version: '1.0.0',
        endpoints: {
            'POST /run': 'Execute code in sandbox',
            'GET /health': 'Health check'
        },
        supportedLanguages: Object.keys(LANGUAGE_IMAGES)
    });
});

// Initialize and start server
async function startServer() {
    await ensureWorkspaceBase();

    // Create HTTP server
    const httpServer = http.createServer(app);

    // Initialize WebSocket server
    const wsConfig = {
        workspaceBase: WORKSPACE_BASE,
        dockerMemory: DOCKER_MEMORY,
        dockerCpu: DOCKER_CPU,
        dockerPids: DOCKER_PIDS,
        dockerTimeout: DOCKER_TIMEOUT
    };

    initWebSocketServer(httpServer, wsConfig);

    // Start listening
    httpServer.listen(PORT, () => {
        console.log(`🚀 Zenith Runner API listening on port ${PORT}`);
        console.log(`📁 Workspace base: ${WORKSPACE_BASE}`);
        console.log(`🐳 Docker limits: ${DOCKER_MEMORY} RAM, ${DOCKER_CPU} CPU`);
        console.log(`⏱️  Timeout: ${DOCKER_TIMEOUT}s`);
        console.log(`🔒 Security: network=none, read-only, no-new-privileges`);
        console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}/ws/run`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
        console.log('\n⚠️ SIGTERM received, shutting down gracefully...');
        await killAllContainers();
        httpServer.close(() => {
            console.log('✅ Server closed');
            process.exit(0);
        });
    });

    process.on('SIGINT', async () => {
        console.log('\n⚠️ SIGINT received, shutting down gracefully...');
        await killAllContainers();
        httpServer.close(() => {
            console.log('✅ Server closed');
            process.exit(0);
        });
    });
}

startServer().catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
