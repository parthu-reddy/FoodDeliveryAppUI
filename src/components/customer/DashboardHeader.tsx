import React from 'react';
import { MapPin, ChevronRight, Clock, User, Sun, Moon } from 'lucide-react';
import LaBouffeLogo from '../shared/LaBouffeLogo';
import { useTheme } from '../../context/ThemeContext';

interface DashboardHeaderProps {
  address: string;
  view: 'home' | 'settings';
  setView: (view: 'home' | 'settings') => void;
  setIsAddressSelectorOpen: (isOpen: boolean) => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  address,
  view,
  setView,
  setIsAddressSelectorOpen
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 bg-white/20 dark:bg-white/5 backdrop-blur-xl px-5 py-3 flex items-center justify-between border-b border-rose-500/20 dark:border-rose-500/30 z-30 shrink-0 shadow-[0_2px_15px_rgba(0,0,0,0.01)] gap-3">
      <div className="flex items-center gap-2 sm:gap-3.5 flex-1 min-w-0">
        <LaBouffeLogo showText={false} iconSize="w-8 h-8 shrink-0" textColorClass="text-slate-800 dark:text-[#f0ede6] text-xs" subColorClass="text-rose-500 text-[8px]" />
        <div className="flex h-6 w-[1px] bg-slate-200 dark:bg-slate-800 shrink-0" />
        <button 
          onClick={() => {
            setIsAddressSelectorOpen(true);
          }}
          className="flex items-center gap-2 min-w-0 flex-1 hover:bg-slate-50 dark:hover:bg-slate-900/20 p-1.5 -ml-1.5 rounded-2xl transition-colors cursor-pointer text-left"
        >
          <div className="w-8 h-8 shrink-0 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
            <MapPin className="w-4 h-4 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-300 block truncate">Deliver to</span>
            <span className="text-xs font-bold truncate block w-full">{address}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-300 shrink-0" />
        </button>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => view === 'settings' ? setView('home') : setView('settings')}
          className={`p-2.5 rounded-xl transition-all cursor-pointer ${
            view === 'settings' 
              ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shadow-sm shadow-indigo-500/10' 
              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-500 dark:text-[#f0ede6]'
          }`}
          title="Profile Settings"
        >
          <User className="w-4 h-4 text-indigo-500" />
        </button>
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-500 dark:text-[#f0ede6] transition-all cursor-pointer"
          title="Toggle Light/Dark Mode"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
        </button>
      </div>
    </header>
  );
};
