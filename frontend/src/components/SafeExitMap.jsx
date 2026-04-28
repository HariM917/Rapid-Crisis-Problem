import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, Circle } from 'react-leaflet';
import { mapService } from '../services/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const exitIcon = L.divIcon({
  className: 'exit-icon',
  html: '<div style="background-color: #10b981; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px rgba(16,185,129,0.6);"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const userIcon = L.divIcon({
  className: 'user-icon',
  html: '<div style="background-color: #3b82f6; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(59,130,246,0.5);"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

const SafeExitMap = ({ userLocation = [22.2084, 114.0315], exitLocation = [22.2089, 114.0320] }) => {
  const [mapData, setMapData] = useState({ rooms: [] });

  useEffect(() => {
    const fetchMapData = async () => {
      try {
        const response = await mapService.getData();
        setMapData(response.data);
      } catch (error) {
        console.error("Failed to fetch map data", error);
      }
    };
    fetchMapData();
  }, []);

  const path = [userLocation, exitLocation];

  return (
    <div className="w-full h-full rounded-3xl overflow-hidden shadow-2xl border border-white/10">
      <MapContainer center={userLocation} zoom={19} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        
        {/* Render Indoor Rooms */}
        {mapData.rooms.map((room) => (
          <Polygon 
            key={room.id}
            positions={room.latlngs}
            pathOptions={{
              fillColor: '#94a3b8',
              fillOpacity: 0.05,
              color: '#94a3b8',
              weight: 1,
              opacity: 0.2
            }}
          />
        ))}
        {/* Render Blocked Zones */}
        {(mapData.blocked_zones || []).map((block) => (
          <Circle 
            key={block.id}
            center={block.center}
            radius={block.radius}
            pathOptions={{ fillColor: '#ef4444', color: '#ef4444', fillOpacity: 0.3 }}
          >
            <Popup>DANGER: AREA BLOCKED</Popup>
          </Circle>
        ))}

        {/* Render Intelligent Safe Paths */}
        {(mapData.safe_paths || []).map((p, idx) => (
          <Polyline 
            key={idx}
            positions={p}
            pathOptions={{ color: '#10b981', weight: 6, opacity: 0.8 }}
          />
        ))}

        <Marker position={userLocation} icon={userIcon}>
          <Popup>Your Location</Popup>
        </Marker>
        <Marker position={exitLocation} icon={exitIcon}>
          <Popup>Emergency Exit</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default SafeExitMap;
