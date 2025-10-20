import React from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Plus } from 'lucide-react';

const Sidebar = ({ fileTree, openFolders, toggleFolder, openFile }) => {
  const renderTree = (node, path = '') => {
    const currentPath = path ? `${path}/${node.name}` : node.name;
    const isOpen = openFolders.has(currentPath);

    if (node.type === 'folder') {
      return (
        <div key={currentPath}>
          <div
            onClick={() => toggleFolder(currentPath)}
            className="flex items-center px-2 py-1 hover:bg-[var(--bg-hover)] cursor-pointer"
          >
            {isOpen ? (
              <ChevronDown size={16} className="text-gray-400 mr-1" />
            ) : (
              <ChevronRight size={16} className="text-gray-400 mr-1" />
            )}
            {isOpen ? (
              <FolderOpen size={16} className="text-[#dcb67a] mr-2" />
            ) : (
              <Folder size={16} className="text-[#dcb67a] mr-2" />
            )}
            <span className="text-sm text-[var(--text)]">{node.name}</span>
          </div>
          {isOpen && node.children && (
            <div className="ml-4">{node.children.map(child => renderTree(child, currentPath))}</div>
          )}
        </div>
      );
    }

    return (
      <div
        key={currentPath}
        onClick={() => openFile(node.name, currentPath)}
        className="flex items-center px-2 py-1 pl-6 hover:bg-[var(--bg-hover)] cursor-pointer"
      >
        <File size={16} className="text-gray-400 mr-2" />
        <span className="text-sm text-[var(--text)]">{node.name}</span>
      </div>
    );
  };

  return (
    <div className="w-64 bg-[var(--bg-sidebar)] border-r border-[var(--border)] flex flex-col overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--border)]">
        <span className="text-xs uppercase text-[var(--text-dim)] font-semibold">Explorer</span>
        <button className="p-1 hover:bg-[var(--bg-hover)] rounded transition-colors">
          <Plus size={16} className="text-gray-400" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-2">{renderTree(fileTree)}</div>
    </div>
  );
};

export default Sidebar;
