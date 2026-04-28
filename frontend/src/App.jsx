import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import GuestPage from './pages/GuestPage';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import { WifiOff } from 'lucide-react';

function App() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans antialiased">
        {isOffline && (
          <div className="bg-red-600 text-white text-[10px] font-black uppercase py-1 text-center flex items-center justify-center gap-2 sticky top-0 z-[100]">
            <WifiOff size={12} />
            Operating in Offline Mode - Emergency reports will be queued
          </div>
        )}
        <Routes>
          <Route path="/" element={<GuestPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
