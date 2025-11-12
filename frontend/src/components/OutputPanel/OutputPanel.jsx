import { useState, useRef, useEffect } from 'react';
import { Play, Square, Trash2, Loader2, CheckCircle, XCircle, Clock, ChevronDown, Maximize2, Minimize2 } from 'lucide-react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { Terminal } from '../Terminal/Terminal';
import { LanguageSelector } from '../LanguageSelector/LanguageSelector';
import './OutputPanel.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const WS_URL = API_URL.replace('http', 'ws') + '/ws/run';

/**
 * OutputPanel component
 * Integrated code execution panel with terminal output
 */
export function OutputPanel({ isOpen, onToggle, code, language, filename, onLanguageChange }) {
    const [status, setStatus] = useState('idle');
    const [exitCode, setExitCode] = useState(null);
    const [executionTime, setExecutionTime] = useState(0);
    const [startTime, setStartTime] = useState(null);
    const [height, setHeight] = useState(250);
    const [isResizing, setIsResizing] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState(language || 'node');
    const terminalRef = useRef(null);
    const timerRef = useRef(null);
    const startYRef = useRef(0);
    const startHeightRef = useRef(0);

    // Update selected language when prop changes
    useEffect(() => {
        if (language) {
            setSelectedLanguage(language);
        }
    }, [language]);

    function handleLanguageChange(newLanguage) {
        setSelectedLanguage(newLanguage);
        onLanguageChange?.(newLanguage);
    }

    const { connect, disconnect, send, isConnected } = useWebSocket(WS_URL, {
        onMessage: handleMessage,
        onOpen: handleOpen,
        onClose: handleClose,
        onError: handleError,
        reconnect: false
    });

    const outputBuffer = useRef([]);

   function handleMessage(data) {
    const { type, data: content } = data;
    const term = terminalRef.current?.terminal;

    // Buffer until terminal ready
    if (!term) {
        outputBuffer.current.push(data);
        return;
    }

    // Flush buffer if new terminal ready
    if (outputBuffer.current.length > 0) {
        outputBuffer.current.forEach((msg) => handleMessage(msg));
        outputBuffer.current = [];
    }

    switch (type) {
        case 'info':
            term.writeln(`\x1b[36mℹ ${content}\x1b[0m`);
            break;
        case 'stdout':
            term.write(content);
            break;
        case 'stderr':
            term.write(`\x1b[31m${content}\x1b[0m`);
            break;
        case 'exit':
            // same as before...
            break;
        case 'error':
            // same as before...
            break;
    }
}


    function handleOpen() {
    const term = terminalRef.current?.terminal;
    setStatus('running');
    term?.clear();
    term?.writeln('\x1b[36m🚀 Starting execution...\x1b[0m\n');

    const lang = selectedLanguage || language || "python"; // ✅ always send something

    send({
        language: lang,
        code,
        filename: filename || getDefaultFilename(lang)
    });

    startTimer();
}

    function handleClose() {
        const term = terminalRef.current?.terminal;
        if (status === 'running') {
            setStatus('failed');
            stopTimer();
            term?.writeln('\n\x1b[31m✗ Connection closed unexpectedly\x1b[0m');
        }
    }


    function handleError() {
        const term = terminalRef.current?.terminal;
        setStatus('failed');
        stopTimer();
        term?.writeln('\n\x1b[31m✗ Connection error\x1b[0m');
    }


    function startTimer() {
        const start = Date.now();
        setStartTime(start);
        setExecutionTime(0);

        timerRef.current = setInterval(() => {
            setExecutionTime(Date.now() - start);
        }, 100);
    }

    function stopTimer() {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
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
        const term = terminalRef.current?.terminal;
        if (isConnected) {
            term?.writeln('\n\x1b[33m⚠ Stopping execution...\x1b[0m');
            disconnect();
            setStatus('idle');
            stopTimer();
        }
    }

    function handleClear() {
        const term = terminalRef.current?.terminal;
        term?.clear();
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

    // Resize handlers
    const handleMouseDown = (e) => {
        setIsResizing(true);
        startYRef.current = e.clientY;
        startHeightRef.current = height;
        e.preventDefault();
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizing) return;
            const deltaY = startYRef.current - e.clientY;
            const newHeight = Math.min(Math.max(startHeightRef.current + deltaY, 100), 600);
            setHeight(newHeight);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    // Keyboard shortcut for run (Ctrl+Enter)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                if (status === 'idle' || status === 'completed' || status === 'failed') {
                    handleRun();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [code, language, status]);


    useEffect(() => {
    return () => {
        console.log("🧹 Cleaning up timer + WebSocket");
        stopTimer();
        disconnect();
    };
}, [disconnect]);


    if (!isOpen) return null;

    const isRunning = status === 'running' || status === 'connecting';
    const canRun = !isRunning && code && language;

    return (
        <div
            className="output-panel"
            style={{ height: `${height}px` }}
        >
            {/* Resize Handle */}
            <div
                onMouseDown={handleMouseDown}
                className={`resize-handle ${isResizing ? 'active' : ''}`}
                title="Drag to resize panel"
            />

            {/* Header */}
            <div className="output-header">
                <div className="header-left">
                    <span className="panel-title">OUTPUT</span>

                    <div className="header-controls">
                        <LanguageSelector
                            value={selectedLanguage}
                            onChange={handleLanguageChange}
                            disabled={isRunning}
                        />

                        <button
                            onClick={handleRun}
                            disabled={!canRun}
                            className="btn btn-run"
                            title="Run code (Ctrl+Enter)"
                        >
                            {isRunning ? (
                                <Loader2 className="icon-spin" size={14} />
                            ) : (
                                <Play size={14} />
                            )}
                            <span>Run</span>
                        </button>

                        {isRunning && (
                            <button
                                onClick={handleStop}
                                className="btn btn-stop"
                                title="Stop execution"
                            >
                                <Square size={14} />
                            </button>
                        )}

                        <button
                            onClick={handleClear}
                            disabled={isRunning}
                            className="btn btn-clear"
                            title="Clear output"
                        >
                            <Trash2 size={14} />
                        </button>

                        <div className="divider" />

                        <button
                            onClick={() => setHeight(600)}
                            className="btn btn-icon"
                            title="Maximize panel"
                        >
                            <Maximize2 size={14} />
                        </button>

                        <button
                            onClick={() => setHeight(250)}
                            className="btn btn-icon"
                            title="Restore panel"
                        >
                            <Minimize2 size={14} />
                        </button>

                        <button
                            onClick={onToggle}
                            className="btn btn-icon"
                            title="Hide panel"
                        >
                            <ChevronDown size={14} />
                        </button>
                    </div>
                </div>

                <div className="header-right">
                    {/* Status Badge */}
                    <div className={`status-badge status-${status}`}>
                        {status === 'idle' && <span>Ready</span>}
                        {status === 'connecting' && (
                            <>
                                <Loader2 className="icon-spin" size={12} />
                                <span>Connecting</span>
                            </>
                        )}
                        {status === 'running' && (
                            <>
                                <Loader2 className="icon-spin" size={12} />
                                <span>Running</span>
                            </>
                        )}
                        {status === 'completed' && (
                            <>
                                <CheckCircle size={12} />
                                <span>Completed</span>
                            </>
                        )}
                        {status === 'failed' && (
                            <>
                                <XCircle size={12} />
                                <span>Failed</span>
                            </>
                        )}
                    </div>

                    {/* Execution Time */}
                    {(status === 'running' || status === 'completed' || status === 'failed') && executionTime > 0 && (
                        <div className="execution-time">
                            <Clock size={12} />
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
            <div className="output-terminal">
                <Terminal ref={terminalRef} />
            </div>
        </div>
    );
}
