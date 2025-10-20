import TopBar from "./EditorPage/TopBar";
import Sidebar from "./EditorPage/Sidebar";
import React, { useState } from "react";

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
    <>
      <TopBar />
      <Sidebar
        fileTree={fileTree}
        openFolders={openFolders}
        toggleFolder={toggleFolder}
        openFile={openFile}
      />
    </>
  );
};

export default EditorPage;
