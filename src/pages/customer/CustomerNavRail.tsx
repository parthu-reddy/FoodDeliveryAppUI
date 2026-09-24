import { History, Home, LogOut, MapPin, Moon, Sun, UserRound, Wallet } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import LaBouffeLogo from '@shared/ui/LaBouffeLogo';
import { surfaceStyle } from '@shared/ui';

/**
 * The desktop left rail from `Desktop.dc.html`: where you are, and the four places you can go.
 * Shown from `lg:` only -- on a phone the header's account button does this job.
 *
 * Every destination is a route the customer app already has; nothing here is a placeholder.
 * "Explore" from the artboard is not built: home already is the explore surface.
 */

const LINKS = [
  { to: '/customer', label: 'Home', Icon: Home, match: (p: string) => !p.includes('/settings') },
  { to: '/customer/settings/history', label: 'Orders', Icon: History, match: (p: string) => p.includes('/settings/history') },
  { to: '/customer/settings/wallet', label: 'Wallet', Icon: Wallet, match: (p: string) => p.includes('/settings/wallet') },
  { to: '/customer/settings/addresses', label: 'Addresses', Icon: MapPin, match: (p: string) => p.includes('/settings/addresses') },
  { to: '/customer/settings/profile', label: 'Account', Icon: UserRound, match: (p: string) => /\/settings(\/profile)?$/.test(p) },
];

interface CustomerNavRailProps {
  hasLiveOrder: boolean;
  onLogout: () => void;
}

export function CustomerNavRail({ hasLiveOrder, onLogout }: CustomerNavRailProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside
      aria-label="Customer navigation"
      className="hidden lg:flex w-[232px] shrink-0 flex-col gap-6 px-4 py-5 border-r border-paper-line"
      style={{ background: 'var(--color-paper-sunken)' }}
    >
      <div className="px-2">
        <LaBouffeLogo iconSize="w-8 h-8" textColorClass="text-ink text-sm" subColorClass="text-action-ink text-[9px]" />
      </div>
      <nav className="flex flex-col gap-1">
        {LINKS.map(({ to, label, Icon, match }) => {
          const active = match(pathname);
          return (
            <button
              key={to}
              type="button"
              onClick={() => navigate(to)}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 h-11 px-3 rounded-xl text-sm text-left ${active ? 'font-extrabold text-ink' : 'font-semibold text-ink-2'}`}
              style={active ? surfaceStyle({ radius: 'md', elevation: 1 }) : undefined}
            >
              <Icon className="w-[18px] h-[18px]" aria-hidden="true" style={active ? { color: 'var(--color-action-ink)' } : undefined} />
              <span className="flex-1">{label}</span>
              {label === 'Orders' && hasLiveOrder && (
                <span className="w-2 h-2 rounded-full" style={{ background: 'var(--color-live)' }} aria-label="An order is on its way" />
              )}
            </button>
          );
        })}
      </nav>
      <div className="mt-auto flex flex-col gap-1">
        <button type="button" onClick={toggleTheme} className="flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-semibold text-ink-2 text-left">
          {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" aria-hidden="true" /> : <Moon className="w-[18px] h-[18px]" aria-hidden="true" />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
        <button type="button" onClick={onLogout} className="flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-semibold text-ink-2 text-left">
          <LogOut className="w-[18px] h-[18px]" aria-hidden="true" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
