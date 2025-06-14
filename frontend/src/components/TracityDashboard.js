import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ChatPopup from './ChatPopup';

const TracityDashboard = ({ stats }) => {
  const [showChat, setShowChat] = useState(false);
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/datasets`);
      if (response.ok) {
        const data = await response.json();
        setDatasets(data);
      }
    } catch (error) {
      console.error('Error fetching datasets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChatTrigger = () => {
    setShowChat(true);
  };

  const handleCloseChat = () => {
    setShowChat(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-4 md:p-6 lg:p-8 relative">
      <motion.div
        className="max-w-7xl mx-auto h-screen flex flex-col"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div 
          variants={itemVariants} 
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mr-4">
              <span className="text-2xl">⚡</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold gradient-text tracity-font">
              TRACITY
            </h1>
          </div>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Your AI Data Companion
          </p>
        </motion.div>

        {/* Main Content Area */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          
          {/* Left Section - Headline */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-col justify-center space-y-8"
          >
            <div className="text-left">
              <motion.h2 
                className="text-6xl md:text-7xl lg:text-8xl font-bold mera-pro-font text-white leading-tight blur-text"
                initial={{ filter: "blur(20px)", opacity: 0, y: 20 }}
                animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
                transition={{ duration: 2, ease: "easeOut" }}
              >
                Visualise The Mess,
              </motion.h2>
              <motion.h2 
                className="text-6xl md:text-7xl lg:text-8xl font-bold mera-pro-font gradient-text leading-tight blur-text"
                initial={{ filter: "blur(20px)", opacity: 0, y: 20 }}
                animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
                transition={{ duration: 2, ease: "easeOut", delay: 0.3 }}
              >
                Realise The Insights.
              </motion.h2>
            </div>
            
            {/* Subtitle */}
            <motion.p 
              className="text-xl text-slate-300 max-w-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.8 }}
            >
              Transform complex data into actionable insights with our AI-powered analytics platform designed for Indian states.
            </motion.p>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1.2 }}
            >
              <motion.button 
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-8 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = '/explorer'}
              >
                Start Exploring Data
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Right Section - Interactive Area */}
          <motion.div 
            variants={itemVariants}
            className="flex justify-center items-center relative"
          >
            {/* Invisible Circle for Chat Trigger */}
            <div 
              className="invisible-circle"
              onClick={handleChatTrigger}
              style={{
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div className="chat-popup-hint">
                Try clicking me
              </div>
            </div>

            {/* Background Cosmic Effects */}
            <div className="relative">
              {/* Floating Particles */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full"
                  style={{
                    top: `${20 + i * 15}%`,
                    left: `${15 + i * 10}%`,
                  }}
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0.3, 1, 0.3],
                    scale: [1, 1.5, 1],
                  }}
                  transition={{
                    duration: 3 + i * 0.5,
                    repeat: Infinity,
                    delay: i * 0.3,
                  }}
                />
              ))}

              {/* Central Cosmic Orb */}
              <motion.div
                className="w-80 h-80 rounded-full relative"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 50,
                  damping: 10,
                  delay: 0.5
                }}
              >
                {/* Outer Ring */}
                <div className="absolute inset-0 rounded-full bg-gradient-conic from-purple-600 via-blue-600 via-pink-600 to-purple-600 animate-spin-slow opacity-30"></div>
                
                {/* Middle Ring */}
                <div className="absolute inset-4 rounded-full bg-gradient-conic from-blue-500 via-purple-500 via-pink-500 to-blue-500 animate-spin-slow opacity-50" style={{animationDuration: '15s', animationDirection: 'reverse'}}></div>
                
                {/* Inner Core */}
                <div className="absolute inset-8 rounded-full bg-gradient-radial from-white/20 via-purple-900/80 to-slate-900 backdrop-blur-sm">
                  {/* Swirling Patterns */}
                  <div className="absolute inset-0 rounded-full overflow-hidden">
                    <div className="absolute top-1/4 left-1/4 w-16 h-16 bg-gradient-to-br from-cyan-400/40 to-blue-600/40 rounded-full blur-lg animate-pulse"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-12 h-12 bg-gradient-to-br from-pink-400/40 to-purple-600/40 rounded-full blur-lg animate-pulse" style={{ animationDelay: '1s' }}></div>
                    <div className="absolute top-1/2 right-1/3 w-8 h-8 bg-gradient-to-br from-orange-400/40 to-yellow-500/40 rounded-full blur-lg animate-pulse" style={{ animationDelay: '2s' }}></div>
                  </div>

                  {/* Center Glow */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-gradient-radial from-white/60 to-transparent rounded-full animate-pulse"></div>
                </div>

                {/* Outer Glow Rings */}
                <div className="absolute -inset-2 rounded-full border border-purple-400/20 animate-pulse"></div>
                <div className="absolute -inset-4 rounded-full border border-blue-400/15 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute -inset-6 rounded-full border border-pink-400/10 animate-pulse" style={{ animationDelay: '1s' }}></div>
              </motion.div>

              {/* Data Visualization Preview - REMOVED */}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Chat Popup */}
      <AnimatePresence>
        {showChat && (
          <ChatPopup onClose={handleCloseChat} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TracityDashboard;