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
  - Auto-installs dependencies from `package.json` using `npm ci` or `npm install`
  - Detects entry point from `package.json` main field or uses `index.js`
  - Default image: `node:18-alpine`
  - Custom image: Set `DOCKER_IMAGE_NODE` in `.env`
- `python` — Python 3.11
  - Auto-installs dependencies from `requirements.txt` using `pip` in virtualenv
  - Entry point: `main.py` (or `app.py`, `__main__.py`, `run.py`)
  - Default image: `python:3.11-alpine`
  - Custom image: Set `DOCKER_IMAGE_PYTHON` in `.env`
- `cpp` — C/C++ (GCC latest)
  - Compiles with `gcc` (C) or `g++` (C++) based on file extension
  - Supports `-std=c++17` by default
  - Default image: `gcc:latest`
  - Custom image: Set `DOCKER_IMAGE_CPP` in `.env`
- `java` — Java (OpenJDK 17)
  - Auto-compiles all `.java` files with `javac`
  - Executes specified main class
  - Default image: `eclipse-temurin:17-jdk-alpine`
  - Custom image: Set `DOCKER_IMAGE_JAVA` in `.env`

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

## Executor Scripts

Executor scripts handle language-specific compilation, dependency installation, and execution inside Docker containers. They are mounted at `/executor` inside containers.

### Available Scripts

- `run_node.sh` — Node.js executor
  - Detects `package.json` and runs `npm ci` (with lockfile) or `npm install`
  - Auto-detects entry point from package.json or uses default
  - Timeout protection on npm operations

- `run_python.sh` — Python executor
  - Creates virtualenv in `/tmp` (writable tmpfs)
  - Installs packages from `requirements.txt` using pip
  - Activates venv before running code

- `run_cpp.sh` — C/C++ executor
  - Auto-detects C vs C++ based on file extension
  - Compiles with appropriate compiler (gcc/g++)
  - Runs compiled binary with timeout

- `run_java.sh` — Java executor
  - Compiles all `.java` files in workspace
  - Extracts main class name from source file
  - Executes with proper classpath

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

## Testing Dependency Installation

### Test Node.js with npm packages:
```bash
node test-node-deps.js
```

This test:
1. Uploads a project with `package.json` (includes nanoid dependency)
2. Runs npm install inside the container
3. Executes code that uses the installed package
4. Verifies successful execution

### Test Python with pip packages:
```bash
node test-python-deps.js
```

This test:
1. Uploads a project with `requirements.txt` (includes requests)
2. Creates virtualenv and installs packages
3. Executes code that imports the package
4. Verifies successful execution

**Note**: Python tests may take 60-90 seconds due to pip installation time.
