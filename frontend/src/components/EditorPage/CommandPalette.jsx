import { Search, ChevronRight, File, Folder, Settings, GitBranch, Terminal, Code } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';



const CommandPalette = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // All available commands
  const allCommands = [
    { 
      id: 1, 
      name: 'View: Toggle Terminal', 
      category: 'View',
      icon: Terminal,
      shortcut: 'Ctrl+`'
    },
    { 
      id: 2, 
      name: 'View: Toggle Sidebar Visibility', 
      category: 'View',
      icon: Folder,
      shortcut: 'Ctrl+B'
    },
    { 
      id: 3, 
      name: 'File: New File', 
      category: 'File',
      icon: File,
      shortcut: 'Ctrl+N'
    },
    { 
      id: 4, 
      name: 'File: Save', 
      category: 'File',
      icon: File,
      shortcut: 'Ctrl+S'
    },
    { 
      id: 5, 
      name: 'File: Save All', 
      category: 'File',
      icon: File,
      shortcut: 'Ctrl+K S'
    },
    { 
      id: 6, 
      name: 'View: Open View...', 
      category: 'View',
      icon: Code,
      shortcut: ''
    },
    { 
      id: 7, 
      name: 'Git: Clone', 
      category: 'Git',
      icon: GitBranch,
      shortcut: ''
    },
    { 
      id: 8, 
      name: 'Git: Commit', 
      category: 'Git',
      icon: GitBranch,
      shortcut: ''
    },
    { 
      id: 9, 
      name: 'Git: Push', 
      category: 'Git',
      icon: GitBranch,
      shortcut: ''
    },
    { 
      id: 10, 
      name: 'Preferences: Open Settings', 
      category: 'Preferences',
      icon: Settings,
      shortcut: 'Ctrl+,'
    },
    { 
      id: 11, 
      name: 'Preferences: Open Keyboard Shortcuts', 
      category: 'Preferences',
      icon: Settings,
      shortcut: 'Ctrl+K Ctrl+S'
    },
    { 
      id: 12, 
      name: 'Terminal: Create New Terminal', 
      category: 'Terminal',
      icon: Terminal,
      shortcut: 'Ctrl+Shift+`'
    }, 
    { 
      id: 13, 
      name: 'Terminal: Kill Active Terminal', 
      category: 'Terminal',
      icon: Terminal,
      shortcut: ''
    },
    { 
      id: 14, 
      name: 'View: Toggle Minimap', 
      category: 'View',
      icon: Code,
      shortcut: ''
    },
    { 
      id: 15, 
      name: 'View: Toggle Word Wrap', 
      category: 'View',
      icon: Code,
      shortcut: 'Alt+Z'
    },
  ];

  // Filter commands based on search
  const filteredCommands = allCommands.filter(cmd =>
    cmd.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cmd.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < filteredCommands.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        handleCommandSelect(filteredCommands[selectedIndex]);
      }
    }
  };

  const handleCommandSelect = (command) => {
    console.log('Executing command:', command.name);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Command Palette */}
      <div 
        className="fixed top-[80px] left-1/2 transform -translate-x-1/2 w-[600px] bg-[#252526] border border-[#3c3c3c] shadow-2xl z-50"
        style={{ 
          fontFamily: '"Cascadia Code", Consolas, "Courier New", monospace',
          maxHeight: '500px',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Search Input */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[#3c3c3c]">
          <ChevronRight size={16} className="text-[#cccccc]" strokeWidth={1.5} />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-[14px] text-white outline-none placeholder-[#858585]"
            style={{ fontFamily: '"Cascadia Code", Consolas, "Courier New", monospace' }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-[#858585] hover:text-[#cccccc] text-[12px]"
            >
              Clear
            </button>
          )}
        </div>

        {/* Commands List */}
        <div className="overflow-y-auto" style={{ maxHeight: '420px' }}>
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-6 text-center text-[13px] text-[#858585]">
              No commands found
            </div>
          ) : (
            <div className="py-1">
              {filteredCommands.map((command, index) => {
                const Icon = command.icon;
                const isSelected = index === selectedIndex;

                return (
                  <div
                    key={command.id}
                    onClick={() => handleCommandSelect(command)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`
                      flex items-center justify-between px-3 py-2 cursor-pointer
                      ${isSelected ? 'bg-[#094771]' : 'hover:bg-[#2a2d2e]'}
                    `}
                  >
                    {/* Left: Icon + Command Name */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Icon 
                        size={16} 
                        className={`flex-shrink-0 ${isSelected ? 'text-white' : 'text-[#cccccc]'}`}
                        strokeWidth={1.5}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className={`text-[13px] truncate ${isSelected ? 'text-white' : 'text-[#cccccc]'}`}>
                          {command.name}
                        </span>
                        {command.category && (
                          <span className="text-[11px] text-[#858585] truncate">
                            {command.category}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Keyboard Shortcut */}
                    {command.shortcut && (
                      <div className="flex items-center gap-1 flex-shrink-0 ml-4">
                        {command.shortcut.split(' ').map((key, i) => (
                          <span
                            key={i}
                            className={`
                              px-2 py-1 text-[11px] rounded border
                              ${isSelected 
                                ? 'bg-[#0e639c] border-[#1177bb] text-white' 
                                : 'bg-[#3c3c3c] border-[#4c4c4c] text-[#cccccc]'
                              }
                            `}
                          >
                            {key}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-[#3c3c3c] bg-[#2d2d30] text-[11px] text-[#858585]">
          <span>↑↓ to navigate • Enter to select • Esc to close</span>
          <span>{filteredCommands.length} commands</span>
        </div>
      </div>
    </>
  );
};

export default CommandPalette;