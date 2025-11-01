import { Plus, Trash2, SplitSquareHorizontal, ChevronDown, X, ChevronUp, Maximize2, Minimize2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const Terminal = ({ isOpen, onToggle }) => {
  const [terminals, setTerminals] = useState([
    { id: 1, title: 'powershell', lines: [] }
  ]);
  const [activeTerminalId, setActiveTerminalId] = useState(1);
  const [currentInput, setCurrentInput] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [height, setHeight] = useState(250);
  const [isResizing, setIsResizing] = useState(false);
  
  const terminalEndRef = useRef(null);
  const inputRef = useRef(null);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);

  const activeTerminal = terminals.find(t => t.id === activeTerminalId);

  // Cursor blink animation
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible(prev => !prev);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeTerminal?.lines]);

  // Focus input on mount and terminal click
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [activeTerminalId, isOpen]);

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

  const addLine = (content, type = 'output') => {
    setTerminals(prev => prev.map(t => 
      t.id === activeTerminalId 
        ? { ...t, lines: [...t.lines, { content, type, id: Date.now() + Math.random() }] }
        : t
    ));
  };

  const clearTerminal = () => {
    setTerminals(prev => prev.map(t => 
      t.id === activeTerminalId 
        ? { ...t, lines: [] }
        : t
    ));
  };

  const runCommand = (cmd) => {
    const trimmedCmd = cmd.trim();
    
    addLine(`PS F:\\CodeEditor> ${trimmedCmd}`, 'command');

    if (!trimmedCmd) return;

    setCommandHistory(prev => [...prev, trimmedCmd]);
    setHistoryIndex(-1);

    switch (trimmedCmd.toLowerCase()) {
      case 'clear':
      case 'cls':
        clearTerminal();
        break;
      
      case 'help':
        addLine('Available commands:', 'output');
        addLine('  ls, dir     - List directory contents', 'output');
        addLine('  clear, cls  - Clear terminal screen', 'output');
        addLine('  help        - Show this help message', 'output');
        addLine('  echo <text> - Echo text to terminal', 'output');
        addLine('  date        - Show current date and time', 'output');
        break;
      
      case 'ls':
      case 'dir':
        addLine('', 'output');
        addLine('    Directory: F:\\CodeEditor', 'output');
        addLine('', 'output');
        addLine('Mode                 LastWriteTime         Length Name', 'output');
        addLine('----                 -------------         ------ ----', 'output');
        addLine('d-----        11/01/2025   3:45 PM                node_modules', 'output');
        addLine('d-----        11/01/2025   2:30 PM                public', 'output');
        addLine('d-----        11/01/2025   4:12 PM                src', 'output');
        addLine('-a----        11/01/2025   1:20 PM           1024 package.json', 'output');
        addLine('-a----        11/01/2025   1:20 PM            512 vite.config.js', 'output');
        addLine('-a----        11/01/2025   1:15 PM           2048 README.md', 'output');
        addLine('', 'output');
        break;
      
      case 'date':
        addLine(new Date().toString(), 'output');
        break;
      
      default:
        if (trimmedCmd.startsWith('echo ')) {
          const text = trimmedCmd.substring(5);
          addLine(text, 'output');
        } else {
          addLine(`'${trimmedCmd}' is not recognized as an internal or external command.`, 'error');
        }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      runCommand(currentInput);
      setCurrentInput('');
      setHistoryIndex(-1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 
          ? commandHistory.length - 1 
          : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setCurrentInput('');
        } else {
          setHistoryIndex(newIndex);
          setCurrentInput(commandHistory[newIndex]);
        }
      }
    }
  };

  const createNewTerminal = () => {
    const newId = Math.max(...terminals.map(t => t.id)) + 1;
    setTerminals([...terminals, { id: newId, title: `powershell (${newId})`, lines: [] }]);
    setActiveTerminalId(newId);
  };

  const closeTerminal = (id, e) => {
    e.stopPropagation();
    if (terminals.length === 1) return;
    const filtered = terminals.filter(t => t.id !== id);
    setTerminals(filtered);
    if (activeTerminalId === id) {
      setActiveTerminalId(filtered[0].id);
    }
  };

  const killTerminal = () => {
    if (terminals.length === 1) return;
    const filtered = terminals.filter(t => t.id !== activeTerminalId);
    setTerminals(filtered);
    setActiveTerminalId(filtered[0].id);
  };

  const maximizeTerminal = () => {
    setHeight(600);
  };

  const minimizeTerminal = () => {
    setHeight(250);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="flex flex-col bg-[#1e1e1e] border-t border-[#3c3c3c]"
      style={{ 
        height: `${height}px`,
        fontFamily: '"Cascadia Mono", Consolas, monospace'
      }}
    >
      {/* Resize Handle */}
      <div
        onMouseDown={handleMouseDown}
        className={`
          h-[4px] w-full cursor-ns-resize hover:bg-[#007acc] transition-colors
          ${isResizing ? 'bg-[#007acc]' : 'bg-transparent'}
        `}
        title="Drag to resize terminal"
      />

      {/* Terminal Header */}
      <div className="flex items-center justify-between h-[35px] bg-[#252526] border-b border-[#3c3c3c] px-2">
        {/* Left: Title */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-[#cccccc] uppercase font-semibold tracking-wide">
            Terminal
          </span>
          
          {/* Toolbar Icons */}
          <div className="flex items-center gap-1">
            <button
              onClick={createNewTerminal}
              className="w-[22px] h-[22px] flex items-center justify-center text-[#cccccc] hover:bg-[#3e3e42] rounded transition-colors"
              title="New Terminal"
            >
              <Plus size={16} strokeWidth={1.5} />
            </button>
            
            <button
              onClick={killTerminal}
              className="w-[22px] h-[22px] flex items-center justify-center text-[#cccccc] hover:bg-[#3e3e42] rounded transition-colors"
              title="Kill Terminal"
            >
              <Trash2 size={14} strokeWidth={1.5} />
            </button>
            
            <button
              className="w-[22px] h-[22px] flex items-center justify-center text-[#cccccc] hover:bg-[#3e3e42] rounded transition-colors"
              title="Split Terminal"
            >
              <SplitSquareHorizontal size={14} strokeWidth={1.5} />
            </button>

            <div className="w-[1px] h-[16px] bg-[#3c3c3c] mx-1" />

            <button
              onClick={maximizeTerminal}
              className="w-[22px] h-[22px] flex items-center justify-center text-[#cccccc] hover:bg-[#3e3e42] rounded transition-colors"
              title="Maximize Terminal Panel"
            >
              <Maximize2 size={14} strokeWidth={1.5} />
            </button>

            <button
              onClick={minimizeTerminal}
              className="w-[22px] h-[22px] flex items-center justify-center text-[#cccccc] hover:bg-[#3e3e42] rounded transition-colors"
              title="Restore Terminal Panel"
            >
              <Minimize2 size={14} strokeWidth={1.5} />
            </button>
            
            <button
              onClick={onToggle}
              className="w-[22px] h-[22px] flex items-center justify-center text-[#cccccc] hover:bg-[#3e3e42] rounded transition-colors"
              title="Hide Terminal"
            >
              <ChevronDown size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Right: Terminal Tabs */}
        <div className="flex items-center gap-1">
          {terminals.map(terminal => (
            <div
              key={terminal.id}
              onClick={() => setActiveTerminalId(terminal.id)}
              className={`
                relative flex items-center gap-2 px-3 h-[28px] cursor-pointer select-none
                ${activeTerminalId === terminal.id 
                  ? 'bg-[#1e1e1e] text-white' 
                  : 'text-[#cccccc] hover:bg-[#2a2a2a]'
                }
              `}
            >
              <span className="text-[13px]">{terminal.title}</span>
              {terminals.length > 1 && (
                <button
                  onClick={(e) => closeTerminal(terminal.id, e)}
                  className="w-[16px] h-[16px] flex items-center justify-center hover:bg-[#404040] rounded transition-colors"
                >
                  <X size={12} strokeWidth={1.5} />
                </button>
              )}
              {activeTerminalId === terminal.id && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#3794ff]" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Terminal Content */}
      <div 
        onClick={() => inputRef.current?.focus()}
        className="flex-1 overflow-y-auto p-2 text-[13px] leading-[19px] text-[#cccccc] cursor-text"
        style={{ fontFamily: '"Cascadia Mono", Consolas, monospace' }}
      >
        {/* Output Lines */}
        {activeTerminal?.lines.map(line => (
          <div 
            key={line.id}
            className={`
              ${line.type === 'command' ? 'text-[#cccccc]' : ''}
              ${line.type === 'error' ? 'text-[#f48771]' : ''}
              ${line.type === 'output' ? 'text-[#cccccc]' : ''}
            `}
          >
            {line.content}
          </div>
        ))}

        {/* Current Input Line */}
        <div className="flex items-center">
          <span className="text-[#569CD6]">PS</span>
          <span className="text-[#cccccc] ml-1">F:\CodeEditor&gt;</span>
          <span className="ml-1">{currentInput}</span>
          <span 
            className={`inline-block w-[8px] h-[15px] bg-[#cccccc] ml-[1px] ${cursorVisible ? 'opacity-100' : 'opacity-0'}`}
            style={{ transition: 'opacity 0.1s' }}
          />
        </div>

        <div ref={terminalEndRef} />
      </div>

      {/* Hidden Input for Keyboard */}
      <input
        ref={inputRef}
        type="text"
        value={currentInput}
        onChange={(e) => setCurrentInput(e.target.value)}
        onKeyDown={handleKeyDown}
        className="absolute opacity-0 pointer-events-none"
        style={{ top: '-9999px' }}
      />
    </div>
  );
};

export default Terminal;