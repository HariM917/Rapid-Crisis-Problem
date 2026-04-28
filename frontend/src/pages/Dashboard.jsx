import React, { useState, useEffect } from 'react';
import { incidentService, guestService, userService, mapService } from '../services/api';
import { useRealtime } from '../hooks/useRealtime';
import FloorPlan from '../components/FloorPlan';
import AnalyticsPanel from '../components/AnalyticsPanel';
import IoTSensorPanel from '../components/IoTSensorPanel';
import axios from 'axios';
import { 
  Bell, 
  Search, 
  Map as MapIcon, 
  BarChart3, 
  AlertCircle, 
  Clock, 
  User,
  Settings,
  MoreVertical,
  Filter,
  MapPin,
  CheckCircle,
  Users,
  Trash2,
  Plus,
  Flame,
  Thermometer,
  Wind,
  Info,
  LayoutDashboard,
  MessageSquare,
  LogOut,
  ChevronDown,
  Activity,
  AlertTriangle,
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Notification from '../components/Notification';

const SensorCard = ({ label, value, icon, status }) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
    <div className="flex items-center justify-between mb-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner ${
        status === 'danger' ? 'bg-red-50 text-red-500' : 
        status === 'warning' ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'
      }`}>
        {icon}
      </div>
      <div className={`w-2 h-2 rounded-full animate-pulse ${status === 'safe' ? 'bg-emerald-500' : 'bg-red-500'}`} />
    </div>
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    <p className="text-xl font-black text-slate-900">{value}</p>
  </div>
);

const StatCard = ({ label, value, trend, color, trendColor = 'text-slate-400' }) => {
  const colors = {
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    emerald: 'bg-emerald-500',
    orange: 'bg-orange-500'
  };
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <div className="flex items-center justify-between">
        <p className="text-2xl font-black text-slate-900">{value}</p>
        <span className={`text-[10px] font-bold ${trendColor}`}>{trend}</span>
      </div>
      <div className="mt-4 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${colors[color] || 'bg-slate-400'}`} style={{ width: '0%' }} />
      </div>
    </div>
  );
};

