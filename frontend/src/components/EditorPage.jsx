import TopBar from "./EditorPage/TopBar";
import Sidebar from "./EditorPage/Sidebar";
import React, { useState } from "react";
import ActivityBar from "./EditorPage/ActivityBar";
import EditorTabs from "./EditorPage/EditorTabs";
import CodeEditor from "./EditorPage/CodeEditor";

const EditorPage = () => {
  // State to track which folders are open
  const [openFolders, setOpenFolders] = useState(new Set());

  // Toggle folder open/close
  const toggleFolder = (path) => {
    const newSet = new Set(openFolders);
    if (newSet.has(path)) newSet.delete(path);
    else newSet.add(path);
    setOpenFolders(newSet);
  };

  // Handle file click
  const openFile = (name, path) => {
    console.log("Opening file:", name, "at path:", path);
  };

  // Example file/folder tree
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
          <ActivityBar />
        </div>

        {/* Sidebar - Fixed width, scrollable */}
        <div className="flex-shrink-0">
          <Sidebar />
        </div>

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
