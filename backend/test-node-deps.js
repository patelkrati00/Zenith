import WebSocket from 'ws';
import FormData from 'form-data';
import http from 'http';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const API_URL = 'http://127.0.0.1:3001';
const WS_URL = 'ws://127.0.0.1:3001/ws/run';

const PROJECT_DIR = path.resolve('./temp_project');

// 🧰 Ensure local project with dependencies is ready
async function prepareProject() {
    console.log('\n📦 Preparing Node.js project locally...\n');

    // Create temporary folder
    if (!fs.existsSync(PROJECT_DIR)) {
        fs.mkdirSync(PROJECT_DIR);
    }

    // Create package.json (with nanoid)
    const pkg = {
        name: 'test-project',
        version: '1.0.0',
        type: "module",
        dependencies: { nanoid: '^5.0.1' }
    };
    fs.writeFileSync(path.join(PROJECT_DIR, 'package.json'), JSON.stringify(pkg, null, 2));

    // Create index.js file
    const code = `
import { nanoid } from 'nanoid';
console.log('Testing dependency installation...');
console.log('Generated ID:', nanoid());
console.log('✅ Dependencies working correctly!');
`;
    fs.writeFileSync(path.join(PROJECT_DIR, 'index.js'), code.trim());

    // Install dependencies before upload (so Docker won’t need network)
    console.log('🛠️ Installing dependencies locally...');
    execSync('npm install', { cwd: PROJECT_DIR, stdio: 'inherit' });
    console.log('✅ Local install complete.\n');
}

/**
 * Upload the prepared project
 */
async function uploadNodeProject() {
    console.log('\n📤 Uploading Node.js project with dependencies...\n');

    // Create a tar archive (quoted path handles spaces)
execSync(`tar -czf project.tar.gz -C "${PROJECT_DIR}" .`);
    console.log('📦 Created project.tar.gz\n');

    const form = new FormData();
    form.append('file', fs.createReadStream('project.tar.gz'));

    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: '/projects/upload',
            method: 'POST',
            headers: form.getHeaders(),
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    const result = JSON.parse(data);
                    console.log('✅ Upload successful');
                    console.log(`   Workspace ID: ${result.workspaceId}\n`);
                    // cleanup
                    fs.unlinkSync('project.tar.gz');
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
 * Run the project via WebSocket
 */
function runProject(workspaceId) {
    return new Promise((resolve, reject) => {
        console.log('🚀 Running project with dependency installation...\n');
        console.log('='.repeat(60));

        const ws = new WebSocket(WS_URL);
        let hasError = false;

        ws.on('open', () => {
            ws.send(JSON.stringify({
                language: 'node',
                workspaceId,
                command: 'node index.js'
            }));
        });

        ws.on('message', (data) => {
            const msg = JSON.parse(data.toString());
            switch (msg.type) {
                case 'info':
                    console.log(`ℹ️  ${msg.data}`);
                    break;
                case 'stdout':
                    process.stdout.write(msg.data);
                    break;
                case 'stderr':
                    process.stderr.write(msg.data);
                    break;
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

        ws.on('error', (error) => {
            console.error('❌ WebSocket error:', error.message);
            reject(error);
        });

        ws.on('close', () => {
            if (!hasError) setTimeout(() => resolve(), 100);
        });

        setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
                reject(new Error('Test timeout (60s)'));
            }
        }, 60000);
    });
}

/**
 * Run the test
 */
async function runTest() {
    console.log('\n🧪 Testing Node.js Dependency Installation\n');
    try {
        await prepareProject();
        const workspaceId = await uploadNodeProject();
        await runProject(workspaceId);
        console.log('✅ Test passed!\n');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Test failed:');
        console.error(error);
        process.exit(1);
    }
}

runTest();
