import { useState, useRef, useEffect } from 'react';
import { Play, Square, Trash2, Loader2, CheckCircle, XCircle, Clock, ChevronDown, Maximize2, Minimize2 } from 'lucide-react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { Terminal } from '../Terminal/Terminal';
import { LanguageSelector } from '../LanguageSelector/LanguageSelector';   // ✅ RESTORED
import './OutputPanel.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const WS_URL = API_URL.replace('http', 'ws') + '/ws/run';

export function OutputPanel({ isOpen, onToggle, code, language, filename, onLanguageChange }) {
    const [status, setStatus] = useState('idle');
    const [exitCode, setExitCode] = useState(null);
    const [executionTime, setExecutionTime] = useState(0);
    const [height, setHeight] = useState(250);
    const [isResizing, setIsResizing] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState(language || 'node');

    const terminalRef = useRef(null);
    const timerRef = useRef(null);
    const startTime = useRef(null);
    const outputBuffer = useRef([]);
    const startY = useRef(0);
    const startH = useRef(0);

    // Update language
    useEffect(() => {
        if (language) setSelectedLanguage(language);
    }, [language]);

    function handleLanguageChange(newLang) {
        setSelectedLanguage(newLang);
        onLanguageChange?.(newLang);
    }

    const { connect, disconnect, send } = useWebSocket(WS_URL, {
        onMessage: handleMessage,
        onOpen: handleOpen,
        onClose: handleClose,
        onError: handleError,
        reconnect: false
    });

    // ------------------ MESSAGE HANDLER ------------------
    function handleMessage(msg) {
        const { type, data: content, code } = msg;
        const term = terminalRef.current?.terminal;

        if (!term) {
            outputBuffer.current.push(msg);
            return;
        }

        if (outputBuffer.current.length) {
            outputBuffer.current.forEach(m => handleMessage(m));
            outputBuffer.current = [];
        }

        switch (type) {
            case "info":
                term.writeln(`\x1b[36mℹ ${content}\x1b[0m`);
                break;

            case "stdout":
                term.write(content);
                break;

            case "stderr":
                term.write(`\x1b[31m${content}\x1b[0m`);
                break;

            case "exit":
                stopTimer();
                setStatus("completed");
                setExitCode(code ?? 0);

                term.writeln(`\n\x1b[32m✓ Execution finished (exit code ${code})\x1b[0m`);

                setTimeout(() => disconnect(), 300);
                break;

            case "error":
                stopTimer();
                setStatus("failed");
                setExitCode(1);

                term.writeln(`\n\x1b[31m✗ Error: ${content}\x1b[0m`);
                setTimeout(() => disconnect(), 300);

                break;
        }
    }

    // ------------------ WS EVENTS ------------------
    function handleOpen() {
        const term = terminalRef.current?.terminal;
        setStatus("running");

        term?.clear();
        term?.writeln(`\x1b[36m🚀 Starting execution...\x1b[0m\n`);

        const lang = selectedLanguage || language || "python";

        send({
            language: lang,
            code,
            filename: filename || getDefaultFilename(lang)
        });

        startTimer();
    }

    function handleClose() {
        if (status === "running") {
            stopTimer();
            setStatus("failed");
            terminalRef.current?.terminal?.writeln(
                `\n\x1b[31m✗ Connection closed unexpectedly\x1b[0m`
            );
        }
    }

    function handleError() {
        stopTimer();
        setStatus("failed");
        terminalRef.current?.terminal?.writeln(
            `\n\x1b[31m✗ Connection error\x1b[0m`
        );
    }

    // ------------------ TIMER ------------------
    function startTimer() {
        startTime.current = Date.now();
        timerRef.current = setInterval(() => {
            setExecutionTime(Date.now() - startTime.current);
        }, 100);
    }

    function stopTimer() {
        clearInterval(timerRef.current);
        timerRef.current = null;
    }

    // ------------------ ACTIONS ------------------
    function handleRun() {
        setStatus("connecting");
        setExitCode(null);
        setExecutionTime(0);
        connect();
    }

    function handleStop() {
        terminalRef.current?.terminal?.writeln(`\n\x1b[33m⚠ Stopping...\x1b[0m`);
        disconnect();
        stopTimer();
        setStatus("idle");
    }

    function handleClear() {
        terminalRef.current?.terminal?.clear();
        setStatus("idle");
        setExitCode(null);
        setExecutionTime(0);
    }

    function getDefaultFilename(lang) {
        return {
            javascript: "index.js",
            node: "index.js",
            python: "main.py",
            cpp: "main.cpp",
            c: "main.c",
            java: "Main.java"
        }[lang] || "main.txt";
    }

    function formatTime(ms) {
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    }

    // ------------------ RESIZE ------------------
    function startResize(e) {
        setIsResizing(true);
        startY.current = e.clientY;
        startH.current = height;
    }

    useEffect(() => {
        function move(e) {
            if (!isResizing) return;
            const dy = startY.current - e.clientY;
            setHeight(Math.min(Math.max(startH.current + dy, 100), 600));
        }
        function stop() { setIsResizing(false); }

        if (isResizing) {
            window.addEventListener("mousemove", move);
            window.addEventListener("mouseup", stop);
        }
        return () => {
            window.removeEventListener("mousemove", move);
            window.removeEventListener("mouseup", stop);
        };
    }, [isResizing]);

    useEffect(() => {
        return () => {
            disconnect();
            stopTimer();
        };
    }, [disconnect]);

    if (!isOpen) return null;

    const isRunning = status === "running" || status === "connecting";
    const canRun = !isRunning && code && language;

    // ------------------ UI ------------------
    return (
        <div className="output-panel" style={{ height }}>
            <div className={`resize-handle ${isResizing ? "active" : ""}`} onMouseDown={startResize} />

            {/* HEADER */}
            <div className="output-header">
                <div className="header-left">
                    <span className="panel-title">OUTPUT</span>

                    <div className="header-controls">

                        {/* 🌍 LANGUAGE SELECTOR (RESTORED) */}
                        <LanguageSelector
                            value={selectedLanguage}
                            disabled={isRunning}
                            onChange={handleLanguageChange}
                        />

                        {/* ▶ RUN */}
                        <button onClick={handleRun} disabled={!canRun} className="btn btn-run">
                            {isRunning ? <Loader2 className="icon-spin" size={14} /> : <Play size={14} />}
                            <span>Run</span>
                        </button>

                        {/* ■ STOP */}
                        {isRunning && (
                            <button onClick={handleStop} className="btn btn-stop">
                                <Square size={14} />
                            </button>
                        )}

                        {/* 🧹 CLEAR */}
                        <button onClick={handleClear} disabled={isRunning} className="btn btn-clear">
                            <Trash2 size={14} />
                        </button>

                        {/* MAX / MIN / HIDE */}
                        <button onClick={() => setHeight(600)} className="btn btn-icon">
                            <Maximize2 size={14} />
                        </button>
                        <button onClick={() => setHeight(250)} className="btn btn-icon">
                            <Minimize2 size={14} />
                        </button>
                        <button onClick={onToggle} className="btn btn-icon">
                            <ChevronDown size={14} />
                        </button>
                    </div>
                </div>

                {/* RIGHT SIDE: Status + Timer + Exit */}
                <div className="header-right">
                    <div className={`status-badge status-${status}`}>
                        {status === "idle" && "Ready"}
                        {status === "connecting" && "Connecting…"}
                        {status === "running" && "Running…"}
                        {status === "completed" && "Completed ✓"}
                        {status === "failed" && "Failed ✗"}
                    </div>

                    {(status !== "idle") && (
                        <div className="execution-time">
                            <Clock size={12} />
                            <span>{formatTime(executionTime)}</span>
                        </div>
                    )}

                    {exitCode !== null && (
                        <div className={`exit-code ${exitCode === 0 ? "success" : "error"}`}>
                            Exit: {exitCode}
                        </div>
                    )}
                </div>
            </div>

            {/* TERMINAL */}
            <div className="output-terminal">
                <Terminal ref={terminalRef} />
            </div>
        </div>
    );
}
