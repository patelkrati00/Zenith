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

### `POST /run` (HTTP - Non-streaming)
Execute code in a sandboxed container (returns after completion).

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

### `WS /ws/run` (WebSocket - Real-time streaming)
Execute code with real-time output streaming.

**Send (Client → Server) - Option 1: Inline code**
```json
{
  "language": "node",
  "code": "console.log('Hello');",
  "filename": "index.js"
}
```

**Send (Client → Server) - Option 2: Existing workspace**
```json
{
  "language": "node",
  "workspaceId": "abc123",
  "command": "node index.js"
}
```

**Receive (Server → Client):**
```json
{"type": "info", "data": "Job abc123 started", "code": "abc123"}
{"type": "stdout", "data": "Hello\n"}
{"type": "stderr", "data": ""}
{"type": "exit", "data": "Process exited with code 0", "code": 0}
```

**Message Types:**
- `info` — Job started, general info
- `stdout` — Standard output stream
- `stderr` — Standard error stream
- `exit` — Process finished (includes exit code)
- `error` — Execution error

### `POST /projects/upload`
Upload multiple files or a zip archive to create a workspace.

**Request (multipart/form-data):**
```bash
curl -X POST http://localhost:3001/projects/upload \
  -F "files=@index.js" \
  -F "files=@package.json"
```

**Response:**
```json
{
  "workspaceId": "xyz789",
  "message": "Files uploaded successfully",
  "fileCount": 2,
  "files": [
    {"path": "index.js", "name": "index.js", "size": 42},
    {"path": "package.json", "name": "package.json", "size": 128}
  ]
}
```

### `POST /projects/create`
Create an empty workspace.

**Response:**
```json
{
  "workspaceId": "xyz789",
  "workspacePath": "/tmp/ide-runner/xyz789",
  "message": "Workspace created successfully"
}
```

### `GET /projects/:workspaceId/files`
List all files in a workspace.

### `GET /projects/:workspaceId/file/*`
Read a specific file from workspace.

### `PUT /projects/:workspaceId/file/*`
Write/update a file in workspace.

**Request:**
```json
{
  "content": "console.log('Updated!');"
}
```

### `DELETE /projects/:workspaceId`
Delete a workspace and all its files.

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
- Automatic container cleanup on disconnect
- Graceful shutdown with container termination

## Testing WebSocket

### Using the test client:
```bash
# Test all languages
node test-ws-client.js

# Test specific language
node test-ws-client.js node
node test-ws-client.js python
node test-ws-client.js cpp
```

### Using wscat:
```bash
# Install wscat globally (if not already installed)
npm install -g wscat

# Connect and send a test
wscat -c ws://localhost:3001/ws/run
> {"language":"node","code":"console.log('Hello WebSocket!')"}
```
