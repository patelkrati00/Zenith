# Zenith IDE Docker Images

This directory contains Dockerfiles for all language runtime environments and the backend/frontend services.

## Language Runtime Images

### Node.js (`node.Dockerfile`)
- Base: `node:18-alpine`
- User: `runner` (UID 1000)
- Includes: Python3, make, g++ for native modules
- Size: ~180MB

### Python (`python.Dockerfile`)
- Base: `python:3.11-alpine`
- User: `runner` (UID 1000)
- Includes: gcc, build tools for native packages
- Size: ~150MB

### C/C++ (`cpp.Dockerfile`)
- Base: `gcc:13-bookworm`
- User: `runner` (UID 1000)
- Includes: make, cmake, full GCC toolchain
- Size: ~1.2GB

### Java (`java.Dockerfile`)
- Base: `eclipse-temurin:17-jdk-alpine`
- User: `runner` (UID 1000)
- Includes: OpenJDK 17 JDK
- Size: ~330MB

## Building Images

### Build all images:
```bash
cd f:\CodeEditor\docker
bash build.sh
```

### Build individual images:
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

## Using Custom Images

After building, update the image references in:

**`backend/server.js`:**
```javascript
const LANGUAGE_IMAGES = {
    node: 'zenith-ide/node:latest',
    python: 'zenith-ide/python:latest',
    cpp: 'zenith-ide/cpp:latest',
    java: 'zenith-ide/java:latest'
};
```

**`backend/ws-runner.js`:**
```javascript
const LANGUAGE_IMAGES = {
    node: 'zenith-ide/node:latest',
    python: 'zenith-ide/python:latest',
    cpp: 'zenith-ide/cpp:latest',
    java: 'zenith-ide/java:latest'
};
```

## Docker Compose

### Start all services:
```bash
cd f:\CodeEditor\docker
docker-compose up -d
```

### View logs:
```bash
docker-compose logs -f
```

### Stop services:
```bash
docker-compose down
```

### Rebuild and restart:
```bash
docker-compose up -d --build
```

## Security Features

All images implement security best practices:

1. **Non-root user**: All containers run as UID 1000 (runner/appuser)
2. **Minimal base images**: Alpine Linux where possible for smaller attack surface
3. **No unnecessary packages**: Only essential tools installed
4. **Health checks**: Built-in health monitoring
5. **Security updates**: Latest patches applied during build
6. **Read-only mounts**: Executor scripts mounted as read-only

## Image Sizes

| Image | Compressed | Uncompressed |
|-------|-----------|--------------|
| Node.js | ~65MB | ~180MB |
| Python | ~55MB | ~150MB |
| C/C++ | ~420MB | ~1.2GB |
| Java | ~120MB | ~330MB |

## Network Configuration

By default, containers spawned for code execution use `--network=none` for isolation.

For dependency installation (npm/pip), you have two options:

### Option 1: Enable network temporarily (development)
Change `--network=none` to `--network=bridge` in executor calls.

### Option 2: Pre-install dependencies (production - recommended)
Create custom images with common dependencies:

```dockerfile
FROM zenith-ide/node:latest

# Pre-install common packages
RUN npm install -g typescript ts-node nodemon

# Or copy package.json and install
COPY package.json .
RUN npm ci --only=production
```

## Maintenance

### Update base images:
```bash
docker pull node:18-alpine
docker pull python:3.11-alpine
docker pull gcc:13-bookworm
docker pull eclipse-temurin:17-jdk-alpine
```

### Rebuild with no cache:
```bash
docker build --no-cache -f node.Dockerfile -t zenith-ide/node:latest .
```

### Clean up old images:
```bash
docker image prune -a
```

## Production Deployment

For production, consider:

1. **Multi-stage builds**: Minimize final image size
2. **Image scanning**: Use tools like Trivy or Snyk
3. **Private registry**: Push to ECR, GCR, or Docker Hub private repo
4. **Version tags**: Use semantic versioning (e.g., `zenith-ide/node:1.0.0`)
5. **Automated builds**: Set up CI/CD pipeline for image builds
6. **Resource limits**: Set memory/CPU limits in docker-compose or k8s manifests
