import { GitBranch, GitCommit, GitPullRequest, RefreshCw, MoreHorizontal, Plus, Check, Minus, File, ChevronRight, ChevronDown } from 'lucide-react';
import { useState } from 'react';

const GitPanel = () => {
  const [commitMessage, setCommitMessage] = useState('');
  const [expandedSections, setExpandedSections] = useState(new Set(['changes', 'staged']));

  // Mock git data
  const changedFiles = [
    { id: 1, name: 'src/App.jsx', path: 'src/App.jsx', status: 'modified', additions: 12, deletions: 3 },
    { id: 2, name: 'src/components/Sidebar.jsx', path: 'src/components/Sidebar.jsx', status: 'modified', additions: 5, deletions: 2 },
    { id: 3, name: 'styles/main.css', path: 'styles/main.css', status: 'modified', additions: 8, deletions: 1 },
    { id: 4, name: 'README.md', path: 'README.md', status: 'modified', additions: 3, deletions: 0 }
  ];

  const stagedFiles = [
    { id: 5, name: 'package.json', path: 'package.json', status: 'modified', additions: 2, deletions: 1 }
  ];

  const [staged, setStaged] = useState(new Set([5]));

  const toggleSection = (section) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const stageFile = (id) => {
    setStaged(prev => new Set([...prev, id]));
  };

  const unstageFile = (id) => {
    setStaged(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const stageAll = () => {
    setStaged(new Set([...changedFiles.map(f => f.id), ...Array.from(staged)]));
  };

  const unstageAll = () => {
    setStaged(new Set());
  };

  const handleCommit = () => {
    if (commitMessage.trim() && staged.size > 0) {
      console.log('Committing:', commitMessage);
      setCommitMessage('');
      // In real app: make git commit
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'modified': return 'M';
      case 'added': return 'A';
      case 'deleted': return 'D';
      case 'untracked': return 'U';
      default: return '?';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'modified': return 'text-[#e2c08d]';
      case 'added': return 'text-[#73c991]';
      case 'deleted': return 'text-[#f48771]';
      case 'untracked': return 'text-[#73c991]';
      default: return 'text-[#cccccc]';
    }
  };

  const unstagedFiles = changedFiles.filter(f => !staged.has(f.id));
  const stagedFilesList = [...changedFiles, ...stagedFiles].filter(f => staged.has(f.id));

  return (
    <div 
      className="flex flex-col h-full bg-[#252526] border-r border-[#3c3c3c]"
      style={{ 
        width: '320px',
        fontFamily: '"Cascadia Code", Consolas, "Courier New", monospace'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#3c3c3c]">
        <div className="flex items-center gap-2">
          <GitBranch size={16} className="text-[#cccccc]" strokeWidth={1.5} />
          <h2 className="text-[11px] font-semibold text-[#cccccc] uppercase tracking-wide">
            Source Control
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="w-[22px] h-[22px] flex items-center justify-center text-[#cccccc] hover:bg-[#3e3e42] rounded transition-colors"
            title="Refresh"
          >
            <RefreshCw size={16} strokeWidth={1.5} />
          </button>
          <button
            className="w-[22px] h-[22px] flex items-center justify-center text-[#cccccc] hover:bg-[#3e3e42] rounded transition-colors"
            title="More Actions"
          >
            <MoreHorizontal size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Branch Info */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d30] border-b border-[#3c3c3c]">
        <div className="flex items-center gap-2">
          <GitBranch size={14} className="text-[#cccccc]" strokeWidth={1.5} />
          <span className="text-[12px] text-[#cccccc]">main</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[#858585]">
          <span>↓0 ↑0</span>
        </div>
      </div>

      {/* Commit Message Input */}
      <div className="px-4 py-3 border-b border-[#3c3c3c]">
        <textarea
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          placeholder="Message (Ctrl+Enter to commit)"
          className="w-full h-[60px] px-3 py-2 bg-[#3c3c3c] text-[13px] text-white placeholder-[#858585] rounded resize-none outline-none"
          style={{ fontFamily: '"Cascadia Code", Consolas, "Courier New", monospace' }}
        />
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={handleCommit}
            disabled={!commitMessage.trim() || staged.size === 0}
            className={`
              flex-1 px-4 py-2 text-[12px] rounded transition-colors
              ${commitMessage.trim() && staged.size > 0
                ? 'bg-[#0e639c] text-white hover:bg-[#1177bb]'
                : 'bg-[#3c3c3c] text-[#858585] cursor-not-allowed'
              }
            `}
          >
            <div className="flex items-center justify-center gap-2">
              <Check size={14} strokeWidth={1.5} />
              <span>Commit</span>
            </div>
          </button>
          <button
            className="p-2 text-[#cccccc] hover:bg-[#3e3e42] rounded transition-colors"
            title="Commit Options"
          >
            <ChevronDown size={14} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Files List */}
      <div className="flex-1 overflow-y-auto">
        {/* Staged Changes */}
        <div className="border-b border-[#3c3c3c]">
          <div
            onClick={() => toggleSection('staged')}
            className="flex items-center justify-between px-4 py-2 hover:bg-[#2a2d2e] cursor-pointer"
          >
            <div className="flex items-center gap-2">
              {expandedSections.has('staged') ? (
                <ChevronDown size={16} className="text-[#cccccc]" strokeWidth={2} />
              ) : (
                <ChevronRight size={16} className="text-[#cccccc]" strokeWidth={2} />
              )}
              <span className="text-[11px] font-semibold text-[#cccccc] uppercase tracking-wide">
                Staged Changes
              </span>
              <span className="text-[11px] text-[#858585]">
                {stagedFilesList.length}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                unstageAll();
              }}
              className="p-1 text-[#cccccc] hover:bg-[#3e3e42] rounded transition-colors"
              title="Unstage All Changes"
            >
              <Minus size={14} strokeWidth={1.5} />
            </button>
          </div>

          {expandedSections.has('staged') && stagedFilesList.length > 0 && (
            <div>
              {stagedFilesList.map(file => (
                <div
                  key={file.id}
                  className="flex items-center justify-between px-4 py-1 hover:bg-[#2a2d2e] cursor-pointer group"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <File size={14} className="text-[#519aba] flex-shrink-0" strokeWidth={1.5} />
                    <span className="text-[13px] text-[#cccccc] truncate">{file.name}</span>
                    <span className={`text-[11px] font-semibold ${getStatusColor(file.status)} ml-auto flex-shrink-0`}>
                      {getStatusIcon(file.status)}
                    </span>
                  </div>
                  <button
                    onClick={() => unstageFile(file.id)}
                    className="p-1 text-[#cccccc] hover:bg-[#3e3e42] rounded transition-colors opacity-0 group-hover:opacity-100 ml-2"
                    title="Unstage Changes"
                  >
                    <Minus size={12} strokeWidth={1.5} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Changes (Unstaged) */}
        <div>
          <div
            onClick={() => toggleSection('changes')}
            className="flex items-center justify-between px-4 py-2 hover:bg-[#2a2d2e] cursor-pointer"
          >
            <div className="flex items-center gap-2">
              {expandedSections.has('changes') ? (
                <ChevronDown size={16} className="text-[#cccccc]" strokeWidth={2} />
              ) : (
                <ChevronRight size={16} className="text-[#cccccc]" strokeWidth={2} />
              )}
              <span className="text-[11px] font-semibold text-[#cccccc] uppercase tracking-wide">
                Changes
              </span>
              <span className="text-[11px] text-[#858585]">
                {unstagedFiles.length}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                stageAll();
              }}
              className="p-1 text-[#cccccc] hover:bg-[#3e3e42] rounded transition-colors"
              title="Stage All Changes"
            >
              <Plus size={14} strokeWidth={1.5} />
            </button>
          </div>

          {expandedSections.has('changes') && unstagedFiles.length > 0 && (
            <div>
              {unstagedFiles.map(file => (
                <div
                  key={file.id}
                  className="flex items-center justify-between px-4 py-1 hover:bg-[#2a2d2e] cursor-pointer group"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <File size={14} className="text-[#519aba] flex-shrink-0" strokeWidth={1.5} />
                    <span className="text-[13px] text-[#cccccc] truncate">{file.name}</span>
                    <span className={`text-[11px] font-semibold ${getStatusColor(file.status)} ml-auto flex-shrink-0`}>
                      {getStatusIcon(file.status)}
                    </span>
                  </div>
                  <button
                    onClick={() => stageFile(file.id)}
                    className="p-1 text-[#cccccc] hover:bg-[#3e3e42] rounded transition-colors opacity-0 group-hover:opacity-100 ml-2"
                    title="Stage Changes"
                  >
                    <Plus size={12} strokeWidth={1.5} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {unstagedFiles.length === 0 && expandedSections.has('changes') && (
            <div className="px-4 py-6 text-center text-[12px] text- [#858585]">
              No changes
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GitPanel;