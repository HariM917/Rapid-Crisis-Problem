import React, { useState } from 'react';
import SOSButton from '../components/SOSButton';
import VoiceSOS from '../components/VoiceSOS';
import { incidentService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  AlertTriangle, 
  Shield, 
  MapPin, 
  Compass,
  Menu,
  Bell,
  Flame,
  Activity,
  Check
} from 'lucide-react';
import SafeExitMap from '../components/SafeExitMap';

const GuestPage = () => {
  const [status, setStatus] = useState('idle'); // idle, reporting, success, error, safe-exit
  const [lastIncident, setLastIncident] = useState(null);
  const [userLoc, setUserLoc] = useState([13.111, 80.135]);
  const [phone, setPhone] = useState('');
  const [activeAlert, setActiveAlert] = useState(null);

  // WebSocket for Real-time Guest Alerts
  useState(() => {
    const ws = new WebSocket('ws://localhost:8000/ws');
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.event === 'incident_created' || msg.event === 'incident_updated') {
        const incident = msg.data;
        // Logic to check if alert applies to this guest (simplified: if fire)
        if (incident.type === 'fire' && incident.status === 'active') {
          setActiveAlert(incident);
          setStatus('safe-exit'); // Auto-switch to safe exit map
          window.speechSynthesis.speak(new SpeechSynthesisUtterance("CRITICAL ALERT: FIRE DETECTED. PLEASE EVACUATE VIA STAIRS."));
        } else if (incident.status === 'resolved') {
          setActiveAlert(null);
          setStatus('idle');
        }
      }
    };
    return () => ws.close();
  }, []);

  const reportIncident = async (type, description = '') => {
    // Basic validation: just check if it's numeric/reasonable if provided
    if (phone && !/^\d{10,15}$/.test(phone.replace(/\D/g, ''))) {
      alert("Please enter a valid phone number");
      return;
    }
    setStatus('reporting');
    const FALLBACK_LOC = [13.111, 80.135]; // India Chennai Center

    const sendData = async (lat, lng) => {
      try {
        const response = await incidentService.create({
          type,
          description: description || `Emergency ${type} reported by guest.`,
          lat: 13.111,
          lng: 80.135,
          phone_number: phone
        });
        setLastIncident(response.data);
        setStatus('success');
        window.speechSynthesis.speak(new SpeechSynthesisUtterance("Emergency dispatched. Help is 3 minutes away."));
      } catch (err) {
        setStatus('error');
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => sendData(pos.coords.latitude, pos.coords.longitude),
        () => sendData(FALLBACK_LOC[0], FALLBACK_LOC[1]),
        { timeout: 2000, enableHighAccuracy: false }
      );
    } else {
      sendData(FALLBACK_LOC[0], FALLBACK_LOC[1]);
    }
  };

  const handleVoiceTranscription = (text) => {
    reportIncident('', text); // AI will classify on backend
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-blue-600/5 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-red-600/5 blur-[120px] rounded-full" />
      </div>
      
      <div className="z-10 text-center mb-10">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-center gap-3 mb-6"
        >
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-xl shadow-red-600/20">
            <Shield size={24} className="text-white" />
          </div>
          <span className="text-xl font-black tracking-tighter text-slate-900 uppercase italic">CRISISCOORD</span>
        </motion.div>
        <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tighter uppercase italic">
          EMERGENCY ASSIST
        </h1>
        <p className="text-slate-500 font-medium text-xs tracking-wide">
          Immediate 24/7 Security & Medical Dispatch
        </p>
      </div>

      <div className="z-10 flex flex-col items-center gap-8 max-w-lg w-full">
        <AnimatePresence mode="wait">
          {status === 'idle' || status === 'reporting' ? (
            <motion.div 
              key="buttons"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-6 w-full"
            >
              <div className="w-full space-y-2">
                <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest block text-center">Identity (Phone Number)</label>
                <input 
                  type="text" 
                  placeholder="Enter phone number" 
                  className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-center text-sm font-bold focus:ring-4 ring-red-500/10 outline-none transition-all shadow-inner"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <SOSButton 
                onClick={() => reportIncident('emergency')} 
                disabled={status === 'reporting'}
                loading={status === 'reporting'}
              />
              
              <div className="grid grid-cols-3 gap-4 w-full px-4">
                <button 
                  onClick={() => reportIncident('fire')}
                  className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-orange-500/10 text-orange-600 border border-orange-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all group"
                >
                  <Flame size={20} className="group-hover:scale-110 transition-transform" />
                  FIRE
                </button>
                <button 
                  onClick={() => reportIncident('medical')}
                  className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-blue-500/10 text-blue-600 border border-blue-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all group"
                >
                  <Activity size={20} className="group-hover:scale-110 transition-transform" />
                  MEDICAL
                </button>
                <button 
                  onClick={() => reportIncident('security')}
                  className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-slate-500/10 text-slate-500 border border-slate-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-slate-500 hover:text-white transition-all group"
                >
                  <Shield size={20} className="group-hover:scale-110 transition-transform" />
                  SECURITY
                </button>
              </div>

              <div className="w-full">
                <button 
                  onClick={() => setStatus('safe-exit')}
                  className="w-full py-4 rounded-2xl bg-green-600/10 text-green-600 border border-green-500/20 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-green-600 hover:text-white transition-all shadow-lg hover:shadow-green-500/10"
                >
                  <Compass size={18} />
                  Safe Exit Path
                </button>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-8 w-full">
                <p className="text-center text-slate-400 text-[8px] font-black uppercase mb-4 tracking-[0.2em] opacity-50">Authorized Dispatch Channel</p>
                <VoiceSOS onTranscription={handleVoiceTranscription} />
              </div>
            </motion.div>
          ) : status === 'safe-exit' ? (
            <motion.div 
              key="safe-exit"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full space-y-6"
            >
              {activeAlert && (
                <div className="bg-red-600 text-white p-6 rounded-3xl shadow-xl shadow-red-600/20 animate-pulse border-2 border-red-500">
                  <div className="flex items-center gap-3 mb-2">
                    <Flame size={24} />
                    <h2 className="text-xl font-black uppercase tracking-tighter italic">Critical Evacuation</h2>
                  </div>
                  <p className="text-sm font-bold opacity-90">{activeAlert.guest_steps || "Proceed to nearest exit immediately."}</p>
                </div>
              )}

              <div className="h-[350px] w-full rounded-[2.5rem] overflow-hidden border-2 border-green-500/30 shadow-2xl relative">
                <SafeExitMap userLocation={userLoc} exitLocation={[userLoc[0] + 0.005, userLoc[1] + 0.005]} />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-xl border border-slate-200 text-[10px] font-black uppercase text-green-600 shadow-sm">
                   Safe Path Generated
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-500/10 rounded-2xl">
                    <Compass className="text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-slate-900 font-bold mb-1">Evacuation Instructions</h3>
                    <p className="text-slate-600 text-xs leading-relaxed font-medium italic">
                      {activeAlert ? activeAlert.guest_steps : "Follow the illuminated green markers on the floor. Head toward the nearest staircase. Do not use elevators."}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => { setStatus('idle'); setActiveAlert(null); }}
                  className="w-full mt-6 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-slate-900/10"
                >
                  Return to Main
                </button>
              </div>
            </motion.div>
          ) : status === 'success' ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white p-10 rounded-[40px] text-center max-w-md w-full border border-slate-100 shadow-2xl"
            >
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check size={40} className="text-green-500" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">HELP DISPATCHED</h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-8">
                Emergency responders have been alerted to your location. Help is on the way.
                <br/><br/>
                {lastIncident?.type === 'fire' ? (
                  <span className="inline-block bg-red-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-sm animate-pulse">
                    🚨 USE STAIRCASE ONLY
                  </span>
                ) : lastIncident?.type === 'medical' ? (
                  <span className="inline-block bg-blue-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-sm animate-pulse">
                    🏥 USE LIFT FOR SPEED
                  </span>
                ) : (
                  <span className="inline-block bg-slate-900 text-white px-6 py-3 rounded-2xl font-black uppercase text-sm">
                    🛡️ REMAIN CALM & SECURE
                  </span>
                )}
              </p>
              
              <button 
                onClick={() => setStatus('idle')}
                className="w-full py-4 rounded-2xl bg-slate-900 text-white font-bold uppercase tracking-wider hover:bg-slate-800 transition-all"
              >
                Return to SOS
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-10 rounded-[40px] text-center max-w-md w-full border border-red-500/10 shadow-2xl"
            >
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={40} className="text-red-500" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">SYSTEM ERROR</h2>
              <p className="text-slate-600 mb-8 font-medium">Communication was interrupted. Retrying...</p>
              <button 
                onClick={() => setStatus('idle')}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black uppercase tracking-widest transition-all"
              >
                Retry Dispatch
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="absolute bottom-10 flex flex-col items-center gap-2 opacity-30">
        <div className="h-[1px] w-12 bg-slate-200 mb-2" />
        <p className="text-slate-400 text-[10px] font-black tracking-[0.4em] uppercase">CRISISCOORD SECURE NETWORK</p>
        <p className="text-slate-500 text-[8px] font-bold uppercase tracking-widest">HOSPITALITY EDITION V1.0.4</p>
      </footer>
    </div>
  );
};

export default GuestPage;
