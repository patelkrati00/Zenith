import React from "react";
import { Menu, Search, Settings, User } from "lucide-react";

const TopBar = ({ onOpenPalette }) => {
  return (
    <div className="h-9 bg-[#323233] border-b border-[#2d2d2d] flex items-center justify-between px-2 text-[#cccccc] text-sm">
      {/* Left Section - Logo & Menu */}
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          className="sm:hidden hover:bg-[#2a2d2e] p-1 rounded transition-colors"
          aria-label="Menu"
        >
          <Menu className="w-4 h-4" />
        </button>
        
        <div className="hidden sm:flex items-center gap-3">
          <img 
            src="/src/assets/zenith.png" 
            alt="Zenith Logo" 
            className="h-7 w-auto" 
          />
          <nav className="flex items-center gap-1">
            <button className="px-2 py-1 hover:bg-[#2a2d2e] rounded transition-colors">
              File
            </button>
            <button className="px-2 py-1 hover:bg-[#2a2d2e] rounded transition-colors">
              Edit
            </button>
            <button className="px-2 py-1 hover:bg-[#2a2d2e] rounded transition-colors hidden md:block">
              Selection
            </button>
            <button className="px-2 py-1 hover:bg-[#2a2d2e] rounded transition-colors hidden lg:block">
              View
            </button>
            <button className="px-2 py-1 hover:bg-[#2a2d2e] rounded transition-colors hidden lg:block">
              Go
            </button>
            <button className="px-2 py-1 hover:bg-[#2a2d2e] rounded transition-colors hidden xl:block">
              Run
            </button>
            <button className="px-2 py-1 hover:bg-[#2a2d2e] rounded transition-colors hidden xl:block">
              Terminal
            </button>
            <button className="px-2 py-1 hover:bg-[#2a2d2e] rounded transition-colors hidden xl:block">
              Help
            </button>
          </nav>
        </div>
      </div>

      {/* Center Section - Search/Command Palette */}
      <div className="flex-1 max-w-md mx-2 sm:mx-4 hidden sm:block">
        <button
          onClick={onOpenPalette}
          className="w-full bg-[#3c3c3c] hover:bg-[#454545] text-left px-3 py-1 rounded flex items-center gap-2 transition-colors"
        >
          <Search className="w-3.5 h-3.5 text-[#858585]" />
          <span className="text-[#858585] text-xs truncate">
            Search files (Ctrl+Shift+P)
          </span>
        </button>
      </div>

      {/* Right Section - User & Settings */}
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={onOpenPalette}
          className="sm:hidden hover:bg-[#2a2d2e] p-1 rounded transition-colors"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>
        
        <button
          className="hover:bg-[#2a2d2e] p-1 rounded transition-colors hidden sm:block"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
        
        <button
          className="hover:bg-[#2a2d2e] p-1 rounded transition-colors"
          aria-label="User Account"
        >
          <User className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default TopBar;