/**
 * PTY Runner - Pseudo-terminal support for interactive execution
 * Enables stdin input for interactive programs
 */

import { spawn } from 'node-pty';
import path from 'path';
import fs from 'fs/promises';

const WORKSPACE_BASE = process.env.WORKSPACE_BASE_PATH || '/tmp/ide-runner';

/**
 * Run code with PTY support (interactive terminal)
 */
export async function runWithPTY(workspaceId, language, code, filename, ws) {
    const workspacePath = path.join(WORKSPACE_BASE, workspaceId);
    
    try {
        // Ensure workspace exists
        await fs.mkdir(workspacePath, { recursive: true });
        
        // Write code to file
        const filePath = path.join(workspacePath, filename);
        await fs.writeFile(filePath, code);
        
        // Get executor command
        const { command, args, cwd } = getExecutorCommand(language, filename, workspacePath);
        
        // Spawn PTY process
        const ptyProcess = spawn(command, args, {
            name: 'xterm-color',
            cols: 80,
            rows: 30,
            cwd: cwd,
            env: {
                ...process.env,
                TERM: 'xterm-256color',
                COLORTERM: 'truecolor'
            }
        });
        
        // Send initial info
        ws.send(JSON.stringify({
            type: 'info',
            data: `Starting interactive session...`
        }));
        
        // Handle PTY output
        ptyProcess.onData((data) => {
            ws.send(JSON.stringify({
                type: 'stdout',
                data: data
            }));
        });
        
        // Handle PTY exit
        ptyProcess.onExit(({ exitCode, signal }) => {
            ws.send(JSON.stringify({
                type: 'exit',
                exitCode: exitCode || 0,
                signal: signal
            }));
        });
        
        // Handle WebSocket input (stdin)
        const inputHandler = (message) => {
            try {
                const data = JSON.parse(message);
                if (data.type === 'stdin') {
                    ptyProcess.write(data.data);
                } else if (data.type === 'resize') {
                    ptyProcess.resize(data.cols || 80, data.rows || 30);
                }
            } catch (err) {
                console.error('Input handler error:', err);
            }
        };
        
        ws.on('message', inputHandler);
        
        // Handle WebSocket close
        ws.on('close', () => {
            ptyProcess.kill();
            ws.off('message', inputHandler);
        });
        
        // Return cleanup function
        return () => {
            ptyProcess.kill();
            ws.off('message', inputHandler);
        };
        
    } catch (error) {
        ws.send(JSON.stringify({
            type: 'error',
            data: error.message
        }));
        throw error;
    }
}

/**
 * Get executor command for language
 */
function getExecutorCommand(language, filename, workspacePath) {
    const executorPath = path.join(process.cwd(), 'executor');
    
    switch (language) {
        case 'node':
        case 'javascript':
            return {
                command: 'node',
                args: [filename],
                cwd: workspacePath
            };
        
        case 'python':
            return {
                command: 'python3',
                args: [filename],
                cwd: workspacePath
            };
        
        case 'cpp':
            return {
                command: 'bash',
                args: [path.join(executorPath, 'run_cpp.sh'), filename],
                cwd: workspacePath
            };
        
        case 'c':
            return {
                command: 'bash',
                args: [path.join(executorPath, 'run_c.sh'), filename],
                cwd: workspacePath
            };
        
        case 'java':
            return {
                command: 'bash',
                args: [path.join(executorPath, 'run_java.sh'), filename],
                cwd: workspacePath
            };
        
        default:
            return {
                command: 'node',
                args: [filename],
                cwd: workspacePath
            };
    }
}

/**
 * Check if PTY is available
 */
export function isPTYAvailable() {
    try {
        require.resolve('node-pty');
        return true;
    } catch (err) {
        return false;
    }
}
