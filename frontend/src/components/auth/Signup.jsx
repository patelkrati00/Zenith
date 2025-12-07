import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import toast from "react-hot-toast";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const API_BASE_URL = "http://localhost:3001";

  const { login } = useAuth(); // ⭐ use login(), not setUser()

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!acceptTerms) {
      setError("You must accept the Terms & Conditions");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      // ❗ Backend sends 409 when username/email already exists
      if (!response.ok) {
        setError(data.error || "Signup failed");
        return;
      }

      // ⭐ Save token
      localStorage.setItem("authToken", data.token);

      // ⭐ Save user
      localStorage.setItem("authUser", JSON.stringify(data.user));

      // ⭐ Use AuthContext login (not setUser)
      login(data.user);

      // ⭐ SHOW SUCCESS POPUP HERE
      toast.success("Signup successful!");

      // ⭐ Redirect after toast
      setTimeout(() => navigate("/editor"), 800);
    } catch (err) {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: "#0D0F14" }}
    >
      {/* Animated Gradient Orbs */}
      <motion.div
        className="absolute w-96 h-96 rounded-full blur-3xl opacity-20"
        style={{
          background: "linear-gradient(90deg, #3A7CFD, #6AA8FF)",
          left: "10%",
          top: "10%",
        }}
        animate={{
          x: [0, 120, 0],
          y: [0, -80, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute w-80 h-80 rounded-full blur-3xl opacity-10"
        style={{
          background: "linear-gradient(135deg, #3A7CFD, #5A8FFF)",
          right: "5%",
          bottom: "15%",
        }}
        animate={{
          x: [0, -100, 0],
          y: [0, 60, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute w-72 h-72 rounded-full blur-3xl opacity-10"
        style={{
          background: "linear-gradient(180deg, #2D5FBD, #1E3A7C)",
          left: "50%",
          bottom: "10%",
        }}
        animate={{
          x: [0, 50, 0],
          y: [0, -50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Signup Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div
          className="rounded-2xl p-8 shadow-2xl border"
          style={{
            backgroundColor: "#141821",
            borderColor: "rgba(58, 124, 253, 0.15)",
          }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1
              className="text-3xl font-bold mb-2 bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(90deg, #3A7CFD, #6AA8FF)",
              }}
            >
              Create an Account
            </h1>
            <p style={{ color: "#9CA3AF" }} className="text-sm">
              Sign up to start coding
            </p>
          </div>

          {error && (
            <div className="mb-4 text-sm" style={{ color: "#F97373" }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Input */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium mb-2"
                style={{ color: "#E6E9EF" }}
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border focus:outline-none transition-all duration-200"
                style={{
                  backgroundColor: "#0D0F14",
                  borderColor: "rgba(58, 124, 253, 0.2)",
                  color: "#E6E9EF",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#3A7CFD";
                  e.target.style.boxShadow =
                    "0 0 0 3px rgba(58, 124, 253, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(58, 124, 253, 0.2)";
                  e.target.style.boxShadow = "none";
                }}
                placeholder="Choose a username"
              />
            </div>

            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-2"
                style={{ color: "#E6E9EF" }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border focus:outline-none transition-all duration-200"
                style={{
                  backgroundColor: "#0D0F14",
                  borderColor: "rgba(58, 124, 253, 0.2)",
                  color: "#E6E9EF",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#3A7CFD";
                  e.target.style.boxShadow =
                    "0 0 0 3px rgba(58, 124, 253, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(58, 124, 253, 0.2)";
                  e.target.style.boxShadow = "none";
                }}
                placeholder="Enter your email"
              />
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2"
                style={{ color: "#E6E9EF" }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border focus:outline-none transition-all duration-200"
                style={{
                  backgroundColor: "#0D0F14",
                  borderColor: "rgba(58, 124, 253, 0.2)",
                  color: "#E6E9EF",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#3A7CFD";
                  e.target.style.boxShadow =
                    "0 0 0 3px rgba(58, 124, 253, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(58, 124, 253, 0.2)";
                  e.target.style.boxShadow = "none";
                }}
                placeholder="Create a password"
              />
            </div>

            {/* Confirm Password Input */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium mb-2"
                style={{ color: "#E6E9EF" }}
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border focus:outline-none transition-all duration-200"
                style={{
                  backgroundColor: "#0D0F14",
                  borderColor: "rgba(58, 124, 253, 0.2)",
                  color: "#E6E9EF",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#3A7CFD";
                  e.target.style.boxShadow =
                    "0 0 0 3px rgba(58, 124, 253, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(58, 124, 253, 0.2)";
                  e.target.style.boxShadow = "none";
                }}
                placeholder="Confirm your password"
              />
            </div>

            {/* Terms & Conditions Checkbox */}
            <div className="flex items-start">
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-2 cursor-pointer flex-shrink-0"
                  style={{
                    accentColor: "#3A7CFD",
                  }}
                />
                <span
                  className="ml-2 text-sm leading-tight"
                  style={{ color: "#E6E9EF" }}
                >
                  I agree to the{" "}
                  <a
                    href="#"
                    className="transition-colors duration-200"
                    style={{ color: "#3A7CFD" }}
                    onMouseEnter={(e) => (e.target.style.color = "#6AA8FF")}
                    onMouseLeave={(e) => (e.target.style.color = "#3A7CFD")}
                  >
                    Terms & Conditions
                  </a>
                </span>
              </label>
            </div>

            {/* Sign Up Button */}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-lg font-semibold text-white transition-all duration-300 relative overflow-hidden group"
              style={{
                background: "linear-gradient(135deg, #1E3A8A, #2563EB)",
              }}
              disabled={loading}
            >
              <span className="relative z-10">
                {loading ? "Signing up..." : "Sign Up"}
              </span>
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: "linear-gradient(135deg, #2563EB, #3B82F6)",
                }}
              />
            </motion.button>

            {/* Login Link */}
            <div className="text-center pt-2">
              <span className="text-sm" style={{ color: "#9CA3AF" }}>
                Already have an account?{" "}
              </span>
              <Link
                to="/login"
                className="text-sm font-semibold transition-colors duration-200"
                style={{ color: "#3A7CFD" }}
                onMouseEnter={(e) => (e.target.style.color = "#6AA8FF")}
                onMouseLeave={(e) => (e.target.style.color = "#3A7CFD")}
              >
                Login
              </Link>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