const IncidentTimeline = ({ events }) => {
  if (!events) return null;
  const parsedEvents = typeof events === 'string' ? JSON.parse(events) : events;
  
  return (
    <div className="mt-4 space-y-3 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
      {parsedEvents.map((event, idx) => (
        <div key={idx} className="flex gap-4 relative pl-8">
          <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${
            event.status === 'critical' ? 'bg-red-500' : 
            event.status === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
          }`}>
            {event.status === 'critical' ? <Flame size={10} className="text-white" /> : <Activity size={10} className="text-white" />}
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-900 leading-none">{event.event}</p>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">{event.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

const Dashboard = () => {
  const [incidents, setIncidents] = useState([]);
  const [staff, setStaff] = useState([]);
  const [activeTab, setActiveTab] = useState(localStorage.getItem('activeTab') || 'overview');
  const [viewMode, setViewMode] = useState('floor'); // floor, map, 3d
  const [userRole, setUserRole] = useState('admin'); // admin, staff
  const [notification, setNotification] = useState(null);
  const [realGuests, setRealGuests] = useState([]);
  const [iotData, setIotData] = useState({});
  const [mapData, setMapData] = useState({ rooms: [] });
  const [simRunning, setSimRunning] = useState(false);

  const lastEvent = useRealtime();

  useEffect(() => {
    fetchIncidents();
    fetchStaff();
    fetchGuests();
    fetchMapData();
  }, []);

  useEffect(() => {
    if (lastEvent) {
      handleRealtimeEvent(lastEvent);
    }
  }, [lastEvent]);

  const fetchMapData = async () => {
    try {
      const response = await mapService.getData();
      setMapData(response.data);
    } catch (error) {
      console.error("Failed to fetch map data", error);
    }
  };

  const handleRealtimeEvent = (event) => {
    if (event.event === 'iot_update') {
      setIotData(prev => ({ ...prev, ...event.data.room_temps }));
    } else if (event.event === 'staff_movement') {
      setStaff(prev => prev.map(s => 
        s.id === event.data.id ? { ...s, location_lat: event.data.lat, location_lng: event.data.lng, location_floor: event.data.floor } : s
      ));
    } else if (event.event === 'incident_created') {
      fetchIncidents();
    } else if (event.event === 'incident_updated') {
      setIncidents(prev => prev.map(inc => 
        inc.id === event.data.id ? { ...inc, ...event.data } : inc
      ));
    }
  };

  const fetchGuests = async () => {
    try {
      const response = await guestService.getAll();
      // Map backend GuestRegistration to FloorPlan format
      const mapped = response.data.map(g => ({
        room: g.room_number.toString(),
        name: g.guest_name,
        created_at: g.created_at
      }));
      setRealGuests(mapped);
    } catch (error) {
      console.error("Failed to fetch guests", error);
    }
  };

  const fetchIncidents = async () => {
    try {
      const response = await incidentService.getAll();
      setIncidents(response.data);
    } catch (error) {
      console.error("Failed to fetch incidents", error);
    }
  };

  const fetchStaff = async () => {
    try {
      console.log("Attempting to fetch staff data...");
      const response = await userService.getStaff();
      console.log("Staff API response:", response.data);
      setStaff(response.data);
    } catch (error) {
      console.error("Failed to fetch staff", error);
    }
  };

  const handleRegisterStaff = async (staffData) => {
    try {
      setLoading(true);
      await userService.register(staffData);
      setNotification({
        type: 'success',
        message: 'New responder registered successfully!'
      });
      fetchStaff();
    } catch (error) {
      console.error("Failed to register staff", error);
      setNotification({
        type: 'error',
        message: 'Registration failed.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLocateStaff = (member) => {
    setActiveTab('overview');
    setNotification({
      type: 'info',
      message: `Locating ${member.username} on tactical map...`
    });
  };

  const toggleSimulation = async () => {
    try {
      const endpoint = simRunning ? '/simulation/stop' : '/simulation/start';
      await axios.get(`http://localhost:8000${endpoint}`);
      setSimRunning(!simRunning);
    } catch (error) {
      console.error("Sim failed", error);
    }
  };

  const purgeIncidents = async () => {
    try {
      await axios.delete('http://localhost:8000/incident/purge');
      fetchIncidents();
      setNotification({ message: "System purged. All dummies cleared.", type: "success" });
    } catch (error) {
      console.error("Purge failed", error);
    }
  };

  const simulateManual = async (type) => {
    try {
      const randomRoom = Math.floor(Math.random() * 12) + 101;
      await axios.post('http://localhost:8000/incident/create', {
        type,
        description: `MANUAL SIMULATION: ${type.toUpperCase()} triggered by supervisor.`,
        lat: 13.111,
        lng: 80.135,
        room: randomRoom.toString()
      });
      fetchIncidents();
    } catch (error) {
      console.error("Manual sim failed", error);
    }
  };

  const resolveIncident = async (id) => {
    try {
      await incidentService.update(id, { status: 'resolved' });
      setIncidents(prev => prev.map(inc => 
        inc.id === id ? { ...inc, status: 'resolved' } : inc
      ));
      setNotification({
        message: `Incident #${id} has been resolved.`,
        type: 'success'
      });
    } catch (error) {
      console.error("Failed to resolve incident", error);
      setNotification({
        message: "Failed to resolve incident.",
        type: 'error'
      });
    }
  };

  const activeIncidents = incidents.filter(i => i.status === 'active');

  return (
    <div className="flex h-screen bg-slate-100 text-slate-900 overflow-hidden font-sans">
      <AnimatePresence>
        {notification && (
          <Notification 
            message={notification.message} 
            type={notification.type} 
            onClose={() => setNotification(null)} 
          />
        )}
      </AnimatePresence>

      {/* Sidebar (Light Theme Clear UI) */}
      <aside className="w-64 bg-white border-r border-slate-100 text-slate-500 flex flex-col p-8 space-y-8 z-20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-200">
             <Flame size={20} className="text-white" />
          </div>
          <h1 className="font-black text-lg tracking-tighter text-slate-900">CRISIS-HUB</h1>
        </div>

        <nav className="space-y-1">
          <SidebarLink 
            icon={<BarChart3 size={18}/>} 
            label="Overview" 
            active={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')}
          />
          <SidebarLink 
            icon={<AlertCircle size={18}/>} 
            label="Active Alerts" 
            active={activeTab === 'alerts'} 
            onClick={() => setActiveTab('alerts')}
            count={activeIncidents.length}
          />
          <SidebarLink 
            icon={<Users size={18}/>} 
            label="Guest Registry" 
            active={activeTab === 'guests'} 
            onClick={() => setActiveTab('guests')}
          />
          <SidebarLink 
            icon={<Users size={18}/>} 
            label="Staff" 
            active={activeTab === 'staff'} 
            onClick={() => setActiveTab('staff')}
          />
          <SidebarLink 
            icon={<Settings size={18}/>} 
            label="Settings" 
            active={false} 
          />
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm text-slate-400">
              <User size={20} />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">Admin User</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manager</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search incidents, staff, or locations..." 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 ring-blue-500/20"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              {/* Simulation controls removed per user request */}
            </div>
            <div className="w-px h-6 bg-slate-200" />
            <div className="relative">
              <Bell size={20} className="text-slate-600" />
              {activeIncidents.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {activeIncidents.length}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-10"
              >
                {/* Dashboard Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Incidents</p>
                    <div className="flex items-center justify-between">
                        <p className="text-2xl font-black text-slate-900">{activeIncidents.length}</p>
                        <span className="text-[10px] font-bold text-slate-400">Live Counter</span>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Response Time</p>
                    <div className="flex items-center justify-between">
                        <p className="text-2xl font-black text-slate-900">0.0m</p>
                        <span className="text-[10px] font-bold text-slate-400">System Ready</span>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Staff Online</p>
                    <div className="flex items-center justify-between">
                        <p className="text-2xl font-black text-slate-900">{staff.length}</p>
                        <span className="text-[10px] font-bold text-slate-400">Tactical Staff</span>
                    </div>
                  </div>
                </div>

                {/* Real-time Tactical View */}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white p-1 rounded-[2.5rem] border border-slate-100 shadow-2xl h-[600px] overflow-hidden relative group">
                      {/* Tactical View Controls */}
                      <div className="absolute top-6 left-6 z-10 flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-md rounded-xl border border-slate-100 shadow-sm">
                           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                           <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Tactical Feed Active</span>
                        </div>
                        
                        <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                          {['floor', 'map', '3d'].map(mode => (
                            <button
                              key={mode}
                              onClick={() => setViewMode(mode)}
                              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                viewMode === mode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                              }`}
                            >
                              {mode === 'floor' ? 'Floor' : mode === 'map' ? 'Map' : '3D Twin'}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="absolute top-6 right-6 z-10">
                         <div className="flex p-1 bg-red-50 rounded-xl border border-red-100">
                            {['admin', 'staff'].map(role => (
                              <button
                                key={role}
                                onClick={() => setUserRole(role)}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                  userRole === role ? 'bg-red-600 text-white shadow-lg shadow-red-200' : 'text-red-400 hover:text-red-600'
                                }`}
                              >
                                {role} View
                              </button>
                            ))}
                         </div>
                      </div>

                      <div className="w-full h-full">
                        {viewMode === 'floor' && <FloorPlan guests={realGuests} activeIncidents={activeIncidents} staff={staff} />}
                        {viewMode === 'map' && <MapView incidents={activeIncidents} staff={staff} />}
                        {viewMode === '3d' && (
                          <div className="w-full h-full">
                            <ThreeMapView 
                              mapData={mapData} 
                              incidents={activeIncidents} 
                              staff={staff} 
                              iotData={iotData}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <StatCard label="Live Map Coverage" value="100%" trend="Indoor/Outdoor" color="blue" />
                       <StatCard label="Safety Rating" value="A+" trend="Secure Mode" color="emerald" trendColor="text-emerald-500" />
                       <StatCard label="System Integrity" value="Stable" trend="Cloud Sync Active" color="orange" />
                    </div>
                  </div>

                  <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-lg font-black text-slate-800">Operational Feed</h2>
                        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                           <Clock size={14} className="text-slate-400" />
                           <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Real-time</span>
                        </div>
                    </div>
                    <div className="flex-1 space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                      {activeIncidents.length > 0 ? (
                        activeIncidents.map(incident => (
                          <div key={incident.id} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                            <div className={`absolute top-0 left-0 w-1.5 h-full ${incident.type === 'fire' ? 'bg-red-500' : 'bg-blue-500'}`} />
                            
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex gap-2">
                                    <span className="px-2 py-1 bg-slate-900 text-white text-[8px] font-black uppercase rounded-md">{incident.type}</span>
                                    <span className={`px-2 py-1 text-[8px] font-black uppercase rounded-md ${
                                      incident.priority === 'critical' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                                    }`}>{incident.priority}</span>
                                </div>
                                <span className="text-[9px] font-bold text-slate-400">{new Date(incident.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>

                            <div className="flex items-center gap-2 text-red-500 text-[10px] font-black uppercase mb-3">
                                <MapPin size={14} />
                                {incident.room_name || incident.room || 'Main Hall'}
                            </div>

                            <h4 className="text-sm font-black text-slate-800 mb-4 leading-tight">{incident.description}</h4>
                            
                            <div className={`bg-slate-50 rounded-2xl p-4 mb-4 border ${incident.type === 'fire' ? 'border-red-100' : 'border-blue-100'}`}>
                                <p className={`text-[9px] font-black uppercase mb-2 flex items-center gap-2 ${incident.type === 'fire' ? 'text-red-600' : 'text-blue-600'}`}>
                                    <Shield size={12} />
                                    {userRole === 'admin' ? 'Strategic Protocol' : 'YOUR ASSIGNED TASKS'}
                                </p>
                                <p className="text-[11px] text-slate-900 font-bold leading-relaxed whitespace-pre-line">
                                  {userRole === 'admin' ? 
                                    (incident.response_steps || "Standard security protocol initiated.") : 
                                    (incident.staff_steps || incident.response_steps || "Proceed to location and await orders.")
                                  }
                                </p>
                            </div>

                            {/* Timeline Component */}
                            <IncidentTimeline events={incident.timeline} />

                             <div className="flex gap-2 mt-6">
                                <button className="flex-1 py-3 bg-slate-900 text-white text-[10px] font-black uppercase rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">
                                  {userRole === 'admin' ? 'Dispatch Support' : 'Acknowledge Task'}
                                </button>
                                <button 
                                    onClick={() => resolveIncident(incident.id)}
                                    className="px-4 py-3 bg-white text-emerald-600 text-[10px] font-black uppercase rounded-xl border border-emerald-100 hover:bg-emerald-50 transition-colors"
                                >
                                    Resolve
                                </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="bg-white rounded-[2.5rem] p-20 border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center opacity-50">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <Info size={32} className="text-slate-300" />
                            </div>
                            <h3 className="font-black text-slate-400 text-sm">NO ACTIVE THREATS</h3>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'alerts' && (
              <motion.div 
                key="alerts"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-black text-slate-900">Incident Management</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {activeIncidents.length > 0 ? activeIncidents.map(incident => (
                    <IncidentItem 
                      key={incident.id} 
                      incident={incident} 
                      onResolve={() => resolveIncident(incident.id)}
                    />
                  )) : (
                    <div className="col-span-full py-20 bg-white rounded-[40px] text-center border-2 border-dashed border-slate-100 opacity-50">
                       <p className="text-slate-400 font-bold uppercase tracking-widest">No active alerts requiring attention</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'guests' && <GuestRegistryView />}
            {activeTab === 'staff' && (
              <StaffManagementView 
                staff={staff} 
                onRefresh={fetchStaff} 
                onLocate={handleLocateStaff}
                onRegister={handleRegisterStaff}
                loading={loading}
              />
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};


const IncidentItem = ({ incident, onResolve }) => {
  const typeColors = {
    fire: "bg-red-500",
    medical: "bg-blue-500",
    security: "bg-slate-700",
    emergency: "bg-red-600"
  };

  const priorityColors = {
    critical: "text-red-600 bg-red-50 border-red-200",
    high: "text-orange-600 bg-orange-50 border-orange-200",
    medium: "text-blue-600 bg-blue-50 border-blue-200",
    low: "text-slate-600 bg-slate-50 border-slate-200"
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass p-5 rounded-2xl border-l-4 border-red-500 space-y-4"
    >
      <div className="flex justify-between items-start">
        <div className="flex gap-2">
          <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase text-white ${typeColors[incident.type] || typeColors.emergency}`}>
            {incident.type}
          </div>
          <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${priorityColors[incident.priority] || priorityColors.high}`}>
            {incident.priority}
          </div>
          {incident.assigned_staff_id && (
            <div className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-green-100 text-green-600 border border-green-200 animate-pulse">
              Dispatched
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 text-slate-400 text-[10px] font-black uppercase tracking-widest">
          <Clock size={10} />
          {(() => {
            const diff = (new Date() - new Date(incident.created_at)) / 1000;
            if (diff < 60) return <span className="text-red-500 animate-pulse">Just Now</span>;
            return new Date(incident.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          })()}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <MapPin size={12} className="text-red-500" />
        <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">Location: {incident.room_name || incident.room || 'Internal Room'}</span>
      </div>

      <div>
        <p className="text-sm font-bold text-slate-900 mb-1">{incident.description}</p>
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <User size={10} />
          {incident.assigned_staff_id ? (
            <span className="text-green-600 font-black">
              DISPATCHED: {incident.assigned_staff_name?.toUpperCase()} ({incident.assigned_staff_role})
            </span>
          ) : (
            <span className="italic">Awaiting Auto-Dispatch...</span>
          )}
        </div>

      </div>

      {incident.response_steps && (
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
            <CheckCircle size={10} className="text-blue-500" />
            AI Suggested Steps
          </p>
          <p className="text-[10px] text-slate-600 leading-relaxed font-medium">
            {incident.response_steps}
          </p>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button 
          className="flex-1 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase transition-all hover:bg-slate-800"
        >
          Assign More Staff
        </button>
        {(() => {
          const type = (incident.type || '').toLowerCase();
          const desc = (incident.description || '').toLowerCase();
          
          if (type.includes('fire') || desc.includes('fire')) {
            return (
              <button 
                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-[10px] font-black uppercase transition-all hover:bg-red-700 animate-pulse flex items-center justify-center gap-2"
                onClick={() => window.open('tel:101')}
              >
                Call 101
              </button>
            );
          }
          if (type.includes('medical') || desc.includes('medical') || type.includes('health')) {
            return (
              <button 
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase transition-all hover:bg-blue-700 animate-pulse flex items-center justify-center gap-2"
                onClick={() => window.open('tel:108')}
              >
                Call 108
              </button>
            );
          }
          if (type.includes('security') || desc.includes('security') || type.includes('threat')) {
            return (
              <button 
                className="flex-1 py-2 bg-slate-700 text-white rounded-lg text-[10px] font-black uppercase transition-all hover:bg-slate-800 animate-pulse flex items-center justify-center gap-2"
                onClick={() => window.open('tel:100')}
              >
                Call 100
              </button>
            );
          }
          return null;
        })()}
        <button 
          onClick={onResolve}
          className="px-4 py-2 bg-green-100 text-green-600 hover:bg-green-600 hover:text-white rounded-lg text-[10px] font-black uppercase transition-all"
        >
          Resolve
        </button>
      </div>
    </motion.div>
  );
};

const SidebarLink = ({ icon, label, active, onClick, count }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
      active ? 'bg-red-600 text-white shadow-lg shadow-red-200' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
    }`}
  >
    <div className="flex items-center gap-3">
      {icon}
      <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
    </div>
    {count > 0 && (
      <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded">
        {count}
      </span>
    )}
  </button>
);


const GuestRegistryView = () => {
  const [guests, setGuests] = useState([]);
  const [newGuest, setNewGuest] = useState({ phone_number: '', room_number: '', guest_name: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchGuests();
  }, []);

  const fetchGuests = async () => {
    try {
      const response = await guestService.getAll();
      setGuests(response.data);
    } catch (error) {
      console.error("Failed to fetch guests", error);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Backend validation relaxed to handle flexible number formats
    try {
      await guestService.register(newGuest);
      setNewGuest({ phone_number: '', room_number: '', guest_name: '' });
      fetchGuests();
      alert("Guest registered successfully and persisted to database.");
    } catch (error) {
      console.error("Failed to register guest", error);
      alert("Failed to register guest. Please check the phone format.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await guestService.delete(id);
      fetchGuests();
    } catch (error) {
      console.error("Failed to delete guest", error);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Registration Form */}
        <div className="lg:col-span-1">
          <div className="glass p-8 rounded-3xl space-y-6">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Register New Guest
            </h2>
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Phone Number</label>
                <input 
                  type="text" 
                  placeholder="Enter phone number" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 ring-red-500/20 outline-none transition-all"
                  value={newGuest.phone_number}
                  onChange={(e) => setNewGuest({...newGuest, phone_number: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Room Number</label>
                <input 
                  type="text" 
                  placeholder="Enter room number" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 ring-red-500/20 outline-none transition-all"
                  value={newGuest.room_number}
                  onChange={(e) => setNewGuest({...newGuest, room_number: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Guest Name (Optional)</label>
                <input 
                  type="text" 
                  placeholder="Enter guest name" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 ring-red-500/20 outline-none transition-all"
                  value={newGuest.guest_name}
                  onChange={(e) => setNewGuest({...newGuest, guest_name: e.target.value})}
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
              >
                {loading ? 'Processing...' : 'Register Guest'}
              </button>
            </form>
          </div>
        </div>

        {/* Guest List */}
        <div className="lg:col-span-2">
          <div className="glass rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-white/50 flex justify-between items-center">
              <h2 className="font-bold text-lg">Active Guest Registry</h2>
              <span className="text-[10px] font-black bg-slate-100 px-3 py-1 rounded-full uppercase text-slate-500">
                {guests.length} Registered
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Guest / Phone</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Room No.</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Check-In Date</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Status / Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {guests.length > 0 ? guests.map(guest => (
                    <tr key={guest.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="text-sm font-bold">{guest.guest_name || 'Anonymous Guest'}</p>
                            <p className="text-[11px] text-slate-500 font-medium">{guest.phone_number}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-black uppercase tracking-wider">
                          ROOM {guest.room_number}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[11px] text-slate-500 font-medium">
                        {new Date(guest.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <span className="text-[9px] font-black text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100 uppercase">Checked In</span>
                           <button 
                            onClick={() => handleDelete(guest.id)}
                            className="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg text-[9px] font-black uppercase transition-all"
                          >
                            Check Out
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-slate-400 italic text-sm">
                        No guests registered in the system.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StaffManagementView = ({ staff, onRefresh, onLocate, onRegister, loading }) => {
  const [newStaff, setNewStaff] = useState({ username: '', role: 'security', skills: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    onRegister(newStaff);
    setNewStaff({ username: '', role: 'security', skills: '' });
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Registration Form */}
        <div className="lg:col-span-1">
          <div className="glass p-8 rounded-3xl space-y-6">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Register Responder
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Username</label>
                <input 
                  type="text" 
                  placeholder="Enter username" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 ring-red-500/20 outline-none transition-all"
                  value={newStaff.username}
                  onChange={(e) => setNewStaff({...newStaff, username: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Primary Role</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 ring-red-500/20 outline-none transition-all"
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({...newStaff, role: e.target.value})}
                >
                  <option value="security">Security</option>
                  <option value="paramedic">Paramedic</option>
                  <option value="firefighter">Firefighter</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Skill Tags</label>
                <input 
                  type="text" 
                  placeholder="e.g. CPR, First Aid" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 ring-red-500/20 outline-none transition-all"
                  value={newStaff.skills}
                  onChange={(e) => setNewStaff({...newStaff, skills: e.target.value})}
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
              >
                {loading ? 'Processing...' : 'Register Staff'}
              </button>
            </form>
          </div>
        </div>

        {/* Staff Table */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Active Responders</h2>
            <button 
              onClick={onRefresh}
              className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
            >
              Refresh Status
            </button>
          </div>

          <div className="glass rounded-[32px] overflow-hidden border border-slate-100 shadow-xl shadow-slate-200/50">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Name / Role</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Specialized Skills</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {staff.length > 0 ? staff.map(member => (
                  <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{member.username}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{member.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {member.skills?.split(',').map(skill => (
                          <span key={skill} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-black uppercase rounded">
                            {skill.trim()}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-black uppercase ${
                        member.is_available ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${member.is_available ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                        {member.is_available ? 'Available' : 'On Mission'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => onLocate(member)}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-red-600 transition-all group"
                        title="Locate on Map"
                      >
                        <MapPin size={18} className="group-hover:scale-110 transition-transform" />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-slate-400 italic text-sm">
                      No staff members currently active.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
