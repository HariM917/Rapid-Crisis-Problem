import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';

const Notification = ({ message, type = 'info', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    info: 'bg-blue-600',
    success: 'bg-green-600',
    warning: 'bg-orange-600',
    error: 'bg-red-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, x: 20 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`fixed top-6 right-6 z-[100] flex items-center gap-4 p-4 rounded-2xl shadow-2xl ${colors[type]} text-white min-w-[300px] border border-white/20`}
    >
      <div className="bg-white/20 p-2 rounded-xl">
        <Bell size={20} />
      </div>
      <div className="flex-1">
        <p className="text-xs font-black uppercase tracking-wider opacity-70">{type}</p>
        <p className="text-sm font-bold">{message}</p>
      </div>
      <button onClick={onClose} className="hover:bg-white/10 p-1 rounded-lg transition-colors">
        <X size={18} />
      </button>
    </motion.div>
  );
};

export default Notification;
