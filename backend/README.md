# Zenith Backend Runner API

Backend service for executing code in sandboxed Docker containers.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env

# 3. Start server
npm start
```

## API Endpoints

### `POST /run`
Execute code in a sandboxed container.

**Request:**
```json
{
  "language": "node",
  "code": "console.log('Hello World');",
  "filename": "index.js"
}
```

**Response:**
```json
{
  "jobId": "abc123",
  "language": "node",
  "filename": "index.js",
  "success": true,
  "stdout": "Hello World\n",
  "stderr": "",
  "exitCode": 0,
  "timestamp": "2025-11-04T13:40:00.000Z"
}
```

### `GET /health`
Health check endpoint.

## Supported Languages

- `node` — Node.js (v18)
- `python` — Python 3.11
- `cpp` — C/C++ (GCC 12)

## Security Features

- Network isolation (`--network=none`)
- Memory limit (256MB)
- CPU limit (0.5 cores)
- Process limit (64 PIDs)
- Read-only filesystem
- No privilege escalation
- 30s execution timeout
