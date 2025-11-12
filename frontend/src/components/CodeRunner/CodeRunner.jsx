import { useState, useRef, useEffect } from 'react';
import { Play, Square, Trash2, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { Terminal } from '../Terminal/Terminal';
import './CodeRunner.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const WS_URL = API_URL.replace('http', 'ws') + '/ws/run';

/**
 * CodeRunner component
 * Handles code execution with real-time streaming output
 */
export function CodeRunner({ code, language, filename }) {
    const [status, setStatus] = useState('idle'); // idle, connecting, running, completed, failed
    const [exitCode, setExitCode] = useState(null);
    const [executionTime, setExecutionTime] = useState(0);
    const [startTime, setStartTime] = useState(null);
    const terminalRef = useRef(null);
    const timerRef = useRef(null);

    const { connect, disconnect, send, isConnected, isConnecting } = useWebSocket(WS_URL, {
        onMessage: handleMessage,
        onOpen: handleOpen,
        onClose: handleClose,
        onError: handleError,
        reconnect: false
    });

    function handleMessage(message) {
        const { type, data, code } = message; // ✅ don’t rename “data” to “content”
        const term = terminalRef.current?.terminal;

        if (!term) {
            outputBuffer.current.push(message);
            return;
        }

        if (outputBuffer.current.length > 0) {
            outputBuffer.current.forEach((msg) => handleMessage(msg));
            outputBuffer.current = [];
        }

        switch (type) {
            case 'info':
                term.writeln(`\x1b[36mℹ ${data}\x1b[0m`);
                break;

            case 'stdout':
                term.write(data);
                break;

            case 'stderr':
                term.write(`\x1b[31m${data}\x1b[0m`);
                break;

            case 'exit':
                console.log("✅ Exit message received:", message);
                stopTimer();
                setStatus('completed');
                term.writeln(`\n\x1b[32m✓ ${data}\x1b[0m`);

                // ✅ Wait a short delay to let UI update before closing connection
                setTimeout(() => {
                    disconnect();
                    stopTimer(); // double safety
                    setExecutionTime((prev) => prev); // freezes timer display
                }, 700);
                break;


            case 'error':
                stopTimer();
                setStatus('failed');
                term.writeln(`\n\x1b[31m✗ Error: ${data}\x1b[0m`);
                setTimeout(() => disconnect(), 500);
                break;
        }
    }



    function handleOpen() {
        setStatus('running');
        Terminal.clear(terminalRef.current);
        Terminal.writeln(terminalRef.current, '\x1b[36m🚀 Starting execution...\x1b[0m\n');

        // Send code execution request
        send({
            language,
            code,
            filename: filename || getDefaultFilename(language)
        });

        startTimer();
    }

    function handleClose() {
        if (status === 'running') {
            setStatus('failed');
            stopTimer();
            Terminal.writeln(terminalRef.current, '\n\x1b[31m✗ Connection closed unexpectedly\x1b[0m');
        }
    }

    function handleError(error) {
        console.error('WebSocket error:', error);
        setStatus('failed');
        stopTimer();
        Terminal.writeln(terminalRef.current, '\n\x1b[31m✗ Connection error\x1b[0m');
    }

    function startTimer() {
        setStartTime(Date.now());
        setExecutionTime(0);

        timerRef.current = setInterval(() => {
            setExecutionTime(Date.now() - Date.now());
        }, 100);
    }

    function stopTimer() {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        if (startTime) {
            setExecutionTime(Date.now() - startTime);
        }
    }

    function handleRun() {
        if (!code || !language) {
            Terminal.writeln(terminalRef.current, '\x1b[31m✗ No code to execute\x1b[0m');
            return;
        }

        setStatus('connecting');
        setExitCode(null);
        setExecutionTime(0);
        connect();
    }

    function handleStop() {
        if (isConnected) {
            Terminal.writeln(terminalRef.current, '\n\x1b[33m⚠ Stopping execution...\x1b[0m');
            disconnect();
            setStatus('idle');
            stopTimer();
        }
    }

    function handleClear() {
        Terminal.clear(terminalRef.current);
        setStatus('idle');
        setExitCode(null);
        setExecutionTime(0);
    }

    function getDefaultFilename(lang) {
        const defaults = {
            javascript: 'index.js',
            node: 'index.js',
            python: 'main.py',
            cpp: 'main.cpp',
            c: 'main.c',
            java: 'Main.java'
        };
        return defaults[lang] || 'code.txt';
    }

    function formatTime(ms) {
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    }

    useEffect(() => {
        return () => {
            disconnect();
            stopTimer();
        };
    }, [disconnect]);

    const isRunning = status === 'running' || status === 'connecting';
    const canRun = !isRunning && code && language;

    return (
        <div className="code-runner">
            {/* Control Bar */}
            <div className="runner-controls">
                <div className="controls-left">
                    <button
                        onClick={handleRun}
                        disabled={!canRun}
                        className="btn btn-run"
                        title="Run code (Ctrl+Enter)"
                    >
                        {isRunning ? (
                            <Loader2 className="icon-spin" size={16} />
                        ) : (
                            <Play size={16} />
                        )}
                        <span>{isRunning ? 'Running...' : 'Run'}</span>
                    </button>

                    {isRunning && (
                        <button
                            onClick={handleStop}
                            className="btn btn-stop"
                            title="Stop execution"
                        >
                            <Square size={16} />
                            <span>Stop</span>
                        </button>
                    )}

                    <button
                        onClick={handleClear}
                        disabled={isRunning}
                        className="btn btn-clear"
                        title="Clear output"
                    >
                        <Trash2 size={16} />
                        <span>Clear</span>
                    </button>
                </div>

                <div className="controls-right">
                    {/* Status Indicator */}
                    <div className={`status-badge status-${status}`}>
                        {status === 'idle' && <span>Ready</span>}
                        {status === 'connecting' && (
                            <>
                                <Loader2 className="icon-spin" size={14} />
                                <span>Connecting...</span>
                            </>
                        )}
                        {status === 'running' && (
                            <>
                                <Loader2 className="icon-spin" size={14} />
                                <span>Running</span>
                            </>
                        )}
                        {status === 'completed' && (
                            <>
                                <CheckCircle size={14} />
                                <span>Completed</span>
                            </>
                        )}
                        {status === 'failed' && (
                            <>
                                <XCircle size={14} />
                                <span>Failed</span>
                            </>
                        )}
                    </div>

                    {/* Execution Time */}
                    {(status === 'running' || status === 'completed' || status === 'failed') && (
                        <div className="execution-time">
                            <Clock size={14} />
                            <span>{formatTime(executionTime)}</span>
                        </div>
                    )}

                    {/* Exit Code */}
                    {exitCode !== null && (
                        <div className={`exit-code ${exitCode === 0 ? 'success' : 'error'}`}>
                            Exit: {exitCode}
                        </div>
                    )}
                </div>
            </div>

            {/* Terminal Output */}
            <div className="runner-terminal">
                <Terminal ref={terminalRef} />
            </div>
        </div>
    );
}
