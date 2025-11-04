import React, { useState, useEffect } from "react";
import TopBar from "./EditorPage/TopBar";
import Sidebar from "./EditorPage/Sidebar";
import ActivityBar from "./EditorPage/ActivityBar";
import EditorTabs from "./EditorPage/EditorTabs";
import CodeEditor from "./EditorPage/CodeEditor";
import Terminal from "./EditorPage/Terminal";
import StatusBar from "./EditorPage/StatusBar";
import CommandPalette from "./EditorPage/CommandPalette";
import GitPanel from "./EditorPage/GitPanel";

const EditorPage = () => {
  const [cursorPosition, setCursorPosition] = useState({ line: 1, col: 1 });
  const [indentation, setIndentation] = useState("Spaces: 2");
  const [language, setLanguage] = useState("JavaScript");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [openFolders, setOpenFolders] = useState(new Set());
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  // Command Palette keyboard shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setIsPaletteOpen(true);
      }
      if (e.key === "Escape") {
        setIsPaletteOpen(false);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleTerminal = () => {
    setIsTerminalOpen((prev) => !prev);
  };

  const toggleFolder = (path) => {
    const newSet = new Set(openFolders);
    newSet.has(path) ? newSet.delete(path) : newSet.add(path);
    setOpenFolders(newSet);
  };

  const openFile = (name, path) => {
    console.log("Opening file:", name, "at path:", path);
  };

  const fileTree = {
    name: "root",
    type: "folder",
    children: [
      { name: "index.js", type: "file" },
      {
        name: "src",
        type: "folder",
        children: [
          { name: "App.jsx", type: "file" },
          { name: "App.css", type: "file" },
        ],
      },
    ],
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#1e1e1e]">
      {/* Top Bar */}
      <TopBar onOpenPalette={() => setIsPaletteOpen(true)} />

      <div className="flex flex-1 overflow-hidden">
        {/* Activity Bar */}
        <ActivityBar onToggleSidebar={toggleSidebar} />

        {/* Sidebar - Responsive with overlay on mobile */}
        <Sidebar
          isOpen={isSidebarOpen}
          onToggle={toggleSidebar}
          fileTree={fileTree}
          openFolders={openFolders}
          toggleFolder={toggleFolder}
          openFile={openFile}
        />

        {/* Main Content Area */}
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          {/* Editor Tabs */}
          <EditorTabs />

          {/* Code Editor */}
          <div className="flex-1 overflow-hidden min-h-0">
            <CodeEditor
              onCursorChange={setCursorPosition}
              onIndentChange={setIndentation}
              onLanguageChange={setLanguage}
            />
          </div>

          {/* Terminal Panel */}
          <Terminal isOpen={isTerminalOpen} onToggle={toggleTerminal} />
        </div>

        {/* Git Panel - Hidden on small screens */}
        <div className="hidden lg:block">
          <GitPanel />
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar
        cursorPosition={cursorPosition}
        indentation={indentation}
        language={language}
      />

      {/* Command Palette Overlay */}
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
      />
    </div>
  );
};

export default EditorPage;