import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text, ContactShadows, Float } from '@react-three/drei';
import * as THREE from 'three';

const Room = ({ position, size, name, type, temp, guestName, isActiveFloor, incident }) => {
  const mesh = useRef();
  
  const color = useMemo(() => {
    if (incident) return '#ef4444'; // Red for incident
    if (guestName) return '#3b82f6'; // Blue for occupied
    if (type === 'stairs') return '#3b82f6';
    if (type === 'lift') return '#64748b';
    if (type === 'fire_exit') return '#22c55e';
    if (type === 'corridor') return '#cbd5e1';
    
    // Thermal gradient for rooms
    const hue = Math.max(0, Math.min(240, 240 - ((temp - 20) * 6)));
    return `hsl(${hue}, 70%, 50%)`;
  }, [type, guestName, temp, incident]);

  useFrame((state) => {
    if (incident && mesh.current) {
      mesh.current.material.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 5) * 0.5;
    }
  });

  return (
    <group position={position}>
      <mesh ref={mesh}>
        <boxGeometry args={[size[0], size[1], size[2]]} />
        <meshStandardMaterial 
          color={color} 
          transparent 
          opacity={isActiveFloor ? 0.6 : 0.1} 
          emissive={guestName ? '#ef4444' : color}
          emissiveIntensity={guestName ? 0.5 : 0.1}
        />
      </mesh>
      {isActiveFloor && (
        <Text
          position={[0, size[1]/2 + 0.1, 0]}
          fontSize={0.2}
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

const BuildingFloor = ({ floor, rooms, activeFloor, incidents = [] }) => {
  const isActiveFloor = floor === activeFloor;
  const yPos = (floor - 1) * 2; // 2 units vertical space per floor

  return (
    <group position={[0, yPos, 0]}>
      {/* Floor Plate */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2, -0.05, 0]}>
        <planeGeometry args={[12, 6]} />
        <meshStandardMaterial color="#f8fafc" transparent opacity={isActiveFloor ? 0.3 : 0.05} />
      </mesh>

      {/* Render Rooms for this floor */}
      {rooms.filter(r => r.floor === floor || r.floor === 'all').map((room, idx) => {
        // Map lat/lng to 3D space
        // Center of map is approx 13.111, 80.135
        const x = (room.latlngs[0][0][1] - 80.135) * 50000;
        const z = (room.latlngs[0][0][0] - 13.111) * 50000;
        
        const incident = incidents.find(inc => String(inc.room_name).includes(room.name));

        return (
          <Room 
            key={room.id}
            position={[x, 0.25, z]}
            size={[0.8, 0.5, 0.8]}
            name={room.name}
            type={room.type}
            temp={room.temp}
            guestName={room.guest_name}
            isActiveFloor={isActiveFloor}
            incident={incident}
          />
        );
      })}
    </group>
  );
};

const ThreeMapView = ({ mapData, activeFloor, incidents, staff }) => {
  if (!mapData || !mapData.rooms) return null;

  return (
    <div style={{ width: '100%', height: '600px', background: '#f1f5f9' }}>
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[10, 10, 10]} fov={50} />
        <OrbitControls enableDamping dampingFactor={0.05} />
        
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} castShadow />
        <spotLight position={[-10, 20, 10]} angle={0.15} penumbra={1} intensity={1} />

        <group position={[0, -2, 0]}>
            {[1, 2, 3, 4, 5].map(f => (
                <BuildingFloor 
                    key={f} 
                    floor={f} 
                    rooms={mapData.rooms} 
                    activeFloor={activeFloor} 
                    incidents={incidents}
                />
            ))}
        </group>

        {/* Pillars */}
        <mesh position={[-4, 2, -3]}>
            <boxGeometry args={[0.05, 10, 0.05]} />
            <meshStandardMaterial color="#cbd5e1" transparent opacity={0.3} />
        </mesh>
        <mesh position={[8, 2, -3]}>
            <boxGeometry args={[0.05, 10, 0.05]} />
            <meshStandardMaterial color="#cbd5e1" transparent opacity={0.3} />
        </mesh>

        <ContactShadows position={[0, -4, 0]} opacity={0.4} scale={20} blur={2} far={4.5} />
      </Canvas>
      
      <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur p-4 rounded-2xl border border-slate-200 shadow-xl pointer-events-none">
        <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Navigation Tip</p>
        <p className="text-xs font-bold text-slate-600">Left Click: Rotate | Right Click: Pan | Scroll: Zoom</p>
      </div>
    </div>
  );
};

export default ThreeMapView;
