import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Code2, Sparkles, Zap, Layers } from 'lucide-react';
import { useNavigate } from "react-router-dom";


const Home = () => {
  const [glowIntensity, setGlowIntensity] = useState(0);
  const navigate = useNavigate(); // <-- THIS IS MISSING

  useEffect(() => {
    const interval = setInterval(() => {
      setGlowIntensity(prev => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0B14] text-[#E6E9F0] font-['Inter',sans-serif] overflow-hidden">
      {/* Gradient Navbar */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-50 backdrop-blur-xl bg-gradient-to-r from-[#0A0B14]/80 via-[#0A0B14]/60 to-[#0A0B14]/80 border-b border-[#5B8DEF]/20"
      >
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <motion.div
            className="flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#5B8DEF] to-[#9A7DFF] blur-lg opacity-50"></div>
              <Code2 className="relative w-8 h-8 text-[#5B8DEF]" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-[#5B8DEF] to-[#9A7DFF] bg-clip-text text-transparent">
              CodeDitor
            </span>
          </motion.div>

          <div className="flex items-center gap-8">
            {['Features', 'Docs', 'Community'].map((item, i) => (
              <motion.a
                key={item}
                href="#"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                whileHover={{ scale: 1.1, color: '#5B8DEF' }}
                className="text-[#E6E9F0]/80 hover:text-[#5B8DEF] transition-colors duration-300 font-medium"
              >
                {item}
              </motion.a>
            ))}
            <motion.button
            onClick={() => navigate("/login")} 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-5 py-2 rounded-full bg-gradient-to-r from-[#5B8DEF]/20 to-[#9A7DFF]/20 border border-[#5B8DEF]/40 hover:border-[#5B8DEF] transition-all duration-300 font-medium"
            >
              Sign In
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <div className="relative min-h-[90vh] flex items-center justify-center px-6">
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#5B8DEF]/20 rounded-full blur-[120px]"
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              rotate: [0, -90, 0],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#9A7DFF]/20 rounded-full blur-[120px]"
          />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
          {/* Floating Icons */}
          <div className="flex justify-center gap-12 mb-8">
            {[Sparkles, Zap, Layers].map((Icon, i) => (
              <motion.div
                key={i}
                initial={{ y: 0 }}
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 3, delay: i * 0.4, repeat: Infinity, ease: "easeInOut" }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#5B8DEF] to-[#9A7DFF] blur-xl opacity-50"></div>
                <Icon className="relative w-8 h-8 text-[#5B8DEF]" />
              </motion.div>
            ))}
          </div>

          {/* Main Heading with Glow Effect */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="text-6xl md:text-8xl font-bold leading-tight"
          >
            <span className="relative inline-block">
              <span
                className="absolute inset-0 bg-gradient-to-r from-[#5B8DEF] to-[#9A7DFF] blur-2xl opacity-50"
                style={{
                  transform: `scale(${1 + glowIntensity * 0.002})`,
                  transition: 'transform 0.05s ease-out'
                }}
              ></span>
              <span className="relative bg-gradient-to-r from-[#5B8DEF] to-[#9A7DFF] bg-clip-text text-transparent">
                Code Without
              </span>
            </span>
            <br />
            <span className="text-[#E6E9F0]">Boundaries</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="text-xl md:text-2xl text-[#E6E9F0]/70 max-w-3xl mx-auto leading-relaxed"
          >
            Experience the future of coding with CodeDitor. A powerful, lightning-fast online editor built for developers who demand excellence.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8"
          >
            {/* Primary Button */}
            <motion.button
              onClick={() => navigate("/editor")} // <-- add onClick here
              whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(91, 141, 239, 0.6)" }}
              whileTap={{ scale: 0.95 }}
              className="relative group px-10 py-5 rounded-2xl overflow-hidden font-semibold text-lg"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#5B8DEF] to-[#9A7DFF] opacity-100 group-hover:opacity-90 transition-opacity"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-[#5B8DEF] to-[#9A7DFF] blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <span className="relative z-10 flex items-center gap-3">
                Start Coding
                <Code2 className="w-5 h-5" />
              </span>
            </motion.button>


            {/* Secondary Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-10 py-5 rounded-2xl backdrop-blur-xl bg-[#E6E9F0]/5 border-2 border-[#5B8DEF]/30 hover:border-[#5B8DEF] hover:bg-[#5B8DEF]/10 transition-all duration-300 font-semibold text-lg"
            >
              View Demo
            </motion.button>
          </motion.div>

          {/* Feature Pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="flex flex-wrap items-center justify-center gap-4 pt-12"
          >
            {['Real-time Collaboration', 'AI-Powered', 'Blazing Fast', '50+ Languages'].map((feature, i) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2 + i * 0.1 }}
                whileHover={{ scale: 1.1, y: -5 }}
                className="px-5 py-2 rounded-full backdrop-blur-xl bg-[#E6E9F0]/5 border border-[#5B8DEF]/20 text-sm font-medium"
              >
                {feature}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Decorative Bottom Glow */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#5B8DEF] to-transparent opacity-30"></div>
    </div>
  );
};

export default Home;