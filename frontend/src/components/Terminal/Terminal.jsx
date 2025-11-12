import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

export const Terminal = forwardRef(({ onData, className = '' }, ref) => {
    const containerRef = useRef(null);
    const xtermRef = useRef(null);
    const fitAddonRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current || xtermRef.current) return;

        const xterm = new XTerm({
            cursorBlink: true,
            fontSize: 14,
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            theme: {
                background: '#1e1e1e',
                foreground: '#d4d4d4',
                cursor: '#ffffff',
            },
            scrollback: 1000,
            convertEol: true,
        });

        const fitAddon = new FitAddon();
        xterm.loadAddon(fitAddon);
        xterm.open(containerRef.current);

        setTimeout(() => {
            try {
                fitAddon.fit();
            } catch (e) {
                console.warn('FitAddon error (likely DOM not ready yet):', e);
            }
        }, 100);

        if (onData) {
            xterm.onData(onData);
        }

        xtermRef.current = xterm;
        fitAddonRef.current = fitAddon;

        const handleResize = () => {
            try {
                fitAddon.fit();
            } catch {}
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            xterm.dispose();
            xtermRef.current = null;
            fitAddonRef.current = null;
        };
    }, [onData]);

    // 🔧 Expose terminal methods to parent
    useImperativeHandle(ref, () => ({
        terminal: xtermRef.current,
        clear: () => xtermRef.current?.clear(),
        write: (text) => xtermRef.current?.write(text),
        writeln: (text) => xtermRef.current?.writeln(text),
        reset: () => xtermRef.current?.reset(),
    }));

    return (
        <div
            ref={containerRef}
            className={`terminal-container ${className}`}
            style={{
                width: '100%',
                height: '100%',
                overflow: 'hidden',
            }}
        />
    );
});
