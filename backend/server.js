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
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { initWebSocketServer, killAllContainers, makeExecutorScriptsExecutable } from './ws-runner.js';
import { createProjectRouter } from './projects.js';
import { JobQueue } from './queue.js';
import { IPRateLimiter } from './rate-limiter.js';
import { CacheManager } from './cache-manager.js';
import { DockerLayerCache } from './docker-layer-cache.js';
import { monitoring } from './monitoring.js';
import authRoutes from './routes/auth.js';
import monitoringRoutes from './routes/monitoring.js';
import { connectDB } from './config/database.js';

dotenv.config();

// Get executor scripts directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const EXECUTOR_DIR = path.resolve(__dirname, '../executor');

const execAsync = promisify(exec);
const app = express();
console.log("authRoutes DEBUG =>", authRoutes);

// Language to Docker image mapping
const LANGUAGE_IMAGES = {
    node: process.env.DOCKER_IMAGE_NODE || 'node:18-alpine',
    python: process.env.DOCKER_IMAGE_PYTHON || 'python:3.11-alpine',
    cpp: process.env.DOCKER_IMAGE_CPP || 'gcc:latest',
    java: process.env.DOCKER_IMAGE_JAVA || 'eclipse-temurin:17-jdk-alpine'
};

const LANGUAGE_COMMANDS = {
    node: (file) => `/executor/run_node.sh ${file}`,
    python: (file) => `/executor/run_python.sh ${file}`,
    cpp: (file) => `/executor/run_cpp.sh ${file}`,
    java: (file) => `/executor/run_java.sh ${file}`
};


// Configuration
const PORT = process.env.PORT || 3001;
const WORKSPACE_BASE = process.env.WORKSPACE_BASE_PATH || '/tmp/ide-runner';
const DOCKER_MEMORY = process.env.DOCKER_MEMORY_LIMIT || '256m';
const DOCKER_CPU = process.env.DOCKER_CPU_LIMIT || '0.5';
const DOCKER_PIDS = process.env.DOCKER_PIDS_LIMIT || '64';
const DOCKER_TIMEOUT = parseInt(process.env.DOCKER_TIMEOUT_SECONDS || '30');
const MAX_OUTPUT = parseInt(process.env.MAX_OUTPUT_SIZE || '1048576'); // 1MB

// Queue and Rate Limiting Configuration
const MAX_CONCURRENT_JOBS = parseInt(process.env.MAX_CONCURRENT_JOBS || '5');
const MAX_QUEUE_SIZE = parseInt(process.env.MAX_QUEUE_SIZE || '100');
const RATE_LIMIT_REQUESTS = parseInt(process.env.RATE_LIMIT_REQUESTS || '10');
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'); // 1 minute

// Initialize Job Queue
const jobQueue = new JobQueue({
    maxConcurrent: MAX_CONCURRENT_JOBS,
    maxQueueSize: MAX_QUEUE_SIZE,
    jobTimeout: DOCKER_TIMEOUT * 1000
});

// 🧩 Rate Limiter Setup (added)
const globalLimiter = new IPRateLimiter({
    maxRequests: 100,        // 100 requests per minute per IP
    windowMs: 60 * 1000      // 1 minute window
});

const jobLimiter = new IPRateLimiter({
    maxRequests: 10,         // 10 job submissions per minute per IP
    windowMs: 60 * 1000
});
// 🧩 End Rate Limiter Setup

// Initialize Cache Managers
const cacheManager = new CacheManager({
    cacheDir: process.env.CACHE_DIR || '/tmp/ide-cache',
    maxCacheSize: parseInt(process.env.MAX_CACHE_SIZE || String(1024 * 1024 * 1024)), // 1GB
    maxCacheAge: parseInt(process.env.MAX_CACHE_AGE || String(7 * 24 * 60 * 60 * 1000)) // 7 days
});

const dockerLayerCache = new DockerLayerCache({
    imagePrefix: 'zenith-cache',
    maxImages: parseInt(process.env.MAX_CACHED_IMAGES || '50')
});

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

// Middleware
app.use(cors({
    exposedHeaders: ['Authorization'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET','POST','PUT','DELETE','OPTIONS']
}));
app.use(express.json({ limit: '10mb' }));




// 🩺 Safe routes (no rate limiting)
app.get('/health', (req, res) => {
    const queueStats = jobQueue.getStats();
    const metrics = monitoring.getMetrics();
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        supportedLanguages: Object.keys(LANGUAGE_IMAGES),
        queue: {
            running: queueStats.runningCount,
            queued: queueStats.queueLength,
            maxConcurrent: queueStats.maxConcurrent
        },
        executions: {
            total: metrics.executions.total,
            successful: metrics.executions.successful,
            failed: metrics.executions.failed
        }
    });
});

app.get('/queue/status', (req, res) => {
    const stats = jobQueue.getStats();
    const queueStatus = jobQueue.getQueueStatus();
    res.json({
        stats,
        queue: queueStatus,
        timestamp: new Date().toISOString()
    });
});

// Cache management endpoints
app.get('/cache/stats', (req, res) => {
    const cacheStats = cacheManager.getStats();
    const dockerStats = dockerLayerCache.getStats();

    res.json({
        dependencyCache: cacheStats,
        dockerLayerCache: dockerStats,
        timestamp: new Date().toISOString()
    });
});

