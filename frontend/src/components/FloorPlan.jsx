import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Flame, Activity, Shield, Info, MapPin } from 'lucide-react';

const rooms = [
  { id: '101', x: 5, y: 10, w: 14, h: 35 },
  { id: '102', x: 20, y: 10, w: 14, h: 35 },
  { id: '103', x: 35, y: 10, w: 14, h: 35 },
  { id: '104', x: 50, y: 10, w: 14, h: 35 },
  { id: '105', x: 65, y: 10, w: 14, h: 35 },
  { id: '106', x: 80, y: 10, w: 14, h: 35 },
  // Bottom row
  { id: '107', x: 5, y: 55, w: 14, h: 35 },
  { id: '108', x: 20, y: 55, w: 14, h: 35 },
  { id: '109', x: 35, y: 55, w: 14, h: 35 },
  { id: '110', x: 50, y: 55, w: 14, h: 35 },
  { id: '111', x: 65, y: 55, w: 14, h: 35 },
  { id: '112', x: 80, y: 55, w: 14, h: 35 },
];

const FloorPlan = ({ guests = [], activeIncidents = [], staff = [], activeFloor = 1 }) => {
  const [hoveredRoom, setHoveredRoom] = useState(null);

  const getRoomId = (baseId) => {
    return `${activeFloor}${baseId}`;
  };

  const getRoomStatus = (roomBaseId) => {
    const roomId = getRoomId(roomBaseId);
    const incident = activeIncidents.find(inc => String(inc.room_name).includes(roomId));
    if (incident) return { type: 'alert', data: incident };
    
    const guest = guests.find(g => g.room === roomId);
    if (guest) return { type: 'occupied', data: guest };
    
    return { type: 'empty', data: null };
  };

  // Convert GPS to SVG coords (simplified for building scale)
  const gpsToSvg = (lat, lng) => {
    const CENTER_LAT = 13.111;
    const CENTER_LNG = 80.135;
    const scale = 50000;
    return {
      x: 50 + (lng - CENTER_LNG) * scale,
      y: 50 - (lat - CENTER_LAT) * scale
    };
  };

  return (
    <div className="relative w-full h-full bg-white flex flex-col overflow-hidden">
      {/* Main Floor Container */}
      <div className="relative flex-1 bg-white p-4">
        {/* Blueprint Grid Lines */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
        />
        
        {/* Corridor */}
        <div className="absolute top-[45%] left-0 w-full h-[10%] bg-slate-50 border-y border-slate-100 flex items-center justify-between px-10">
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
            <Shield size={12} />
            Level {activeFloor} Tactical Corridor
          </div>
        </div>

        {/* Rooms Overlay */}
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
          <defs>
            <radialGradient id="fireGradient">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </radialGradient>
            
            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#22c55e" />
            </marker>
          </defs>

          {rooms.map((room) => {
            const roomId = getRoomId(room.id.slice(-2));
            const status = getRoomStatus(room.id.slice(-2));
            const isHovered = hoveredRoom === roomId;

            return (
              <g 
                key={roomId}
                onMouseEnter={() => setHoveredRoom(roomId)}
                onMouseLeave={() => setHoveredRoom(null)}
                className="cursor-pointer transition-all duration-300"
              >
                {/* Fire Spread Effect */}
                {status.type === 'alert' && status.data.type === 'fire' && (
                   <>
                    <motion.circle
                      cx={room.x + room.w/2} cy={room.y + room.h/2} r="15"
                      fill="url(#fireGradient)"
                      animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                      transition={{ repeat: Infinity, duration: 3 }}
                    />
                    <motion.rect
                      x={room.x - 2} y={room.y - 2} width={room.w + 4} height={room.h + 4}
                      rx="1"
                      fill="rgba(239, 68, 68, 0.1)"
                      animate={{ opacity: [0, 0.2, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    />
                   </>
                )}

                {/* Main Room Rect */}
                <rect
                  x={room.x} y={room.y} width={room.w} height={room.h}
                  rx="0.5"
                  className={`transition-colors duration-500 ${
                    status.type === 'alert' ? 'fill-red-50 stroke-red-500 stroke-[0.3]' :
                    status.type === 'occupied' ? 'fill-blue-50 stroke-blue-200 stroke-[0.2]' :
                    'fill-slate-50 stroke-slate-200 stroke-[0.1]'
                  }`}
                />

                {/* Room Number */}
                <text
                  x={room.x + room.w/2} y={room.y + room.h/2}
                  textAnchor="middle"
                  className={`text-[3px] font-black tracking-tighter transition-colors ${
                    status.type === 'alert' ? 'fill-red-600' :
                    status.type === 'occupied' ? 'fill-blue-600' :
                    'fill-slate-400'
                  }`}
                >
                  {roomId}
                </text>

                {/* Evacuation Arrows (If Fire is nearby) */}
                {activeIncidents.some(inc => inc.type === 'fire' && String(inc.room_name).includes(String(activeFloor))) && status.type !== 'alert' && (
                  <motion.line
                    x1={room.x + room.w/2} y1={room.y + room.h/2}
                    x2={room.x + room.w/2} y2={50}
                    stroke="#22c55e"
                    strokeWidth="0.5"
                    strokeDasharray="1,1"
                    markerEnd="url(#arrow)"
                    animate={{ strokeDashoffset: [0, -10] }}
                    transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
                  />
                )}
              </g>
            );
          })}

          {/* Elevator & Stairs */}
          <rect x="94" y="40" width="4" height="20" rx="0.5" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.2" />
          <text x="96" y="50" textAnchor="middle" className="fill-slate-400 text-[2px] font-bold" transform="rotate(90, 96, 50)">LIFT</text>
          
          <rect x="2" y="40" width="4" height="20" rx="0.5" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.2" />
          <text x="4" y="50" textAnchor="middle" className="fill-slate-400 text-[2px] font-bold" transform="rotate(-90, 4, 50)">STAIRS</text>

          {/* Staff Avatars */}
          {staff.map(s => {
            const pos = gpsToSvg(s.location_lat, s.location_lng);
            return (
              <motion.g 
                key={s.id}
                initial={false}
                animate={{ x: pos.x, y: pos.y }}
                transition={{ type: "spring", stiffness: 50 }}
              >
                <circle r="1.5" fill="#10b981" stroke="white" strokeWidth="0.2" />
                <text y="-2" textAnchor="middle" className="fill-emerald-600 text-[1.5px] font-black uppercase">{s.username}</text>
              </motion.g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-12 right-12 flex flex-col gap-3 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-white shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-blue-400" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Occupied</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Hazard</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Responder</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-0.5 bg-emerald-500 border-t border-dashed border-emerald-500" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Safe Path</span>
          </div>
        </div>
        {/* Enhanced Tooltip Overlay (Glassmorphism) */}
        <AnimatePresence>
          {hoveredRoom && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              style={{ 
                position: 'absolute',
                left: `${rooms.find(r => getRoomId(r.id.slice(-2)) === hoveredRoom).x}%`,
                top: `${rooms.find(r => getRoomId(r.id.slice(-2)) === hoveredRoom).y > 50 ? rooms.find(r => getRoomId(r.id.slice(-2)) === hoveredRoom).y - 25 : rooms.find(r => getRoomId(r.id.slice(-2)) === hoveredRoom).y + 35}%`,
                zIndex: 50
              }}
              className="pointer-events-none w-64 bg-white/90 backdrop-blur-xl border border-white shadow-2xl rounded-2xl p-4 ring-1 ring-slate-900/5"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Room</p>
                  <h4 className="text-xl font-black text-slate-900">{hoveredRoom}</h4>
                </div>
                {getRoomStatus(hoveredRoom.slice(-2)).type === 'alert' ? (
                  <div className="w-8 h-8 bg-red-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-200">
                    <Flame size={16} />
                  </div>
                ) : getRoomStatus(hoveredRoom.slice(-2)).type === 'occupied' ? (
                  <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                    <User size={16} />
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                    <Info size={16} />
                  </div>
                )}
              </div>

              {getRoomStatus(hoveredRoom.slice(-2)).type === 'occupied' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black text-slate-800">{getRoomStatus(hoveredRoom.slice(-2)).data.name}</p>
                    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[8px] font-black uppercase rounded">GUEST</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                    <MapPin size={10} className="text-slate-400" />
                    Check-in: {(() => {
                      const guest = getRoomStatus(hoveredRoom.slice(-2)).data;
                      return new Date(guest.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    })()}
                  </div>
                </div>
              )}

              {getRoomStatus(hoveredRoom.slice(-2)).type === 'alert' && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                  <p className="text-[10px] font-black text-red-600 uppercase mb-1">CRITICAL THREAT</p>
                  <p className="text-xs text-slate-700 font-bold">Emergency protocol active in this zone.</p>
                </div>
              )}

              {getRoomStatus(hoveredRoom.slice(-2)).type === 'empty' && (
                <p className="text-xs text-slate-400 font-medium italic">Room is currently vacant.</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FloorPlan;
