import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Thermometer, Wind, AlertCircle } from 'lucide-react';

const IoTSensorPanel = ({ sensors = {} }) => {
  const sensorConfigs = [
    { 
      key: 'smoke', 
      label: 'Smoke Density', 
      icon: <Flame size={16} />, 
      unit: '%', 
      color: 'red',
      threshold: 70
    },
    { 
      key: 'temp', 
      label: 'Temperature', 
      icon: <Thermometer size={16} />, 
      unit: '°C', 
      color: 'orange',
      threshold: 45
    },
    { 
      key: 'motion', 
      label: 'Occupancy', 
      icon: <Wind size={16} />, 
      unit: '', 
      color: 'blue',
      isBinary: true 
    },
    { 
      key: 'panic', 
      label: 'Panic Button', 
      icon: <AlertCircle size={16} />, 
      unit: '', 
      color: 'slate',
      isBinary: true 
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {sensorConfigs.map((config) => {
        const val = sensors[config.key] || 0;
        const isCritical = config.threshold && val > config.threshold;
        
        return (
          <motion.div 
            key={config.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass p-4 rounded-2xl border-l-4 transition-all
              ${isCritical ? 'border-red-500 bg-red-50/50' : 'border-slate-200'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg bg-${config.color}-100 text-${config.color}-600`}>
                {config.icon}
              </div>
              <div className={`w-2 h-2 rounded-full animate-pulse ${isCritical ? 'bg-red-500' : 'bg-green-500'}`} />
            </div>
            
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">{config.label}</p>
            <div className="flex items-baseline gap-1">
              <h4 className={`text-xl font-black ${isCritical ? 'text-red-600' : 'text-slate-900'}`}>
                {config.isBinary ? (val ? 'DETECTED' : 'CLEAR') : val.toFixed(1)}
              </h4>
              <span className="text-[10px] text-slate-500 font-bold">{config.unit}</span>
            </div>
            
            {!config.isBinary && (
              <div className="mt-3 w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (val / (config.threshold * 1.5)) * 100)}%` }}
                  className={`h-full bg-${config.color}-500`}
                />
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

export default IoTSensorPanel;
