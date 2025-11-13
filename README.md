# Zenith IDE — Online Code Execution Platform 🚀

A production-ready, full-stack online code execution IDE with real-time streaming, Docker isolation, and enterprise features.

## 🌟 Features

### Core Execution
- ✅ **Real-time code execution** with WebSocket streaming
- ✅ **Multi-language support**: Node.js, Python, C++, C, Java
- ✅ **Docker isolation** with resource limits
- ✅ **Interactive terminal** with xterm.js
- ✅ **PTY support** for stdin input
- ✅ **Auto-dependency installation** (npm, pip)

### Performance & Scalability
- ✅ **Job queue system** with concurrency control
- ✅ **Rate limiting** (IP-based, token bucket)
- ✅ **Dependency caching** (npm, pip, binaries)
- ✅ **Docker layer caching** for faster builds
- ✅ **Resource monitoring** (CPU, memory)

### Developer Experience
- ✅ **Monaco Editor** (VS Code editor)
- ✅ **Project detection** (auto-detect entry points)
- ✅ **Language selector** with icons
- ✅ **Project templates** (Express, Flask, etc.)
- ✅ **Smart run button** with auto-detection
- ✅ **Resizable output panel**

### Enterprise Features
- ✅ **JWT authentication** with role-based access
- ✅ **Real-time monitoring** and analytics
- ✅ **Admin dashboard** with metrics
- ✅ **Health checks** and status endpoints
- ✅ **Error tracking** and logging
- ✅ **Execution history** and statistics

## 📁 Project Structure

```
CodeEditor/
├── backend/                    # Node.js Express backend
│   ├── server.js              # Main server file
│   ├── ws-runner.js           # WebSocket code execution
│   ├── pty-runner.js          # PTY support for interactive input
│   ├── auth.js                # JWT authentication
│   ├── monitoring.js          # Metrics and analytics
│   ├── queue.js               # Job queue system
│   ├── rate-limiter.js        # Rate limiting
│   ├── cache-manager.js       # Dependency caching
│   ├── docker-layer-cache.js  # Docker image caching
│   ├── projects.js            # Multi-file project management
│   ├── routes/
│   │   ├── auth.js            # Auth endpoints
│   │   └── monitoring.js      # Monitoring endpoints
│   └── package.json
│
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── EditorPage/           # Main editor page
│   │   │   ├── OutputPanel/          # Code execution panel
│   │   │   ├── Terminal/             # xterm.js terminal
│   │   │   ├── LanguageSelector/     # Language dropdown
│   │   │   ├── SmartRunButton/       # Auto-detect run button
│   │   │   ├── TemplateSelector/     # Project templates
│   │   │   └── AdminDashboard/       # Metrics dashboard
│   │   ├── hooks/
│   │   │   └── useWebSocket.js       # WebSocket hook
│   │   └── utils/
│   │       ├── projectDetector.js    # Auto-detect projects
│   │       └── projectTemplates.js   # Pre-configured templates
│   └── package.json
│
├── executor/                   # Language-specific executors
│   ├── run_node.sh            # Node.js executor
│   ├── run_python.sh          # Python executor
│   ├── run_cpp.sh             # C++ executor
│   ├── run_c.sh               # C executor
│   └── run_java.sh            # Java executor
│
├── docker/                     # Docker images
│   ├── node/                  # Node.js image
│   ├── python/                # Python image
│   ├── cpp/                   # C++ image
│   └── java/                  # Java image
│
├── docker-compose.yml          # Docker Compose config
├── .env.example               # Environment variables template
└── README.md                  # This file
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Docker** and Docker Compose
- **Git**

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd CodeEditor

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Configuration

```bash
# Copy environment file
cd backend
cp .env.example .env

# Edit .env with your settings
# Important: Change JWT_SECRET in production!
```

### Build Docker Images

```bash
# Build all language images
docker-compose build

# Or build individually
docker build -t zenith-ide/node ./docker/node
docker build -t zenith-ide/python ./docker/python
docker build -t zenith-ide/cpp ./docker/cpp
docker build -t zenith-ide/java ./docker/java
```

### Run Development Servers

```bash
# Terminal 1: Start backend
cd backend
npm start
# Backend runs on http://localhost:3001

# Terminal 2: Start frontend
cd frontend
npm run dev
# Frontend runs on http://localhost:5173
```

### Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001
- **Health Check:** http://localhost:3001/health
- **Metrics:** http://localhost:3001/monitoring/metrics

## 📖 API Documentation

### Code Execution

#### WebSocket Endpoint

```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:3001/ws/run');

// Send code for execution
ws.send(JSON.stringify({
    language: 'node',      // node, python, cpp, c, java
    code: 'console.log("Hello World");',
    filename: 'index.js'   // optional
}));

// Receive output
ws.onmessage = (event) => {
    const { type, data } = JSON.parse(event.data);
    // type: 'info', 'stdout', 'stderr', 'exit', 'error'
};
```

### Authentication

```bash
# Register user
POST /auth/register
{
    "username": "john",
    "password": "secret123"
}

# Login
POST /auth/login
{
    "username": "john",
    "password": "secret123"
}
# Returns: { token, user }

# Use token in requests
Authorization: Bearer <token>
```

### Monitoring

```bash
# Get metrics
GET /monitoring/metrics

# Get execution history
GET /monitoring/history?limit=100

