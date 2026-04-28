import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text, ContactShadows, Float, Html } from '@react-three/drei';
import * as THREE from 'three';

const Room = ({ position, size, name, type, temp, guestName, isActiveFloor, incident, onClick }) => {
  const mesh = useRef();
  
  const color = useMemo(() => {
    if (incident) return '#ef4444'; // Red for incident
    
    // Thermal gradient for rooms based on live IoT data
    if (temp > 40) {
        const hue = Math.max(0, 30 - ((temp - 40) * 0.5)); // Goes from Orange to Red
        return `hsl(${hue}, 90%, 50%)`;
    }
    if (temp > 25) {
        const hue = Math.max(30, 240 - ((temp - 25) * 10)); // Goes from Blue to Orange
        return `hsl(${hue}, 70%, 50%)`;
    }
    
    if (guestName) return '#3b82f6'; // Blue for occupied
    if (type === 'stairs' || type === 'lift') return '#64748b';
    if (type === 'fire_exit') return '#22c55e';
    if (type === 'corridor') return '#cbd5e1';
    
    return '#f1f5f9';
  }, [type, guestName, temp, incident]);

  useFrame((state) => {
    if (incident && mesh.current) {
      // Pulse effect for active threats
      mesh.current.material.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 8) * 0.5;
    }
    if (temp > 50 && mesh.current) {
        // Subtle heat shimmer
        mesh.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.02;
    }
  });

  return (
    <group position={position} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <mesh ref={mesh}>
        <boxGeometry args={[size[0], size[1], size[2]]} />
        <meshStandardMaterial 
          color={color} 
          transparent 
          opacity={isActiveFloor ? 0.8 : 0.2} 
          emissive={incident ? '#ff0000' : temp > 40 ? '#ff8800' : color}
          emissiveIntensity={incident ? 0.5 : temp > 40 ? 0.2 : 0.05}
        />
      </mesh>
      {isActiveFloor && (
        <Text
          position={[0, size[1]/2 + 0.1, 0]}
          fontSize={0.15}
          color="black"
          anchorX="center"
          anchorY="middle"
          rotation={[-Math.PI / 2, 0, 0]}
        >
          {name}
        </Text>
      )}
    </group>
  );
};

const StaffMarker = ({ staff }) => {
    const mesh = useRef();
    
    // Map lat/lng to 3D space (centered at 13.111, 80.135)
    const x = (staff.location_lng - 80.135) * 50000;
    const z = (staff.location_lat - 13.111) * 50000;
    const y = (staff.location_floor - 1) * 2 + 0.5;

    useFrame((state) => {
        if (mesh.current) {
            mesh.current.rotation.y += 0.05;
            mesh.current.position.y = y + Math.sin(state.clock.elapsedTime * 4) * 0.1;
        }
    });

    return (
        <group position={[x, y, z]} ref={mesh}>
            <mesh>
                <sphereGeometry args={[0.15, 16, 16]} />
                <meshStandardMaterial color={staff.role === 'firefighter' ? '#ef4444' : '#3b82f6'} emissive="#ffffff" emissiveIntensity={0.5} />
            </mesh>
            <Html distanceFactor={5}>
                <div className="px-2 py-1 bg-slate-900 text-white text-[8px] font-black rounded-md whitespace-nowrap shadow-xl">
                    {staff.username.toUpperCase()}
                </div>
            </Html>
        </group>
    );
};

