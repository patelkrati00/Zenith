import { WebSocketServer } from "ws";
import { spawn, execSync } from "child_process";
import { nanoid } from "nanoid";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { monitoring } from "./monitoring.js";

// Get executor scripts directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const EXECUTOR_DIR = path.resolve(__dirname, "../executor");

/**
 * Convert a host path to a Docker-friendly POSIX path.
 */
function toDockerPosixPath(hostPath) {
  if (!hostPath) return hostPath;
  let p = path.resolve(hostPath);

  if (os.platform() !== "win32") {
    return p.split(path.sep).join("/");
  }

  p = p.split(path.sep).join("/");
  const m = p.match(/^([A-Za-z]):\/(.*)/);
  if (m) {
    const drive = m[1].toLowerCase();
    const rest = m[2];
    const drivePrefix = "/host_mnt";
    return `${drivePrefix}/${drive}/${rest}`;
  }

  if (p.startsWith("/")) return p;
  return `/${p}`;
}

/**
 * Language to Docker image mapping
 */
const LANGUAGE_IMAGES = {
  node: process.env.DOCKER_IMAGE_NODE || "node:18-alpine",
  python: process.env.DOCKER_IMAGE_PYTHON || "python:3.11-alpine",
  cpp: process.env.DOCKER_IMAGE_CPP || "gcc:latest",
  java: process.env.DOCKER_IMAGE_JAVA || "eclipse-temurin:17-jdk-alpine",
};

/**
 * Language command templates using executor scripts
 */
const LANGUAGE_COMMANDS = {
  node: (file) => `/executor/run_node.sh ${file}`,
  python: (file) => `/executor/run_python.sh ${file}`,
  cpp: (file) => `/executor/run_cpp.sh ${file}`,
  java: (file) => `/executor/run_java.sh ${file}`,
};

/**
 * Active running containers (jobId -> dockerProcess)
 */
const activeContainers = new Map();

/**
 * Make executor scripts executable
 */
export async function makeExecutorScriptsExecutable() {
  if (os.platform() === "win32") {
    console.log("ℹ️  Skipping chmod on Windows (not required)");
    return;
  }

  try {
    const files = await fs.readdir(EXECUTOR_DIR);
    const shellScripts = files.filter((f) => f.endsWith(".sh"));
    for (const script of shellScripts) {
      const scriptPath = path.join(EXECUTOR_DIR, script);
      try {
        await fs.chmod(scriptPath, 0o755);
        console.log(`✓ Made executable: ${script}`);
      } catch (chmodError) {
        if (chmodError.code === "EROFS" || chmodError.code === "EPERM") {
          console.warn(
            `⚠️ Cannot chmod ${script} (read-only filesystem), continuing...`
          );
        } else throw chmodError;
      }
    }
  } catch (error) {
    console.error(
      "Warning: Failed to make executor scripts executable:",
      error.message
    );
  }
}

/**
 * Initialize WebSocket server
 */
