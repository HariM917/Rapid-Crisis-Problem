import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Clock, CheckCircle } from 'lucide-react';

const AlertsPanel = ({ incidents = [], onResolve }) => {
  const activeAlerts = incidents.filter(i => i.status === 'active');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <AlertCircle size={20} className="text-red-500" />
          Active Alerts
        </h2>
        <span className="bg-red-500/20 text-red-500 px-2 py-0.5 rounded text-[10px] font-bold">
          {activeAlerts.length} URGENT
        </span>
      </div>

      <AnimatePresence>
        {activeAlerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass p-4 rounded-2xl border-l-4 border-red-500 hover:bg-white/5 transition-all"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-black uppercase text-slate-500">
                #INC-{alert.id} • {alert.type}
              </span>
              <span className="flex items-center gap-1 text-slate-500 text-[10px]">
                <Clock size={10} />
                Just now
              </span>
            </div>
            <p className="text-sm font-medium mb-3">{alert.description}</p>
            <button
              onClick={() => onResolve(alert.id)}
              className="w-full py-2 bg-green-600/10 hover:bg-green-600 text-green-500 hover:text-white rounded-xl text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle size={12} />
              Mark Resolved
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      {activeAlerts.length === 0 && (
        <div className="text-center py-12 glass rounded-2xl border-dashed border-slate-700">
          <p className="text-slate-500 text-sm italic">No active emergencies</p>
        </div>
      )}
    </div>
  );
};

export default AlertsPanel;
