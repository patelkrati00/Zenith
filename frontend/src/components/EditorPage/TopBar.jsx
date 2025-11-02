import { Menu, Search } from 'lucide-react';

const TopBar = ({ onOpenPalette }) => {
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
        <div className="flex items-center justify-center w-[50px] h-full hover:bg-[#3e3e42] cursor-pointer">
          <Menu size={16} className="text-[#cccccc]" strokeWidth={1.5} />
        </div>

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

      {/* ✅ Center: Editor Title + Search Icon (Opens Command Palette) */}
      <div 
        onClick={onOpenPalette}
        className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2 text-[13px] text-[#cccccc] cursor-pointer hover:bg-[#3e3e42] px-2 py-1 rounded select-none"
        title="Show All Commands (Ctrl+Shift+P)"
      >
        <Search size={14} strokeWidth={1.5} />
        <span>My Editor</span>
      </div>

      {/* ✅ Right: Removed window controls */}
      <div className="w-[120px]"></div> {/* empty space to balance layout */}
    </div>
  );
};

export default TopBar;
