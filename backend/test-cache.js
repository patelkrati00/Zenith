import http from 'http';

const API_URL = 'http://localhost:3001';

/**
 * Make HTTP request
 */
function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, API_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: data ? {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(JSON.stringify(data))
            } : {}
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const result = {
                        status: res.statusCode,
                        headers: res.headers,
                        data: body ? JSON.parse(body) : null
                    };
                    resolve(result);
                } catch (error) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

/**
 * Test 1: Check cache statistics
 */
async function testCacheStats() {
    console.log('\n📊 Test 1: Cache Statistics');
    console.log('='.repeat(60));

    const result = await makeRequest('GET', '/cache/stats');

    if (result.status === 200) {
        console.log('✅ Cache stats retrieved');
        console.log('\n📦 Dependency Cache:');
        console.log('   Hits:', result.data.dependencyCache.hits);
        console.log('   Misses:', result.data.dependencyCache.misses);
        console.log('   Hit Rate:', result.data.dependencyCache.hitRate);
        console.log('   Cache Size:', result.data.dependencyCache.cacheSize);
        console.log('   Entries:', result.data.dependencyCache.entries);

        console.log('\n🐳 Docker Layer Cache:');
        console.log('   Builds:', result.data.dockerLayerCache.builds);
        console.log('   Cache Hits:', result.data.dockerLayerCache.cacheHits);
        console.log('   Cache Misses:', result.data.dockerLayerCache.cacheMisses);
        console.log('   Hit Rate:', result.data.dockerLayerCache.hitRate);
        console.log('   Cached Images:', result.data.dockerLayerCache.cachedImages);
    } else {
        console.log('❌ Failed:', result.status);
    }
}

/**
 * Test 2: Execute same code multiple times (test caching)
 */
/**
 * Test 2: Execute same code multiple times (test caching)
 */
async function testCachePerformance() {
    console.log('\n⚡ Test 2: Cache Performance');
    console.log('='.repeat(60));

    const testCode = {
        language: 'node',
        code: `console.log('Testing cache performance');
const start = Date.now();
for(let i = 0; i < 1000000; i++) {}
console.log('Time:', Date.now() - start, 'ms');`,
        filename: 'cache-test.js'
    };

    console.log('📤 Running same code 3 times...\n');

    const times = [];
    let previousDuration = null;

    for (let i = 1; i <= 3; i++) {
        const start = Date.now();
        const result = await makeRequest('POST', '/run', testCode);
        const duration = Date.now() - start;
        times.push(duration);

        // ✅ show check if it's faster than the previous run
        const marker =
            i === 1 ? '❌' : duration < previousDuration ? '✅' : '❌';
        previousDuration = duration;

        if (result.status === 200) {
            console.log(`   Run ${i}: ${duration}ms (${marker})`);
        } else {
            console.log(`   Run ${i}: Failed (${result.status})`);
        }

        // Short pause between runs
        await new Promise(r => setTimeout(r, 500));
    }

    console.log('\n📈 Performance Summary:');
    console.log(`   First run: ${times[0]}ms`);
    console.log(`   Second run: ${times[1]}ms (${times[1] < times[0] ? 'faster' : 'slower'})`);
    console.log(`   Third run: ${times[2]}ms (${times[2] < times[1] ? 'faster' : 'slower'})`);

    if (times[1] < times[0] || times[2] < times[1]) {
        console.log('   ✅ Cache appears to be working!');
    } else {
        console.log('   ⚠️  No significant performance improvement detected');
    }
}


/**
 * Test 3: Test with dependencies (Node.js)
 */
async function testNodeDependencies() {
    console.log('\n📦 Test 3: Node.js Dependencies');
    console.log('='.repeat(60));

    // Note: This test requires the /projects API
    console.log('⚠️  This test requires multi-file upload support');
    console.log('   Skipping for now...');
}

/**
 * Test 4: Clear cache
 */
async function testClearCache() {
    console.log('\n🗑️  Test 4: Clear Cache');
    console.log('='.repeat(60));

    console.log('📤 Clearing cache...');
    const result = await makeRequest('DELETE', '/cache/clear');

    if (result.status === 200) {
        console.log('✅ Cache cleared successfully');

        // Check stats after clearing
        await new Promise(r => setTimeout(r, 500));
        const statsResult = await makeRequest('GET', '/cache/stats');

        if (statsResult.status === 200) {
            console.log('\n📊 Cache stats after clearing:');
            console.log('   Entries:', statsResult.data.dependencyCache.entries);
            console.log('   Cache Size:', statsResult.data.dependencyCache.cacheSize);
        }
    } else {
        console.log('❌ Failed to clear cache:', result.status);
    }
}

/**
 * Run all tests
 */
async function runTests() {
    console.log('\n🧪 Testing Dependency Caching & Optimization\n');

    try {
        await testCacheStats();
        await new Promise(r => setTimeout(r, 1000));

        await testCachePerformance();
        await new Promise(r => setTimeout(r, 1000));

        await testNodeDependencies();
        await new Promise(r => setTimeout(r, 1000));

        // Uncomment to test cache clearing
        // await testClearCache();

        console.log('\n✨ All tests completed!\n');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        process.exit(1);
    }
}

runTests();
