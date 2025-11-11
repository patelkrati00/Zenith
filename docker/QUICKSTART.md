# Docker Quick Start Guide

## 🚀 Quick Commands

### Build All Images (5-10 minutes)
```bash
cd f:\CodeEditor\docker
bash build.sh
```

### Start Full Stack
```bash
cd f:\CodeEditor\docker
docker-compose up -d
```

### Check Status
```bash
docker-compose ps
docker-compose logs -f
```

### Stop Everything
```bash
docker-compose down
```

## 📦 Individual Image Builds

```bash
cd f:\CodeEditor\docker

# Node.js
docker build -f node.Dockerfile -t zenith-ide/node:latest .

# Python
docker build -f python.Dockerfile -t zenith-ide/python:latest .

# C/C++
docker build -f cpp.Dockerfile -t zenith-ide/cpp:latest .

# Java
docker build -f java.Dockerfile -t zenith-ide/java:latest .
```

## ⚙️ Use Custom Images

1. **Copy environment template:**
```bash
cd f:\CodeEditor\backend
cp .env.example .env
```

2. **Edit `.env` and uncomment:**
```env
DOCKER_IMAGE_NODE=zenith-ide/node:latest
DOCKER_IMAGE_PYTHON=zenith-ide/python:latest
DOCKER_IMAGE_CPP=zenith-ide/cpp:latest
DOCKER_IMAGE_JAVA=zenith-ide/java:latest
```

3. **Restart backend:**
```bash
npm start
```

## 🧪 Test Custom Images

```bash
cd f:\CodeEditor\backend

# Test Node.js with dependencies
node test-node-deps.js

# Test Python with dependencies
node test-python-deps.js

# Test WebSocket streaming
node test-ws-client.js
```

## 🔍 Troubleshooting

### Images not found
```bash
docker images | grep zenith-ide
# If empty, run build.sh again
```

### Build fails on Windows
```bash
# Use Git Bash or WSL
bash build.sh

# Or build individually with PowerShell
docker build -f node.Dockerfile -t zenith-ide/node:latest .
```

### Permission denied
```bash
# Make script executable
chmod +x build.sh
```

### Docker daemon not running
```bash
# Start Docker Desktop
# Or on Linux:
sudo systemctl start docker
```

## 📊 Image Sizes

| Image | Size |
|-------|------|
| Node.js | ~180MB |
| Python | ~150MB |
| C/C++ | ~1.2GB |
| Java | ~330MB |

## 🎯 What's Next?

After building images:
1. ✅ Update `.env` to use custom images
2. ✅ Restart backend server
3. ✅ Test with dependency installation
4. ✅ Deploy with docker-compose (optional)

See `docker/README.md` for detailed documentation.
