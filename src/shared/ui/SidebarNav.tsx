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
  className?: string;
}

export function SidebarNav({
  items,
  activeKey,
  onSelect,
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
            aria-current={isActive ? 'page' : undefined}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition cursor-pointer ${
              isActive ? '' : 'hover:bg-[var(--color-paper-sunken)]'
            }`}
            style={{
              // left unset when inactive on purpose: an inline background would beat the
              // hover class, which is how the old hover state came to do nothing at all
              background: isActive ? 'var(--color-action)' : undefined,
              color: isActive ? '#ffffff' : 'var(--color-ink-2)',
              boxShadow: isActive ? 'var(--elevation-2)' : 'none',
            }}
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