# Get health status
GET /monitoring/health

# Get statistics
GET /monitoring/statistics
```

### Queue Management

```bash
# Get queue status
GET /queue/status

# Cancel job
POST /queue/cancel/:jobId
```

### Cache Management

```bash
# Get cache stats
GET /cache/stats

# Clear cache
DELETE /cache/clear
```

## 🔧 Configuration

### Environment Variables

```env
# Server
PORT=3001

# Docker Limits
DOCKER_MEMORY_LIMIT=256m
DOCKER_CPU_LIMIT=0.5
DOCKER_PIDS_LIMIT=64
DOCKER_TIMEOUT_SECONDS=30

# Workspace
WORKSPACE_BASE_PATH=/tmp/ide-runner
MAX_OUTPUT_SIZE=1048576

# Queue
MAX_CONCURRENT_JOBS=5
MAX_QUEUE_SIZE=100

# Rate Limiting
RATE_LIMIT_REQUESTS=10
RATE_LIMIT_WINDOW_MS=60000

# Cache
CACHE_DIR=/tmp/ide-cache
MAX_CACHE_SIZE=1073741824
MAX_CACHE_AGE=604800000
MAX_CACHED_IMAGES=50

# Authentication
DISABLE_AUTH=true
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# PTY
ENABLE_PTY=false
```

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Test basic execution
node test-runner.js

# Test queue system
node test-queue.js

# Test caching
node test-cache.js
```

### Manual Testing

```bash
# Test code execution
curl -X POST http://localhost:3001/run \
  -H "Content-Type: application/json" \
  -d '{"language":"node","code":"console.log(\"Hello\");"}'

# Test health endpoint
curl http://localhost:3001/health

# Test metrics
curl http://localhost:3001/monitoring/metrics
```

## 📊 Supported Languages

| Language | Version | Package Manager | Compilation |
|----------|---------|----------------|-------------|
| Node.js  | 18      | npm            | No          |
| Python   | 3.11    | pip            | No          |
| C++      | GCC 12  | -              | Yes         |
| C        | GCC 12  | -              | Yes         |
| Java     | 17      | Maven          | Yes         |

## 🔒 Security Features

- ✅ Docker container isolation
- ✅ Resource limits (CPU, memory, PIDs)
- ✅ Network isolation
- ✅ Read-only root filesystem
- ✅ Execution timeouts
- ✅ Output size limits
- ✅ Rate limiting
- ✅ JWT authentication
- ✅ Password hashing
- ✅ Path traversal protection

## 📈 Performance Optimizations

- ✅ Dependency caching (npm, pip)
- ✅ Docker layer caching
- ✅ Job queue with concurrency control
- ✅ WebSocket for real-time streaming
- ✅ Automatic cleanup of workspaces
- ✅ LRU cache eviction
- ✅ Resource monitoring

## 🎯 Use Cases

- **Education:** Online coding platform for students
- **Interviews:** Technical interview platform
- **Prototyping:** Quick code testing and prototyping
- **Documentation:** Interactive code examples
- **Training:** Corporate training platforms
- **Competitions:** Coding competitions and hackathons

## 🛠️ Development

### Project Setup

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build
```

### Adding a New Language

1. Create executor script in `executor/run_<language>.sh`
2. Create Docker image in `docker/<language>/`
3. Add language to `LANGUAGE_IMAGES` in `server.js`
4. Update frontend language selector
5. Add project templates

### Debugging

```bash
# Enable debug logging
DEBUG=* npm start

# View Docker logs
docker logs <container_id>

# Monitor resource usage
docker stats
```

## 📚 Documentation

- [Step 1-2: Backend API & Security](./STEP1-2_SUMMARY.md)
- [Step 3: Workspace Management](./STEP3_SUMMARY.md)
- [Step 4: Executor Scripts](./STEP4_SUMMARY.md)
- [Step 5: Docker Images](./STEP5_SUMMARY.md)
- [Step 6: Job Queue](./STEP6_SUMMARY.md)
- [Step 7: Caching](./STEP7_SUMMARY.md)
- [Step 8: Frontend Integration](./STEP8_SUMMARY.md)
- [Step 9: Project Detection](./STEP9_SUMMARY.md)
- [Step 10: Advanced Features](./STEP10_SUMMARY.md)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 🙏 Acknowledgments

- **Monaco Editor** - VS Code's editor
- **xterm.js** - Terminal emulator
- **Docker** - Container platform
- **Express.js** - Web framework
- **React** - UI library

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review step-by-step guides

## 🗺️ Roadmap

### Completed ✅
- [x] Real-time code execution
- [x] Multi-language support
- [x] Docker isolation
- [x] Job queue system
- [x] Rate limiting
- [x] Dependency caching
- [x] Frontend integration
- [x] Project detection
- [x] Authentication
- [x] Monitoring dashboard

### Future Enhancements 🚧
- [ ] Database integration (PostgreSQL)
- [ ] File upload/download
- [ ] Collaborative editing
- [ ] Code sharing with URLs
- [ ] Syntax highlighting in output
- [ ] Debugger integration
- [ ] Git integration
- [ ] Kubernetes deployment
- [ ] OAuth login (Google, GitHub)
- [ ] Mobile app

---

**Built with ❤️ for developers, by developers**

**Star ⭐ this repo if you find it useful!**
