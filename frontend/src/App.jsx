import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import EditorPage from "./components/EditorPage";
import './App.css';
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import './styles/style.css'
import {AdminDashboard} from "./components/AdminDashboard/AdminDashboard";
import ProtectedRoute from "./components/auth/ProtectedRoute";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/editor"
          element={(
            <ProtectedRoute>
              <EditorPage />
            </ProtectedRoute>
          )}
        />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={(
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            )}
          />

      </Routes>
    </Router>
  );
}

export default App;