export function initWebSocketServer(httpServer, config) {
  const wss = new WebSocketServer({
    server: httpServer,
    path: "/ws/run",
  });

  console.log("📡 WebSocket server initialized on /ws/run");

  wss.on("connection", (ws) => {
    console.log("🔌 Client connected to WebSocket");

    // Heartbeat setup
    ws.isAlive = true;
    ws.on("pong", () => (ws.isAlive = true));
    const pingInterval = setInterval(() => {
      if (!ws.isAlive) {
        console.warn("⚠️ Terminating stale websocket connection");
        try {
          ws.terminate();
        } catch {}
        return;
      }
      ws.isAlive = false;
      try {
        ws.ping();
      } catch {}
    }, 30000);

    let jobId = null;
    let dockerProcess = null;
    let workspacePath = null;
    let executionTimeout = null;

    const send = (type, data, code = null) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type, data, code }));
      }
    };

    send("info", "✅ WebSocket connection established");

    const cleanup = async () => {
      if (executionTimeout) clearTimeout(executionTimeout);
      clearInterval(pingInterval);

      if (dockerProcess && !dockerProcess.killed) {
        console.log(`⚠️ Killing container for job ${jobId}`);
        dockerProcess.kill("SIGKILL");
        activeContainers.delete(jobId);
      }

      if (workspacePath) {
        try {
          await fs.rm(workspacePath, { recursive: true, force: true });
          console.log(`🗑️ Cleaned workspace: ${workspacePath}`);
        } catch (error) {
          console.error("Cleanup error:", error.message);
        }
      }
    };

    ws.on("message", async (message) => {
      try {
        // ✅ First parse the incoming message
        const msg = JSON.parse(message.toString());

        // ✅ Handle frontend heartbeat ping
        if (msg.type === "ping") {
          ws.send(JSON.stringify({ type: "pong" }));
          return; // stop further processing
        }

        // Destructure execution fields if this is a normal code run
        const {
          language,
          code,
          filename,
          command,
          workspaceId: existingWorkspaceId,
        } = msg;

        if (!language) return send("error", "Missing required field: language");
        if (!LANGUAGE_IMAGES[language])
          return send("error", `Unsupported language: ${language}`);

        // ✅ FIXED dynamic filename logic
        let targetFilename;
        switch (language) {
          case "python":
            targetFilename =
              !filename || !filename.endsWith(".py") ? "main.py" : filename;
            break;
          case "cpp":
            targetFilename =
              !filename || !filename.endsWith(".cpp") ? "main.cpp" : filename;
            break;
          case "java":
            targetFilename =
              !filename || !filename.endsWith(".java") ? "Main.java" : filename;
            break;
          case "node":
          case "javascript":
          default:
            targetFilename =
              !filename || !filename.endsWith(".js") ? "index.js" : filename;
            break;
        }

        console.log(`📝 Selected filename for ${language}: ${targetFilename}`);

        // (… keep the rest of your existing code here exactly as it is …)

        if (existingWorkspaceId) {
          jobId = existingWorkspaceId;
          workspacePath = path.join(config.workspaceBase, existingWorkspaceId);
          try {
            await fs.access(workspacePath);
            console.log(`🔄 Using existing workspace ${existingWorkspaceId}`);
            send(
              "info",
              `Using workspace ${existingWorkspaceId}`,
              existingWorkspaceId
            );
          } catch {
            return send("error", `Workspace ${existingWorkspaceId} not found`);
          }
        } else {
          if (!code) return send("error", "Missing required field: code");
          jobId = nanoid(10);
          workspacePath = path.join(config.workspaceBase, jobId);
          await fs.mkdir(workspacePath, { recursive: true });
          await fs.writeFile(
            path.join(workspacePath, targetFilename),
            code,
            "utf8"
          );
          console.log(`📦 Created workspace for job ${jobId}`);
          send("info", `Job ${jobId} started`, jobId);
        }

        // Record execution start
        const executionStartTime = Date.now();
        monitoring.recordExecutionStart(jobId, language, "anonymous");

        // Auto-install dependencies
        if (language === "node") {
          const pkg = path.join(workspacePath, "package.json");
          try {
            await fs.access(pkg);
            send(
              "info",
              "📦 Detected package.json — installing dependencies..."
            );
            execSync("npm install --omit=dev --no-audit --no-fund", {
              cwd: workspacePath,
              stdio: "inherit",
              shell: true,
            });
            send("info", "✅ Dependencies installed successfully");
          } catch {}
        }

        if (language === "python") {
          const req = path.join(workspacePath, "requirements.txt");
          try {
            await fs.access(req);
            send(
              "info",
              "📦 Detected requirements.txt — installing Python dependencies..."
            );
            execSync(`pip install --no-cache-dir -r requirements.txt`, {
              cwd: workspacePath,
              stdio: "inherit",
              shell: true,
            });
            send("info", "✅ Python dependencies installed successfully");
          } catch {}
        }

        const image = LANGUAGE_IMAGES[language];
        const execCommand =
          command || LANGUAGE_COMMANDS[language](targetFilename);
        const dockerHostPath = toDockerPosixPath(workspacePath);

        let userOption = "0:0";
        if (os.platform() !== "win32") {
          try {
            userOption = `${process.getuid()}:${process.getgid()}`;
          } catch {
            userOption = "0:0";
          }
        }

        const dockerExecutorPath = toDockerPosixPath(EXECUTOR_DIR);

        const dockerArgs = [
          "run",
          "--rm",
          "-i",
          "--network=none",
          `--memory=${config.dockerMemory}`,
          `--cpus=${config.dockerCpu}`,
          `--pids-limit=${config.dockerPids}`,
          "--security-opt=no-new-privileges",
          "-v",
          `${dockerHostPath}:/workspace:rw`,
          "-v",
          `${dockerExecutorPath}:/executor:ro`,
          "-w",
          "/workspace",
          "--user",
          userOption,
          image,
          "sh",
          "-c",
          `timeout ${config.dockerTimeout}s ${execCommand}`,
        ];

        console.log(
          `🐳 Starting container for ${language} → ${targetFilename}`
        );
        console.log("🐳 docker", dockerArgs.join(" "));

        dockerProcess = spawn("docker", dockerArgs, {
          stdio: ["ignore", "pipe", "pipe"],
        });
        activeContainers.set(jobId, dockerProcess);

        dockerProcess.stdout.on("data", (data) =>
          send("stdout", data.toString())
        );
        dockerProcess.stderr.on("data", (data) =>
          send("stderr", data.toString())
        );

        dockerProcess.on("close", async (exitCode) => {
          console.log(`✅ Job ${jobId} exited with code ${exitCode}`);

          if (jobId && activeContainers.has(jobId)) {
            activeContainers.delete(jobId);
          }

          // Record execution completion
          monitoring.recordExecutionComplete(jobId, exitCode);

          send("exit", null, exitCode);

          try {
            await cleanup();
          } catch (err) {
            console.error("Cleanup error:", err);
          }
        });

        dockerProcess.on("error", async (error) => {
          console.error(`❌ Docker error for job ${jobId}:`, error.message);
          monitoring.recordExecutionComplete(jobId, 1, error.message);
          monitoring.recordError(error, { jobId, language });
          send("error", error.message);
          await cleanup();
        });

        executionTimeout = setTimeout(async () => {
          console.log(`⏱️ Job ${jobId} timed out`);
          send("error", "Execution timeout exceeded");
          try {
            ws.close(1000, "execution timeout");
          } catch {}
          await cleanup();
        }, (config.dockerTimeout + 5) * 1000);
      } catch (error) {
        console.error("WebSocket message error:", error);
        send("error", error.message);
      }
    });

    ws.on("close", async () => {
      console.log("🔌 Client disconnected");
      await cleanup();
    });

    ws.on("error", (err) => {
      console.error("WebSocket runtime error:", err?.stack || err);
    });
  });

  return wss;
}

/**
 * Get active container count
 */
export function getActiveContainerCount() {
  return activeContainers.size;
}

/**
 * Kill all active containers (for graceful shutdown)
 */
export async function killAllContainers() {
  console.log(`🛑 Killing ${activeContainers.size} active containers...`);
  for (const [jobId, proc] of activeContainers.entries()) {
    try {
      proc.kill("SIGKILL");
      console.log(`   ✓ Killed job ${jobId}`);
    } catch (error) {
      console.error(`   ✗ Failed to kill job ${jobId}:`, error.message);
    }
  }
  activeContainers.clear();
}
