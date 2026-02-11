
import React from 'react';
import { Stats } from '../types';

interface StatsDashboardProps {
  stats: Stats;
  labels: {
    total: string;
    unique: string;
    frequent: string;
  };
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ stats, labels }) => {
  return (
    <div className="grid grid-cols-3 gap-2 w-full max-w-md mt-6 px-2">
      <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-3 flex flex-col items-center justify-center">
        <span className="text-white/40 text-[10px] uppercase tracking-tighter font-bold">{labels.total}</span>
        <span className="text-white text-xl font-bold">{stats.totalGenerated}</span>
      </div>
      
      <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-3 flex flex-col items-center justify-center">
        <span className="text-white/40 text-[10px] uppercase tracking-tighter font-bold">{labels.unique}</span>
        <span className="text-white text-xl font-bold">{stats.uniqueCount}</span>
      </div>

      <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-3 flex flex-col items-center justify-center overflow-hidden">
        <span className="text-white/40 text-[10px] uppercase tracking-tighter font-bold">{labels.frequent}</span>
        <span className="text-white text-xs font-bold truncate w-full text-center">
          {Object.entries(stats.wordFrequency).sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0] || '---'}
        </span>
      </div>
    </div>
  );
};
