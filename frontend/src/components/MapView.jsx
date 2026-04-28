import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polygon } from 'react-leaflet';
import { mapService } from '../services/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const RecenterMap = ({ center }) => {
  const map = useMap();
  map.setView(center);
  return null;
};

const MapView = ({ incidents = [], staff = [], center = [13.111, 80.135], zoom = 18 }) => {

  const [mapData, setMapData] = useState({ rooms: [] });
  const [activeFloor, setActiveFloor] = useState(1);

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

  const getIcon = (type) => {
    let color = '#ef4444'; // default red
    if (type === 'medical') color = '#3b82f6';
    if (type === 'security') color = '#1e293b';
    if (type === 'staff') color = '#10b981'; // emerald green for staff
    
    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: ${color}; width: ${type === 'staff' ? '18px' : '14px'}; height: ${type === 'staff' ? '18px' : '14px'}; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 8px;">${type === 'staff' ? '👤' : ''}</div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
  };

  const visibleRooms = mapData.rooms.filter(room => 
    room.floor === 'all' || room.floor === activeFloor
  );

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 h-full min-h-[650px] bg-white">
      {/* High-Clarity Floor Selector */}
      <div className="absolute top-6 left-6 z-[1000] flex flex-col gap-3">
        <p className="text-[10px] font-black uppercase text-slate-400 mb-1 px-1">Floor Plan</p>
        {[5, 4, 3, 2, 1].map(f => (
          <button
            key={f}
            onClick={() => setActiveFloor(f)}
            className={`w-12 h-12 rounded-xl font-black text-sm transition-all shadow-lg flex items-center justify-center border-2
              ${activeFloor === f 
                ? 'bg-slate-900 text-white border-slate-900 scale-110' 
                : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300 hover:bg-slate-50'}`}
          >
            {f}F
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute top-6 right-6 z-[1000] bg-white/90 backdrop-blur p-4 rounded-2xl border border-slate-100 shadow-xl space-y-2">
        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2">Safety Legend</p>
        <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span className="text-[10px] font-bold text-slate-600">Fire Exit</span>
        </div>
        <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span className="text-[10px] font-bold text-slate-600">Staircase</span>
        </div>
        <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded bg-slate-500" />
            <span className="text-[10px] font-bold text-slate-600">Elevator</span>
        </div>
      </div>

      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%', background: '#f8fafc' }}
        zoomControl={false}
      >
        <RecenterMap center={center} />
        
        {/* Render Indoor Rooms */}
        {visibleRooms.map((room) => {
          const temp = room.temp || 22;
          const hue = Math.max(0, Math.min(240, 240 - ((temp - 20) * 6)));
          const color = `hsl(${hue}, 70%, 50%)`;

          // Color based on room type
          let fillColor = color;
          if (room.type === 'stairs') fillColor = '#3b82f6';
          if (room.type === 'lift') fillColor = '#64748b';
          if (room.type === 'fire_exit') fillColor = '#22c55e';
          if (room.type === 'corridor') fillColor = '#f1f5f9';
          if (room.guest_name) fillColor = '#ef4444';

          return (
            <Polygon 
              key={`${room.id}-${room.floor}`}
              positions={room.latlngs}
              pathOptions={{
                fillColor: fillColor, 
                fillOpacity: room.type === 'corridor' ? 0.3 : 0.7,
                color: '#fff',
                weight: 1.5,
                opacity: 1
              }}
            >
              <Popup>
                <div className="p-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Floor {room.floor}</p>
                  <h3 className="font-bold text-slate-900">{room.name}</h3>
                  {room.guest_name && (
                    <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-100">
                      <p className="text-[9px] font-black text-red-600 uppercase tracking-tight mb-0.5">Occupant</p>
                      <p className="text-sm font-black text-slate-900">{room.guest_name}</p>
                    </div>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-xs font-bold text-slate-600">Temp: {temp.toFixed(1)}°C</span>
                  </div>
                </div>
              </Popup>
            </Polygon>
          );
        })}

        {incidents.map((incident) => (
          <Marker 
            key={incident.id} 
            position={[incident.lat, incident.lng]}
            icon={getIcon(incident.type)}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold uppercase text-xs mb-1 text-red-600">{incident.type} INCIDENT</h3>
                <p className="text-sm font-medium">{incident.description}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {staff.map((member) => (
          <Marker 
            key={member.id} 
            position={[member.location_lat, member.location_lng]}
            icon={getIcon('staff')}
          >
            <Popup>
              <div className="p-2 text-center">
                <p className="text-[9px] font-black text-green-600 uppercase mb-1">Responder</p>
                <h3 className="font-bold text-xs">{member.username}</h3>
              </div>
            </Popup>
          </Marker>
        ))}

      </MapContainer>
    </div>
  );
};

export default MapView;
