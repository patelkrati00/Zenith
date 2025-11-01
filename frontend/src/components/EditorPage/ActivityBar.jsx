import { Files, Search, GitBranch, Play, Package } from 'lucide-react';
import { useState } from 'react';

const ActivityBar = () => {
  const [activeItem, setActiveItem] = useState('explorer');

  const items = [
    { id: 'explorer', icon: Files, label: 'Explorer' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'git', icon: GitBranch, label: 'Source Control' },
    { id: 'debug', icon: Play, label: 'Run and Debug' },
    { id: 'extensions', icon: Package, label: 'Extensions' }
  ];

  return (
    <div 
      className="flex flex-col items-center bg-[#333333] border-r border-[#3c3c3c]"
      style={{ width: '52px', height: '100vh', fontFamily: '"Cascadia Code", Consolas, "Courier New", monospace' }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeItem === item.id;
        
        return (
          <button
            key={item.id}
            onClick={() => setActiveItem(item.id)}
            className="relative w-full h-[52px] flex items-center justify-center text-[#cccccc] hover:text-white transition-colors duration-75"
            title={item.label}
          >
            {/* Active indicator - left blue bar */}
            {isActive && (
              <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#3794ff]" />
            )}
            
            <Icon 
              size={24} 
              strokeWidth={1.5}
              className={isActive ? 'text-white' : ''}
            />
          </button>
        );
      })}
    </div>
  );
};

export default ActivityBar;