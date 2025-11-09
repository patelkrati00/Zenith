import WebSocket from 'ws';
import FormData from 'form-data';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const WS_URL = 'ws://localhost:3001/ws/run';

/**
 * Ensure Linux-compatible wheels exist locally
 */
function ensureWheels(pkg, version) {
    console.log(`📦 Downloading ${pkg}==${version} with Linux-compatible wheels...`);

    const wheelDir = path.join(__dirname, 'wheels');

    // Clean old wheels
    if (fs.existsSync(wheelDir)) {
        fs.readdirSync(wheelDir).forEach(f => fs.unlinkSync(path.join(wheelDir, f)));
    } else {
        fs.mkdirSync(wheelDir);
    }

    // Download Linux wheels inside Docker
    const dockerWheelDir = wheelDir.replace(/\\/g, '/'); // Windows path fix
    execSync(
        `docker run --rm -v "${dockerWheelDir}:/wheels" python:3.11-alpine sh -c "pip download ${pkg}==${version} -d /wheels"`,
        { stdio: 'inherit' }
    );

    return wheelDir;
}

/**
 * Upload Python project with wheels and main.py
 */
async function uploadPythonProject() {
    console.log('\n📤 Uploading Python project with dependencies...\n');

    const form = new FormData();

    // main.py
    form.append('files', Buffer.from(`import sys
import requests

print('Testing Python dependency installation...')
print('Python version:', sys.version.split()[0])
print('Requests version:', requests.__version__)
print('✅ Dependencies working correctly!')
`), {
        filename: 'main.py',
        contentType: 'text/plain'
    });

    // Ensure Linux wheels are downloaded
    const wheelDir = ensureWheels('requests', '2.31.0');

    // Append all .whl files
    const wheelFiles = fs.readdirSync(wheelDir).filter(f => f.endsWith('.whl'));
    wheelFiles.forEach(file => {
        const filePath = path.join(wheelDir, file);
        form.append('files', fs.createReadStream(filePath), {
            filename: file,
            contentType: 'application/octet-stream'
        });
    });

    // Upload project
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: '/projects/upload',
            method: 'POST',
            headers: form.getHeaders()
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    const result = JSON.parse(data);
                    console.log('✅ Upload successful');
                    console.log(`   Workspace ID: ${result.workspaceId}\n`);
                    resolve(result.workspaceId);
                } else {
                    console.error(`❌ Upload failed: ${res.statusCode}`);
                    reject(new Error(data));
                }
            });
        });

        req.on('error', reject);
        form.pipe(req);
    });
}

/**
 * Run project offline in container (as root)
 */
function runProject(workspaceId) {
    return new Promise((resolve, reject) => {
        console.log('🐍 Running Python project with offline dependency installation...\n');
        console.log('='.repeat(60));

        const ws = new WebSocket(WS_URL);
        let hasError = false;

        ws.on('open', () => {
            ws.send(JSON.stringify({
                language: 'python',
                workspaceId: workspaceId,
                command: 'python3 -m pip install --no-index --find-links=/workspace/wheels *.whl && python3 /workspace/main.py'
            }));
        });

        ws.on('message', (data) => {
            const msg = JSON.parse(data.toString());
            switch (msg.type) {
                case 'info': console.log(`ℹ️  ${msg.data}`); break;
                case 'stdout': process.stdout.write(msg.data); break;
                case 'stderr': process.stderr.write(msg.data); break;
                case 'exit':
                    console.log('='.repeat(60));
                    console.log(`\n🏁 Exit code: ${msg.code}\n`);
                    ws.close();
                    if (msg.code === 0) resolve();
                    else reject(new Error(`Exit code: ${msg.code}`));
                    break;
                case 'error':
                    console.error(`❌ ERROR: ${msg.data}`);
                    hasError = true;
                    ws.close();
                    reject(new Error(msg.data));
                    break;
            }
        });

        ws.on('error', (error) => { console.error('❌ WebSocket error:', error.message); reject(error); });
        ws.on('close', () => { if (!hasError) setTimeout(() => resolve(), 100); });

        setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
                reject(new Error('Test timeout (90s)'));
            }
        }, 90000);
    });
}

/**
 * Run the full test
 */
async function runTest() {
    console.log('\n🧪 Testing Python Dependency Installation (automatic)\n');

    try {
        // Make sure workspace is fresh
        const workspaceRoot = path.join(__dirname, 'tmp_workspace');
        if (fs.existsSync(workspaceRoot)) fs.rmSync(workspaceRoot, { recursive: true, force: true });

        const workspaceId = await uploadPythonProject();
        await runProject(workspaceId);
        console.log('✅ Test passed!\n');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        process.exit(1);
    }
}

runTest();
