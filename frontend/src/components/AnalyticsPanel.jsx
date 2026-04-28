import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const AnalyticsPanel = ({ incidents = [] }) => {
  const typeData = {
    fire: incidents.filter(i => i.type === 'fire').length,
    medical: incidents.filter(i => i.type === 'medical').length,
    security: incidents.filter(i => i.type === 'security').length,
  };

  const doughnutData = {
    labels: ['Fire', 'Medical', 'Security'],
    datasets: [
      {
        label: '# of Incidents',
        data: [typeData.fire, typeData.medical, typeData.security],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(30, 41, 59, 0.8)',
        ],
        borderColor: [
          'rgba(255, 255, 255, 0.2)',
          'rgba(255, 255, 255, 0.2)',
          'rgba(255, 255, 255, 0.2)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const lineData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Daily Incidents',
        data: [2, 5, 3, 8, 4, 6, 9], // Mock historical data
        fill: false,
        backgroundColor: 'rgba(59, 130, 246, 1)',
        borderColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#94a3b8', font: { size: 10 } }
      },
    },
    scales: {
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
      x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
    }
  };

  const barData = {
    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
    datasets: [
      {
        label: 'Peak Hours',
        data: [1, 0, 4, 9, 12, 5],
        backgroundColor: 'rgba(239, 68, 68, 0.6)',
        borderRadius: 8,
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatWidget label="Avg Response Time" value="3.8m" subValue="-12% vs avg" />
        <StatWidget label="Efficiency" value="94%" subValue="+5% this week" />
        <StatWidget label="Staff Utilization" value="82%" subValue="High Load" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass p-6 rounded-2xl">
          <h3 className="text-slate-400 text-xs font-bold uppercase mb-4 tracking-wider">Hourly Intensity</h3>
          <div className="h-48 flex items-center justify-center">
            <Bar data={barData} options={{ ...options, maintainAspectRatio: false }} />
          </div>
        </div>
        <div className="glass p-6 rounded-2xl">
          <h3 className="text-slate-400 text-xs font-bold uppercase mb-4 tracking-wider">Incident Mix</h3>
          <div className="h-48 flex items-center justify-center">
            <Doughnut data={doughnutData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
      </div>
    </div>
  );
};

const StatWidget = ({ label, value, subValue }) => (
  <div className="glass p-4 rounded-2xl">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <div className="flex items-baseline gap-2">
      <h4 className="text-xl font-black text-slate-900">{value}</h4>
      <span className="text-[10px] text-green-600 font-bold">{subValue}</span>
    </div>
  </div>
);

export default AnalyticsPanel;
