import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    // Mock login delay
    setTimeout(() => {
      setLoading(false);
      navigate('/dashboard');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-red-600/20">
            <Shield size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">CRISIS-HUB</h1>
          <p className="text-slate-500 font-medium">Administration Login</p>
        </div>

        <form onSubmit={handleLogin} className="glass p-8 rounded-3xl space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Username</label>
            <input 
              type="text" 
              defaultValue="admin"
              className="w-full bg-slate-900 border border-white/5 rounded-2xl px-5 py-4 text-white outline-none focus:border-red-500/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Password</label>
            <input 
              type="password" 
              defaultValue="password"
              className="w-full bg-slate-900 border border-white/5 rounded-2xl px-5 py-4 text-white outline-none focus:border-red-500/50 transition-all"
            />
          </div>
          
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-900 text-white font-bold py-4 rounded-2xl shadow-lg shadow-red-600/20 transition-all flex items-center justify-center"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-8 text-center text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em]">
          Authorized Personnel Only
        </p>
      </div>
    </div>
  );
};

export default Login;
