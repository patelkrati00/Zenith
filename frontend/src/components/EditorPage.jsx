import TopBar from "./EditorPage/TopBar";
import Sidebar from "./EditorPage/Sidebar";
import React, { useState } from "react";
import ActivityBar from "./EditorPage/ActivityBar";
import EditorTabs from "./EditorPage/EditorTabs";
import CodeEditor from "./EditorPage/CodeEditor";


const EditorPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [openFolders, setOpenFolders] = useState(new Set());

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleFolder = (path) => {
    const newSet = new Set(openFolders);
    if (newSet.has(path)) newSet.delete(path);
    else newSet.add(path);
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
      {/* Top Bar - Fixed at top */}
      <div className="flex-shrink-0">
        <TopBar />
      </div>

      {/* Main Content Area - Flex row */}
      <div className="flex flex-1 overflow-hidden">
        {/* Activity Bar - Fixed left side */}
        <div className="flex-shrink-0">
          <ActivityBar onToggleSidebar={toggleSidebar} />
        </div>

        {/* Sidebar - Toggleable */}
        <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />

        {/* Editor Area - Takes remaining space */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Editor Tabs - Fixed at top of editor */}
          <div className="flex-shrink-0">
            <EditorTabs />
          </div>

          {/* Code Editor - Takes remaining space */}
          <div className="flex-1 overflow-hidden">
            <CodeEditor />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorPage;