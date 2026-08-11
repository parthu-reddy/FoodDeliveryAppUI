import React from 'react';

interface SidebarNavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  /** Optional badge count shown on the right */
  badge?: number;
}

interface SidebarNavProps {
  items: SidebarNavItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  /** Color used for the active tab highlight */
  activeColor?: 'indigo' | 'rose' | 'emerald' | 'amber';
  className?: string;
}

const activeColorStyles: Record<string, string> = {
  indigo: 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30',
  rose: 'bg-rose-500 text-white shadow-lg shadow-rose-500/30',
  emerald: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30',
  amber: 'bg-amber-500 text-white shadow-lg shadow-amber-500/30',
};

export function SidebarNav({
  items,
  activeKey,
  onSelect,
  activeColor = 'indigo',
  className = '',
}: SidebarNavProps) {
  return (
    <nav className={`space-y-2 ${className}`}>
      {items.map((item) => {
        const isActive = activeKey === item.key;
        return (
          <button
            key={item.key}
            onClick={() => onSelect(item.key)}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all cursor-pointer
              ${isActive
                ? activeColorStyles[activeColor]
                : 'text-slate-600 dark:text-slate-300 hover:bg-white/20 dark:hover:bg-slate-800/40'
              }
            `}
          >
            <span className="w-5 h-5 shrink-0">{item.icon}</span>
            <span className="truncate">{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && !isActive && (
              <span className="ml-auto w-5 h-5 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center font-bold shrink-0">
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
