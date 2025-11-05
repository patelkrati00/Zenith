import FormData from 'form-data';
import fs from 'fs';
import http from 'http';

const API_URL = 'http://localhost:3001';

/**
 * Test uploading multiple files
 */
async function testMultiFileUpload() {
    console.log('\n📤 Test 1: Upload Multiple Files');
    console.log('='.repeat(50));

    const form = new FormData();
    
    // Create test files
    form.append('files', Buffer.from('console.log("Hello from index.js");'), {
        filename: 'index.js',
        contentType: 'text/javascript'
    });
    
    form.append('files', Buffer.from('export function greet(name) {\n  return `Hello, ${name}!`;\n}'), {
        filename: 'utils.js',
        contentType: 'text/javascript'
    });
    
    form.append('files', Buffer.from('{\n  "name": "test-project",\n  "version": "1.0.0"\n}'), {
        filename: 'package.json',
        contentType: 'application/json'
    });

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
                    console.log(`   Workspace ID: ${result.workspaceId}`);
                    console.log(`   Files: ${result.fileCount}`);
                    result.files.forEach(f => {
                        console.log(`   - ${f.path} (${f.size} bytes)`);
                    });
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
 * Test creating an empty workspace
 */
async function testCreateWorkspace() {
    console.log('\n📁 Test 2: Create Empty Workspace');
    console.log('='.repeat(50));

    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: '/projects/create',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    const result = JSON.parse(data);
                    console.log('✅ Workspace created');
                    console.log(`   Workspace ID: ${result.workspaceId}`);
                    resolve(result.workspaceId);
                } else {
                    console.error(`❌ Failed: ${res.statusCode}`);
                    reject(new Error(data));
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

/**
 * Test writing a file to workspace
 */
async function testWriteFile(workspaceId) {
    console.log('\n✏️  Test 3: Write File to Workspace');
    console.log('='.repeat(50));

    const fileContent = 'print("Hello from Python!")';
    const postData = JSON.stringify({ content: fileContent });

    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: `/projects/${workspaceId}/file/main.py`,
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    const result = JSON.parse(data);
                    console.log('✅ File written');
                    console.log(`   Path: ${result.path}`);
                    resolve(workspaceId);
                } else {
                    console.error(`❌ Failed: ${res.statusCode}`);
                    reject(new Error(data));
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

/**
 * Test listing files in workspace
 */
async function testListFiles(workspaceId) {
    console.log('\n📋 Test 4: List Files in Workspace');
    console.log('='.repeat(50));

    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: `/projects/${workspaceId}/files`,
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    const result = JSON.parse(data);
                    console.log('✅ Files listed');
                    console.log(`   Count: ${result.fileCount}`);
                    result.files.forEach(f => {
                        console.log(`   - ${f.path} (${f.size} bytes)`);
                    });
                    resolve(workspaceId);
                } else {
                    console.error(`❌ Failed: ${res.statusCode}`);
                    reject(new Error(data));
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

/**
 * Test reading a file from workspace
 */
async function testReadFile(workspaceId, filepath) {
    console.log('\n📖 Test 5: Read File from Workspace');
    console.log('='.repeat(50));

    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: `/projects/${workspaceId}/file/${filepath}`,
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    const result = JSON.parse(data);
                    console.log('✅ File read');
                    console.log(`   Path: ${result.path}`);
                    console.log(`   Content:\n${result.content}`);
                    resolve(workspaceId);
                } else {
                    console.error(`❌ Failed: ${res.statusCode}`);
                    reject(new Error(data));
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

/**
 * Test deleting a workspace
 */
async function testDeleteWorkspace(workspaceId) {
    console.log('\n🗑️  Test 6: Delete Workspace');
    console.log('='.repeat(50));

    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: `/projects/${workspaceId}`,
            method: 'DELETE'
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log('✅ Workspace deleted');
                    resolve();
                } else {
                    console.error(`❌ Failed: ${res.statusCode}`);
                    reject(new Error(data));
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

/**
 * Run all tests
 */
async function runTests() {
    console.log('\n🚀 Starting Project Upload Tests\n');

    try {
        // Test 1: Upload multiple files
        const workspaceId1 = await testMultiFileUpload();
        await new Promise(r => setTimeout(r, 500));

        // Test 2: Create empty workspace and add file
        const workspaceId2 = await testCreateWorkspace();
        await new Promise(r => setTimeout(r, 500));

        // Test 3: Write file to workspace
        await testWriteFile(workspaceId2);
        await new Promise(r => setTimeout(r, 500));

        // Test 4: List files
        await testListFiles(workspaceId2);
        await new Promise(r => setTimeout(r, 500));

        // Test 5: Read file
        await testReadFile(workspaceId2, 'main.py');
        await new Promise(r => setTimeout(r, 500));

        // Test 6: Delete workspaces
        await testDeleteWorkspace(workspaceId1);
        await testDeleteWorkspace(workspaceId2);

        console.log('\n✨ All tests passed!\n');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        process.exit(1);
    }
}

runTests();
