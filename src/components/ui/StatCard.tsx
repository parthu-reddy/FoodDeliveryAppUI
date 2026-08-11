import React from 'react';

type StatColor = 'emerald' | 'blue' | 'rose' | 'amber' | 'indigo';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: StatColor;
  className?: string;
}

const iconBgColors: Record<StatColor, string> = {
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
};

export function StatCard({ icon, label, value, color = 'emerald', className = '' }: StatCardProps) {
  return (
    <div
      className={`bg-white/50 dark:bg-slate-900/40 backdrop-blur-md border border-rose-500/20 dark:border-rose-500/30 rounded-2xl p-4 flex items-center gap-3 shadow-sm ${className}`}
    >
      <div className={`p-3 rounded-xl ${iconBgColors[color]}`}>
        {icon}
      </div>
      <div>
        <span className="text-[10px] text-slate-500 dark:text-[#f0ede6] uppercase font-mono block">
          {label}
        </span>
        <span className="text-base font-black text-slate-800 dark:text-[#f0ede6]">
          {value}
        </span>
      </div>
    </div>
  );
}