const ThreeMapView = ({ mapData, activeFloor = 1, incidents = [], staff = [], iotData = {} }) => {
  const [selectedRoom, setSelectedRoom] = useState(null);
  
  if (!mapData || !mapData.rooms) return null;

  return (
    <div className="w-full h-full relative bg-slate-50">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[12, 12, 12]} fov={40} />
        <OrbitControls enableDamping dampingFactor={0.05} />
        
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={1.5} castShadow />
        <spotLight position={[-10, 20, 10]} angle={0.15} penumbra={1} intensity={1} />

        <group position={[0, -2, 0]}>
            {[1, 2, 3, 4, 5].map(f => {
                const isActiveFloor = f === activeFloor;
                const yPos = (f - 1) * 2;
                
                return (
                    <group key={f} position={[0, yPos, 0]}>
                        {/* Floor Plate */}
                        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2.5, -0.05, 1.5]}>
                            <planeGeometry args={[14, 8]} />
                            <meshStandardMaterial color="#f8fafc" transparent opacity={isActiveFloor ? 0.2 : 0.05} />
                        </mesh>

                        {/* Render Rooms for this floor */}
                        {mapData.rooms.filter(r => r.floor === f || r.floor === 'all').map((room) => {
                            const x = (room.latlngs[0][0][1] - 80.135) * 50000;
                            const z = (room.latlngs[0][0][0] - 13.111) * 50000;
                            
                            const incident = incidents.find(inc => String(inc.room_name).includes(room.name));
                            const currentTemp = iotData[room.id] || room.temp || 22;

                            return (
                                <Room 
                                    key={room.id}
                                    position={[x, 0.25, z]}
                                    size={[1.2, 0.5, 1.2]} // Larger rooms for tactical clarity
                                    name={room.name}
                                    type={room.type}
                                    temp={currentTemp}
                                    guestName={room.guest_name}
                                    isActiveFloor={isActiveFloor}
                                    incident={incident}
                                    onClick={() => setSelectedRoom({...room, currentTemp, incident})}
                                />
                            );
                        })}
                    </group>
                );
            })}
        </group>

        {/* Staff Members */}
        <group position={[0, -2, 0]}>
            {staff.map(s => <StaffMarker key={s.id} staff={s} />)}
        </group>

        {/* Structural Pillars */}
        <mesh position={[-4, 2, -3]}>
            <boxGeometry args={[0.1, 12, 0.1]} />
            <meshStandardMaterial color="#cbd5e1" transparent opacity={0.2} />
        </mesh>
        <mesh position={[9, 2, -3]}>
            <boxGeometry args={[0.1, 12, 0.1]} />
            <meshStandardMaterial color="#cbd5e1" transparent opacity={0.2} />
        </mesh>

        <ContactShadows position={[0, -4, 0]} opacity={0.4} scale={30} blur={2.5} far={6} />
      </Canvas>
      
      {/* UI Overlay for Selection */}
      {selectedRoom && (
          <div className="absolute top-4 right-4 w-64 bg-white/90 backdrop-blur-xl p-6 rounded-3xl border border-slate-200 shadow-2xl animate-in slide-in-from-right duration-300">
              <div className="flex justify-between items-start mb-4">
                  <h3 className="font-black text-slate-900">{selectedRoom.name}</h3>
                  <button onClick={() => setSelectedRoom(null)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>
              <div className="space-y-4">
                  <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Status</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                          selectedRoom.incident ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
                      }`}>
                          {selectedRoom.incident ? 'Active Threat' : 'Secure'}
                      </span>
                  </div>
                  <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Temperature</span>
                      <span className={`text-sm font-black ${selectedRoom.currentTemp > 40 ? 'text-red-500' : 'text-slate-900'}`}>
                          {selectedRoom.currentTemp.toFixed(1)}°C
                      </span>
                  </div>
                  <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Occupancy</span>
                      <span className="text-xs font-bold text-slate-600">
                          {selectedRoom.guest_name || 'Vacant'}
                      </span>
                  </div>
              </div>
          </div>
      )}

      <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur p-4 rounded-2xl border border-slate-200 shadow-xl pointer-events-none">
        <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Tactical Mode</p>
        <p className="text-xs font-bold text-slate-600">Red: Fire/Heat | Blue: Staff/Occupied | Green: Safe Exit</p>
      </div>
    </div>
  );
};

export default ThreeMapView;
