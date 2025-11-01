import React, { useState } from "react";
import TopBar from "./EditorPage/TopBar";
import Sidebar from "./EditorPage/Sidebar";
import ActivityBar from "./EditorPage/ActivityBar";
import EditorTabs from "./EditorPage/EditorTabs";
import CodeEditor from "./EditorPage/CodeEditor";
import Terminal from "./EditorPage/Terminal";
import StatusBar from "./EditorPage/StatusBar";

const EditorPage = () => {
  const [cursorPosition, setCursorPosition] = useState({ line: 1, col: 1 });
  const [indentation, setIndentation] = useState("Spaces: 2");
  const [language, setLanguage] = useState("JavaScript");

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [openFolders, setOpenFolders] = useState(new Set());

  // ➕ Terminal open/close state
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // ✅ Toggle terminal
  const toggleTerminal = () => {
    setIsTerminalOpen(prev => !prev);
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
      <TopBar />

      <div className="flex flex-1 overflow-hidden">

        {/* Activity Bar */}
        <ActivityBar onToggleSidebar={toggleSidebar} />

        {/* Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onToggle={toggleSidebar}
          fileTree={fileTree}
          openFolders={openFolders}
          toggleFolder={toggleFolder}
          openFile={openFile}
        />

        {/* Main Content */}
        <div className="flex flex-col flex-1 overflow-hidden">

          <EditorTabs />

          {/* Code Editor */}
          <div className="flex-1 overflow-hidden">
            <CodeEditor
              onCursorChange={setCursorPosition}
              onIndentChange={setIndentation}
              onLanguageChange={setLanguage}
            />
          </div>

          {/* ✅ Terminal now controlled & resizable */}
          <Terminal isOpen={isTerminalOpen} onToggle={toggleTerminal} />

          {/* Status Bar */}
          <StatusBar
            cursorPosition={cursorPosition}
            indentation={indentation}
            language={language}
          />
        </div>
      </div>
    </div>
  );
};

export default EditorPage;
