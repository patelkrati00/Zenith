import WebSocket from 'ws';

const WS_URL = 'ws://localhost:3001/ws/run';

// Test code examples
const tests = {
    node: {
        language: 'node',
        code: `console.log('Hello from Node.js!');
console.log('Current time:', new Date().toISOString());
console.error('This is stderr');
console.log('Done!');`
    },
    python: {
        language: 'python',
        code: `import sys
print('Hello from Python!')
print('Python version:', sys.version)
print('Done!', file=sys.stderr)`
    },
    cpp: {
        language: 'cpp',
        code: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello from C++!" << endl;
    cout << "Simple calculation: 2 + 2 = " << (2 + 2) << endl;
    return 0;
}`
    }
};

function runTest(testName) {
    return new Promise((resolve, reject) => {
        console.log(`\n${'='.repeat(50)}`);
        console.log(`🧪 Testing: ${testName.toUpperCase()}`);
        console.log('='.repeat(50));

        const ws = new WebSocket(WS_URL);
        let hasError = false;

        ws.on('open', () => {
            console.log('✅ Connected to WebSocket');
            ws.send(JSON.stringify(tests[testName]));
        });

        ws.on('message', (data) => {
            const msg = JSON.parse(data.toString());
            
            switch (msg.type) {
                case 'info':
                    console.log(`ℹ️  INFO: ${msg.data}`);
                    break;
                case 'stdout':
                    process.stdout.write(`📤 STDOUT: ${msg.data}`);
                    break;
                case 'stderr':
                    process.stderr.write(`📥 STDERR: ${msg.data}`);
                    break;
                case 'exit':
                    console.log(`🏁 EXIT: ${msg.data} (code: ${msg.code})`);
                    ws.close();
                    if (msg.code === 0) {
                        resolve();
                    } else {
                        reject(new Error(`Exit code: ${msg.code}`));
                    }
                    break;
                case 'error':
                    console.error(`❌ ERROR: ${msg.data}`);
                    hasError = true;
                    ws.close();
                    reject(new Error(msg.data));
                    break;
                default:
                    console.log(`📨 ${msg.type}: ${msg.data}`);
            }
        });

        ws.on('error', (error) => {
            console.error('❌ WebSocket error:', error.message);
            reject(error);
        });

        ws.on('close', () => {
            console.log('🔌 Connection closed');
            if (!hasError) {
                setTimeout(() => resolve(), 100);
            }
        });

        // Timeout after 10 seconds
        setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
                reject(new Error('Test timeout'));
            }
        }, 10000);
    });
}

async function runAllTests() {
    console.log('\n🚀 Starting WebSocket Tests\n');
    
    const testNames = process.argv[2] ? [process.argv[2]] : Object.keys(tests);
    
    for (const testName of testNames) {
        if (!tests[testName]) {
            console.error(`❌ Unknown test: ${testName}`);
            continue;
        }

        try {
            await runTest(testName);
            console.log(`✅ Test ${testName} passed`);
        } catch (error) {
            console.error(`❌ Test ${testName} failed:`, error.message);
        }

        // Wait a bit between tests
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n✨ All tests completed\n');
    process.exit(0);
}

runAllTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
