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
 * Test 1: Check queue status
 */
async function testQueueStatus() {
    console.log('\n📊 Test 1: Queue Status');
    console.log('='.repeat(60));

    const result = await makeRequest('GET', '/queue/status');

    if (result.status === 200) {
        console.log('✅ Queue status retrieved');
        console.log('   Stats:', JSON.stringify(result.data.stats, null, 2));
        console.log('   Queue:', JSON.stringify(result.data.queue, null, 2));
    } else {
        console.log('❌ Failed:', result.status);
    }
}

/**
 * Test 2: Submit multiple jobs concurrently
 */
async function testConcurrentJobs() {
    console.log('\n🚀 Test 2: Submit 10 Concurrent Jobs');
    console.log('='.repeat(60));

    const jobs = [];
    for (let i = 0; i < 10; i++) {
        const jobData = {
            language: 'node',
            code: `console.log('Job ${i + 1}'); 
for(let j = 0; j < 1000000000; j++) {} // Simulate work
console.log('Job ${i + 1} completed');`,
            filename: `job${i + 1}.js`
        };

        jobs.push(makeRequest('POST', '/run', jobData));
    }

    console.log('📤 Submitting 10 jobs...');
    const results = await Promise.all(jobs);

    let queued = 0;
    let running = 0;
    let errors = 0;

    results.forEach((result, i) => {
        if (result.status === 200) {
            running++;
            console.log(`   ✅ Job ${i + 1}: Started immediately`);
        } else if (result.status === 202) {
            queued++;
            console.log(`   ⏳ Job ${i + 1}: Queued`);
        } else {
            errors++;
            console.log(`   ❌ Job ${i + 1}: Error (${result.status})`);
        }
    });

    console.log(`\n📈 Results: ${running} running, ${queued} queued, ${errors} errors`);

    // Check queue status
    await new Promise(r => setTimeout(r, 1000));
    const queueStatus = await makeRequest('GET', '/queue/status');
    console.log('\n📊 Current Queue Status:');

    if (queueStatus.status === 200 && queueStatus.data && queueStatus.data.stats) {
        console.log('   Running:', queueStatus.data.stats.runningCount);
        console.log('   Queued:', queueStatus.data.stats.queueLength);
        console.log('   Total Processed:', queueStatus.data.stats.totalProcessed);
    } else {
        console.warn('   ⚠️  Could not fetch queue stats. Response:', queueStatus.status, queueStatus.data);
    }

}

/**
 * Test 3: Test rate limiting
 */
async function testRateLimiting() {
    console.log('\n⏱️  Test 3: Rate Limiting');
    console.log('='.repeat(60));

    console.log('📤 Sending 15 requests rapidly (limit is 10/minute)...');

    let allowed = 0;
    let blocked = 0;

    for (let i = 0; i < 15; i++) {
        const result = await makeRequest('GET', '/health');

        if (result.status === 200) {
            allowed++;
            const remaining = result.headers['x-ratelimit-remaining'];
            console.log(`   ✅ Request ${i + 1}: Allowed (${remaining} remaining)`);
        } else if (result.status === 429) {
            blocked++;
            const retryAfter = result.data.retryAfter;
            console.log(`   ❌ Request ${i + 1}: Rate limited (retry after ${retryAfter}s)`);
        }
    }

    console.log(`\n📈 Results: ${allowed} allowed, ${blocked} blocked`);
}

/**
 * Test 4: Job cancellation
 */


async function testJobCancellation() {
    console.log('\n🛑 Test 4: Job Cancellation');
    console.log('='.repeat(60));

    // Submit a long-running job
    const jobData = {
        language: 'node',
        code: `console.log('Starting long job...');
for(let i = 0; i < 10; i++) {
    console.log('Working... ' + i);
    for(let j = 0; j < 1000000000; j++) {}
}
console.log('Completed');`,
        filename: 'long-job.js'
    };

    console.log('📤 Submitting long-running job...');
    const submitResult = await makeRequest('POST', '/run', jobData);

    if (submitResult.status === 200 || submitResult.status === 202) {
        const jobId = submitResult.data.jobId;
        console.log(`   ✅ Job submitted: ${jobId}`);

        // Wait a bit
        await new Promise(r => setTimeout(r, 2000));

        // Try to cancel
        console.log('🛑 Attempting to cancel job...');
        const cancelResult = await makeRequest('DELETE', `/queue/job/${jobId}`);

        if (cancelResult.status === 200) {
            console.log('   ✅ Job cancelled successfully');
        } else {
            console.log(`   ⚠️  Cannot cancel: ${cancelResult.data?.message || 'Job not cancellable (already running or done)'}`);
        }
    } else {
        console.log('   ❌ Failed to submit job');
    }
}

/**
 * Test 5: Queue overflow
 */
async function testQueueOverflow() {
    console.log('\n💥 Test 5: Queue Overflow (Max 100 jobs)');
    console.log('='.repeat(60));

    console.log('📤 Attempting to queue 105 jobs...');

    let accepted = 0;
    let rejected = 0;

    for (let i = 0; i < 105; i++) {
        const jobData = {
            language: 'node',
            code: `console.log('Job ${i + 1}');`,
            filename: `overflow${i + 1}.js`
        };

        const result = await makeRequest('POST', '/run', jobData);

        if (result.status === 200 || result.status === 202) {
            accepted++;
        } else if (result.status === 503) {
            rejected++;
            if (rejected === 1) {
                console.log(`   ⚠️  Queue full at job ${i + 1}`);
            }
        }
    }

    console.log(`\n📈 Results: ${accepted} accepted, ${rejected} rejected`);
}

/**
 * Run all tests
 */
async function runTests() {
    console.log('\n🧪 Testing Job Queue and Rate Limiting\n');

    try {
        await testQueueStatus();
        await new Promise(r => setTimeout(r, 1000));

        await testConcurrentJobs();
        await new Promise(r => setTimeout(r, 2000));

        await testRateLimiting();
        await new Promise(r => setTimeout(r, 2000));


        await new Promise(r => setTimeout(r, 5000));


        await testJobCancellation();
        await new Promise(r => setTimeout(r, 2000));

        // Uncomment to test queue overflow (creates many jobs)
        // await testQueueOverflow();

        console.log('\n✨ All tests completed!\n');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        process.exit(1);
    }
}

runTests();
