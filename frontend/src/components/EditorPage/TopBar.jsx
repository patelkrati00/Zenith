import React from 'react';
import { Play } from 'lucide-react';

const TopBar = ({ onRun }) => (
  <div className="bg-[var(--bg-header)] px-4 py-2 flex items-center justify-between border-b border-[var(--border)]">
    <span className="text-xs text-[var(--text-dim)]">File  Edit  View  Terminal  Help</span>
    <button
      onClick={onRun}
      className="flex items-center gap-2 px-3 py-1 bg-[var(--accent)] hover:bg-[#2ea043] rounded text-sm transition-colors"
    >
      <Play size={14} />
      Run
    </button>
  </div>
);

export default TopBar;
