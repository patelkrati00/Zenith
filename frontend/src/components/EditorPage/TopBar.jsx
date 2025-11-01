import { Minus, Square, X, Menu } from 'lucide-react';

const TopBar = () => {
  const menuItems = ['File', 'Edit', 'Selection', 'View', 'Go', 'Run', 'Terminal', 'Help'];

  return (
    <div 
      className="flex items-center justify-between bg-[#323233] border-b border-[#3c3c3c]"
      style={{ 
        height: '35px',
        fontFamily: '"Cascadia Code", Consolas, "Courier New", monospace'
      }}
    >
      {/* Left: Menu Items */}
      <div className="flex items-center h-full">
        {/* App Icon/Menu (optional) */}
        <div className="flex items-center justify-center w-[50px] h-full hover:bg-[#3e3e42] cursor-pointer">
          <Menu size={16} className="text-[#cccccc]" strokeWidth={1.5} />
        </div>

        {/* Menu Bar */}
        <div className="flex items-center h-full">
          {menuItems.map((item) => (
            <div
              key={item}
              className="px-[10px] h-full flex items-center text-[13px] text-[#cccccc] hover:bg-[#3e3e42] cursor-pointer select-none"
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Center: Window Title */}
      <div className="absolute left-1/2 transform -translate-x-1/2 text-[13px] text-[#cccccc] select-none">
        my-vscode-app - Visual Studio Code
      </div>

      {/* Right: Window Controls */}
      <div className="flex items-center h-full">
        {/* Minimize */}
        <button 
          className="w-[46px] h-full flex items-center justify-center text-[#cccccc] hover:bg-[#3e3e42] transition-colors"
          title="Minimize"
        >
          <Minus size={16} strokeWidth={1.5} />
        </button>

        {/* Maximize/Restore */}
        <button 
          className="w-[46px] h-full flex items-center justify-center text-[#cccccc] hover:bg-[#3e3e42] transition-colors"
          title="Maximize"
        >
          <Square size={13} strokeWidth={1.5} />
        </button>

        {/* Close */}
        <button 
          className="w-[46px] h-full flex items-center justify-center text-[#cccccc] hover:bg-[#e81123] hover:text-white transition-colors"
          title="Close"
        >
          <X size={18} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
};

export default TopBar;