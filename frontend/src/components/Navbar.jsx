import React from 'react';
import { Shield, Bell, User } from 'lucide-react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <Shield className="text-red-500" size={24} />
        <span className="font-bold text-lg tracking-tight text-slate-900">CrisisCoord</span>
      </div>
      
      <div className="hidden md:flex items-center gap-6">
        <Link to="/" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Guest SOS</Link>
        <Link to="/dashboard" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Admin Dashboard</Link>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
          <Bell size={20} />
        </button>
        <div className="w-8 h-8 bg-slate-100 rounded-full border border-slate-200 flex items-center justify-center">
          <User size={16} className="text-slate-400" />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
