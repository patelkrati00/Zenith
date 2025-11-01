import { X, Circle } from 'lucide-react';
import { useState } from 'react';

const EditorTabs = () => {
  const [activeTab, setActiveTab] = useState('sidebar');
  const [tabs, setTabs] = useState([
    { id: 'activitybar', name: 'ActivityBar.jsx', modified: false },
    { id: 'sidebar', name: 'Sidebar.jsx', modified: true },
    { id: 'topbar', name: 'TopBar.jsx', modified: false },
    { id: 'app', name: 'App.jsx', modified: false }
  ]);

  const closeTab = (e, tabId) => {
    e.stopPropagation();
    const newTabs = tabs.filter(tab => tab.id !== tabId);
    setTabs(newTabs);
    
    // If closing active tab, switch to another
    if (activeTab === tabId && newTabs.length > 0) {
      const currentIndex = tabs.findIndex(tab => tab.id === tabId);
      const newActiveIndex = currentIndex > 0 ? currentIndex - 1 : 0;
      setActiveTab(newTabs[newActiveIndex]?.id);
    }
  };

  return (
    <div 
      className="flex items-center bg-[#2d2d2d] border-b border-[#3c3c3c] overflow-x-auto"
      style={{ 
        height: '36px',
        fontFamily: '"Cascadia Code", Consolas, "Courier New", monospace'
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        
        return (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              relative flex items-center h-full px-[12px] min-w-[120px] max-w-[200px]
              border-r border-[#3c3c3c] cursor-pointer select-none group
              ${isActive ? 'bg-[#1e1e1e] text-white' : 'bg-[#2d2d2d] text-[#cccccc] hover:bg-[#2a2a2a]'}
            `}
          >
            {/* Active tab top border indicator */}
            {isActive && (
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-[#3794ff]" />
            )}

            {/* File name */}
            <span className="text-[13px] truncate mr-[8px]">
              {tab.name}
            </span>

            {/* Modified indicator or Close button */}
            <div className="ml-auto flex items-center justify-center w-[16px] h-[16px]">
              {tab.modified ? (
                // Modified dot
                <Circle 
                  size={8} 
                  className={`fill-current ${isActive ? 'text-white' : 'text-[#cccccc]'}`}
                  strokeWidth={0}
                />
              ) : (
                // Close button (shows on hover)
                <button
                  onClick={(e) => closeTab(e, tab.id)}
                  className={`
                    w-full h-full flex items-center justify-center rounded-sm
                    opacity-0 group-hover:opacity-100 hover:bg-[#404040] transition-opacity
                  `}
                >
                  <X size={14} strokeWidth={1.5} />
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* Empty space filler */}
      <div className="flex-1 h-full bg-[#2d2d2d]" />
    </div>
  );
};

export default EditorTabs;