app.delete('/cache/clear', async (req, res) => {
    try {
        await cacheManager.clearCache();
        await dockerLayerCache.clearCache();

        res.json({
            message: 'Cache cleared successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to clear cache',
            message: error.message
        });
    }
});

// 🧩 Apply global limiter (production only)
if (process.env.NODE_ENV === 'production') {
    app.use(globalLimiter.middleware());
} else {
    console.log('⚙️  Development mode: global rate limiter not applied');
}
// 🧩 End global limiter section

// Mount project/workspace routes
const projectConfig = {
    workspaceBase: WORKSPACE_BASE
};
app.use('/projects', createProjectRouter(projectConfig));



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
 * Execute code in a Docker container
 */
async function runInContainer(language, workspacePath, filename) {
    const image = LANGUAGE_IMAGES[language];
    const command = LANGUAGE_COMMANDS[language](filename);
    if (!image || !command) {
        throw new Error(`Unsupported language: ${language}`);
    }
    const dockerHostPath = toDockerPosixPath(workspacePath);
    const dockerExecutorPath = toDockerPosixPath(EXECUTOR_DIR);
    let userOption = '0:0';
    if (os.platform() !== 'win32') {
        try {
            userOption = `${process.getuid()}:${process.getgid()}`;
        } catch {
            userOption = '0:0';
        }
    }
    const dockerArgs = [
        'run', '--rm', '--network=none',
        `--memory=${DOCKER_MEMORY}`,
        `--cpus=${DOCKER_CPU}`,
        `--pids-limit=${DOCKER_PIDS}`,
        '--security-opt=no-new-privileges',
        '--tmpfs', '/tmp',
        '-v', `${workspacePath}:/workspace:rw`,
        '-v', `${dockerExecutorPath}:/executor:ro`,
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
        proc.on('error', (err) => resolve({ success: false, stdout: '', stderr: err.message, exitCode: null }));
        proc.on('close', (code) => resolve({
            success: code === 0,
            stdout: stdout || '',
            stderr: stderr || '',
            exitCode: code === null ? 1 : code
        }));
    });
}

// 🧩 Apply jobLimiter only on /run
// app.post('/run', jobLimiter.middleware(), async (req, res) => {
//     const { language, code, filename } = req.body;
//     if (!language || !code) {
//         return res.status(400).json({ error: 'Missing required fields: language, code' });
//     }
//     if (!LANGUAGE_IMAGES[language]) {
//         return res.status(400).json({
//             error: `Unsupported language: ${language}. Supported: ${Object.keys(LANGUAGE_IMAGES).join(', ')}`
//         });
//     }
//     if (code.length > MAX_OUTPUT) {
//         return res.status(400).json({
//             error: `Code size exceeds maximum allowed: ${MAX_OUTPUT} bytes`
//         });
//     }
//     const defaultFilenames = { node: 'index.js', python: 'main.py', cpp: 'main.cpp' };
//     const targetFilename = filename || defaultFilenames[language];
//     let workspacePath;
//     try {
//         const workspace = await createWorkspace(code, targetFilename);
//         workspacePath = workspace.workspacePath;
//         const result = await runInContainer(language, workspacePath, targetFilename);
//         res.json({ jobId: workspace.jobId, language, filename: targetFilename, ...result, timestamp: new Date().toISOString() });
//     } catch (error) {
//         console.error('Execution error:', error);
//         res.status(500).json({ error: 'Execution failed', message: error.message });
//     } finally {
//         if (workspacePath) await cleanupWorkspace(workspacePath);
//     }
// });

// ... (rest of your routes remain identical)

async function startServer() {

    // Connect to MongoDB
    await connectDB();

    // Auth and monitoring routes
    app.use('/auth', authRoutes);
    app.use('/monitoring', monitoringRoutes);

    await ensureWorkspaceBase();

    // Initialize cache managers
    await cacheManager.initialize();
    await dockerLayerCache.initialize();

    const executorDir = path.resolve(__dirname, '../executor');
    try {
        const scripts = await fs.readdir(executorDir);
        for (const script of scripts) {
            const scriptPath = path.join(executorDir, script);
            try {
                await fs.access(scriptPath, fs.constants.X_OK);
                console.log(`✅ ${script} is executable`);
            } catch {
                console.warn(`⚠️ ${script} might not be executable (check Docker build permissions)`);
            }
        }
    } catch (err) {
        console.error(`❌ Failed to read executor directory: ${err.message}`);
    }

    const httpServer = http.createServer(app);
    const wsConfig = {
        workspaceBase: WORKSPACE_BASE,
        dockerMemory: DOCKER_MEMORY,
        dockerCpu: DOCKER_CPU,
        dockerPids: DOCKER_PIDS,
        dockerTimeout: DOCKER_TIMEOUT
    };
    initWebSocketServer(httpServer, wsConfig);

    httpServer.listen(PORT, () => {
        console.log(`🚀 Zenith Runner API listening on port ${PORT}`);
        console.log(`📁 Workspace base: ${WORKSPACE_BASE}`);
        console.log(`🐳 Docker limits: ${DOCKER_MEMORY} RAM, ${DOCKER_CPU} CPU`);
        console.log(`⏱️  Timeout: ${DOCKER_TIMEOUT}s`);
        console.log(`🔒 Security: network=none, read-only, no-new-privileges`);
        console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}/ws/run`);
    });

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

