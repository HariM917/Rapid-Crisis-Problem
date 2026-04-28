import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

const SOSButton = ({ onClick, type = "emergency", disabled = false, loading = false }) => {
  const colors = {
    fire: "from-red-500 to-orange-600 shadow-red-500/50",
    medical: "from-blue-500 to-cyan-600 shadow-blue-500/50",
    security: "from-slate-700 to-slate-900 shadow-slate-900/50",
    emergency: "from-red-600 to-red-800 shadow-red-600/50"
  };

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      onClick={onClick}
      disabled={disabled || loading}
      className={`relative w-48 h-48 rounded-full bg-gradient-to-br ${colors[type]} 
                 flex flex-col items-center justify-center text-white font-bold text-xl
                 shadow-2xl border-4 border-white/20 overflow-hidden group
                 disabled:opacity-80 disabled:cursor-not-allowed`}
    >
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute inset-0 bg-white/10"
      />
      
      {loading ? (
        <div className="flex flex-col items-center gap-2">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full"
          />
          <span className="text-[10px] font-black uppercase tracking-widest animate-pulse">Reporting...</span>
        </div>
      ) : (
        <>
          <ShieldAlert size={48} className="mb-2 z-10" />
          <span className="z-10 uppercase tracking-widest">SOS</span>
          <span className="z-10 text-xs font-normal opacity-80 mt-1">{type}</span>
        </>
      )}
    </motion.button>
  );
};

export default SOSButton;
