import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react';
import { useState } from 'react';

const Sidebar = () => {
  const [expandedFolders, setExpandedFolders] = useState(new Set(['root', 'src', 'components']));

  const fileTree = {
    id: 'root',
    name: 'my-vscode-app',
    type: 'folder',
    children: [
      {
        id: 'src',
        name: 'src',
        type: 'folder',
        children: [
          {
            id: 'components',
            name: 'components',
            type: 'folder',
            children: [
              { id: 'activitybar', name: 'ActivityBar.jsx', type: 'file' },
              { id: 'sidebar', name: 'Sidebar.jsx', type: 'file' }
            ]
          },
          { id: 'app', name: 'App.jsx', type: 'file' },
          { id: 'main', name: 'main.jsx', type: 'file' }
        ]
      },
      {
        id: 'public',
        name: 'public',
        type: 'folder',
        children: [
          { id: 'index', name: 'index.html', type: 'file' }
        ]
      },
      { id: 'package', name: 'package.json', type: 'file' },
      { id: 'vite', name: 'vite.config.js', type: 'file' },
      { id: 'readme', name: 'README.md', type: 'file' }
    ]
  };

  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const renderTree = (node, depth = 0) => {
    const isExpanded = expandedFolders.has(node.id);
    const paddingLeft = depth * 16 + 8;

    if (node.type === 'folder') {
      return (
        <div key={node.id}>
          <div
            onClick={() => toggleFolder(node.id)}
            className="flex items-center h-[22px] px-2 text-[#cccccc] hover:bg-[#2a2d2e] cursor-pointer select-none"
            style={{ paddingLeft: `${paddingLeft}px` }}
          >
            {isExpanded ? (
              <ChevronDown size={16} className="mr-[2px] flex-shrink-0" strokeWidth={2} />
            ) : (
              <ChevronRight size={16} className="mr-[2px] flex-shrink-0" strokeWidth={2} />
            )}
            {isExpanded ? (
              <FolderOpen size={16} className="mr-[6px] flex-shrink-0 text-[#dcb67a]" strokeWidth={1.5} />
            ) : (
              <Folder size={16} className="mr-[6px] flex-shrink-0 text-[#dcb67a]" strokeWidth={1.5} />
            )}
            <span className="text-[13px] truncate">{node.name}</span>
          </div>
          {isExpanded && node.children && (
            <div>
              {node.children.map(child => renderTree(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    // File
    return (
      <div
        key={node.id}
        className="flex items-center h-[22px] px-2 text-[#cccccc] hover:bg-[#2a2d2e] cursor-pointer select-none"
        style={{ paddingLeft: `${paddingLeft + 18}px` }}
      >
        <File size={16} className="mr-[6px] flex-shrink-0 text-[#519aba]" strokeWidth={1.5} />
        <span className="text-[13px] truncate">{node.name}</span>
      </div>
    );
  };

  return (
    <div 
      className="bg-[#252526] border-r border-[#3c3c3c] overflow-y-auto"
      style={{ 
        width: '250px', 
        height: '100vh',
        fontFamily: '"Cascadia Code", Consolas, "Courier New", monospace'
      }}
    >
      {/* Header */}
      <div className="h-[35px] flex items-center px-[20px] text-[11px] font-semibold text-[#cccccc] uppercase tracking-wide border-b border-[#3c3c3c]">
        Explorer
      </div>

      {/* File Tree */}
      <div className="py-[8px]">
        {renderTree(fileTree)}
      </div>
    </div>
  );
};

export default Sidebar;