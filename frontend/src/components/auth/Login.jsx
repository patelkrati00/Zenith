import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log({ email, password, rememberMe });
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: '#0D0F14' }}>
            {/* Animated Gradient Orb */}
            <motion.div
                className="absolute w-96 h-96 rounded-full blur-3xl opacity-20"
                style={{
                    background: 'linear-gradient(90deg, #3A7CFD, #6AA8FF)',
                }}
                animate={{
                    x: [0, 100, 0],
                    y: [0, -100, 0],
                    scale: [1, 1.2, 1],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            <motion.div
                className="absolute w-72 h-72 rounded-full blur-3xl opacity-10"
                style={{
                    background: 'linear-gradient(135deg, #2D5FBD, #1E3A7C)',
                    right: '10%',
                    top: '20%',
                }}
                animate={{
                    x: [0, -80, 0],
                    y: [0, 80, 0],
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            {/* Login Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative z-10 w-full max-w-md mx-4"
            >
                <div
                    className="rounded-2xl p-8 shadow-2xl border"
                    style={{
                        backgroundColor: '#141821',
                        borderColor: 'rgba(58, 124, 253, 0.1)',
                    }}
                >
                    {/* Header */}
                    <div className="mb-8">
                        <h1
                            className="text-3xl font-bold mb-2 bg-clip-text text-transparent"
                            style={{
                                backgroundImage: 'linear-gradient(90deg, #3A7CFD, #6AA8FF)',
                            }}
                        >
                            Welcome to CodeDitor
                        </h1>
                        <p style={{ color: '#9CA3AF' }} className="text-sm">
                            Sign in to continue coding
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email Input */}
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium mb-2"
                                style={{ color: '#E6E9EF' }}
                            >
                                Email or Username
                            </label>
                            <input
                                id="email"
                                type="text"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all duration-200"
                                style={{
                                    backgroundColor: '#0D0F14',
                                    borderColor: 'rgba(58, 124, 253, 0.2)',
                                    color: '#E6E9EF',
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#3A7CFD';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(58, 124, 253, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = 'rgba(58, 124, 253, 0.2)';
                                    e.target.style.boxShadow = 'none';
                                }}
                                placeholder="Enter your email"
                            />
                        </div>

                        {/* Password Input */}
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium mb-2"
                                style={{ color: '#E6E9EF' }}
                            >
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all duration-200"
                                style={{
                                    backgroundColor: '#0D0F14',
                                    borderColor: 'rgba(58, 124, 253, 0.2)',
                                    color: '#E6E9EF',
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#3A7CFD';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(58, 124, 253, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = 'rgba(58, 124, 253, 0.2)';
                                    e.target.style.boxShadow = 'none';
                                }}
                                placeholder="Enter your password"
                            />
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 rounded border-2 cursor-pointer"
                                    style={{ accentColor: '#3A7CFD' }}
                                />
                                <span className="ml-2 text-sm" style={{ color: '#E6E9EF' }}>
                                    Remember me
                                </span>
                            </label>

                            <a
                                href="#"
                                className="text-sm hover:underline transition-colors duration-200"
                                style={{ color: '#9CA3AF' }}
                                onMouseEnter={(e) => (e.target.style.color = '#3A7CFD')}
                                onMouseLeave={(e) => (e.target.style.color = '#9CA3AF')}
                            >
                                Forgot password?
                            </a>
                        </div>
                        {/* Login Button */}
                        <motion.button
                            type="submit"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-3 rounded-lg font-semibold text-white transition-all duration-300 relative overflow-hidden group"
                            style={{
                                background: 'linear-gradient(135deg, #1E3A8A, #2563EB)',
                            }}
                        >
                            <span className="relative z-10">Login</span>
                            <div
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                style={{
                                    background: 'linear-gradient(135deg, #2563EB, #3B82F6)',
                                }}
                            />
                        </motion.button>

                        {/* Create Account */}
                        <div className="text-center">
                            <span className="text-sm" style={{ color: '#9CA3AF' }}>
                                Don't have an account?{' '}
                            </span>
                            <Link
                                to="/signup"
                                className="text-sm font-semibold transition-colors duration-200"
                                style={{ color: '#3A7CFD' }}
                                onMouseEnter={(e) => (e.target.style.color = '#6AA8FF')}
                                onMouseLeave={(e) => (e.target.style.color = '#3A7CFD')}
                            >
                                Create Account
                            </Link>
                        </div>

                    </form>
                </div>
            </motion.div>
        </div>
    );
}