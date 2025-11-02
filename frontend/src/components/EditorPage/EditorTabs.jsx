import { X, Circle, Play } from 'lucide-react';
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
    
    if (activeTab === tabId && newTabs.length > 0) {
      const currentIndex = tabs.findIndex(tab => tab.id === tabId);
      const newActiveIndex = currentIndex > 0 ? currentIndex - 1 : 0;
      setActiveTab(newTabs[newActiveIndex]?.id);
    }
  };

  return (
    <div 
      className="flex items-center bg-[#2d2d2d] border-b border-[#3c3c3c] overflow-x-auto group"
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
              border-r border-[#3c3c3c] cursor-pointer select-none group/tab
              ${isActive ? 'bg-[#1e1e1e] text-white' : 'bg-[#2d2d2d] text-[#cccccc] hover:bg-[#2a2a2a]'}
            `}
          >
            {isActive && (
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-[#3794ff]" />
            )}

            <span className="text-[13px] truncate mr-[8px]">
              {tab.name}
            </span>

            <div className="ml-auto flex items-center justify-center w-[16px] h-[16px]">
              {tab.modified ? (
                <Circle 
                  size={8} 
                  className={`fill-current ${isActive ? 'text-white' : 'text-[#cccccc]'}`}
                  strokeWidth={0}
                />
              ) : (
                <button
                  onClick={(e) => closeTab(e, tab.id)}
                  className="
                    w-full h-full flex items-center justify-center rounded-sm
                    opacity-0 group-hover:opacity-100 hover:bg-[#404040] transition-opacity
                  "
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

      {/* ▶️ RUN BUTTON */}
      <button
        title="Run Code"
        className="
          h-full px-3 hidden group-hover:flex items-center gap-2 text-[#cccccc]
          hover:bg-[#3a3a3a] transition-all cursor-pointer
        "
        onClick={() => console.log("Run Code Triggered")}
      >
        <Play size={16} strokeWidth={2} />
      </button>
    </div>
  );
};

export default EditorTabs;
