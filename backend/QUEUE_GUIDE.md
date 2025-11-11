# Job Queue Quick Reference

## 🚀 Quick Start

```bash
# Start server with queue enabled
npm start

# Test queue system
node test-queue.js
```

## 📊 Monitor Queue

### Get Current Status
```bash
curl http://localhost:3001/queue/status
```

### Response
```json
{
  "stats": {
    "queueLength": 3,
    "runningCount": 5,
    "totalProcessed": 142,
    "averageWaitTime": 1250,
    "averageExecutionTime": 3500
  },
  "queue": {
    "queued": [...],
    "running": [...]
  }
}
```

## 🎯 Job Management

### Check Job Status
```bash
curl http://localhost:3001/queue/job/abc123
```

### Cancel Queued Job
```bash
curl -X DELETE http://localhost:3001/queue/job/abc123
```

## ⚙️ Configuration

Edit `.env`:
```env
MAX_CONCURRENT_JOBS=5        # How many jobs run simultaneously
MAX_QUEUE_SIZE=100           # Max jobs waiting in queue
RATE_LIMIT_REQUESTS=10       # Max requests per minute per IP
RATE_LIMIT_WINDOW_MS=60000   # Rate limit window (1 minute)
```

## 📈 Queue Behavior

| Scenario | Behavior |
|----------|----------|
| Capacity available | Job starts immediately |
| At max capacity | Job added to queue |
| Queue full | Returns 503 error |
| Job completes | Next queued job starts |
| Job times out | Marked as failed, next job starts |

## 🔒 Rate Limiting

### Headers in Response
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1699876600
```

### Rate Limited Response (429)
```json
{
  "error": "Too many requests",
  "retryAfter": 45
}
```

## 🧪 Testing

```bash
# Test queue functionality
node test-queue.js

# Test specific scenarios
node test-queue.js --test=concurrent
node test-queue.js --test=ratelimit
node test-queue.js --test=overflow
```

## 📊 Statistics

The queue tracks:
- **Total queued** — All jobs ever submitted
- **Total processed** — Successfully completed jobs
- **Total failed** — Jobs that failed or timed out
- **Average wait time** — Time spent in queue
- **Average execution time** — Time spent running

## 🎯 Best Practices

1. **Monitor queue length** — If consistently full, increase capacity
2. **Check rate limits** — Adjust based on usage patterns
3. **Set appropriate timeouts** — Balance between allowing long jobs and preventing hangs
4. **Use priority** — For important jobs (requires code modification)
5. **Handle 503 errors** — Implement retry logic in clients

## 🚨 Troubleshooting

### Queue always full
- Increase `MAX_QUEUE_SIZE`
- Increase `MAX_CONCURRENT_JOBS`
- Reduce job execution time
- Check for stuck jobs

### Too many rate limit errors
- Increase `RATE_LIMIT_REQUESTS`
- Implement exponential backoff in client
- Use authenticated rate limiting (per-user)

### Jobs timing out
- Increase `DOCKER_TIMEOUT_SECONDS`
- Optimize code execution
- Pre-install dependencies in Docker images

### High memory usage
- Reduce `MAX_CONCURRENT_JOBS`
- Reduce `DOCKER_MEMORY_LIMIT`
- Clear completed job history more frequently

## 📚 API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/queue/status` | GET | Get queue statistics |
| `/queue/job/:id` | GET | Get job status |
| `/queue/job/:id` | DELETE | Cancel queued job |
| `/run` | POST | Submit job (queued if at capacity) |
| `/health` | GET | Health check with queue stats |
