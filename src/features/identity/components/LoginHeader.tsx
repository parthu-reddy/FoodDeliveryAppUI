import { ArrowLeft, Moon, Sun } from 'lucide-react';
import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@shared/ui';
import LaBouffeLogo from '@shared/ui/LaBouffeLogo';
import { LaBouffeLogoMark } from '@shared/ui/LaBouffeLogoMark';

/**
 * The login chrome, in `RoleShell`'s header slot.
 *
 * It carries no safe-area inset of its own. `LoginScreen` was the one file of 188 that
 * handled insets, and it did so in four separate places with three different fallbacks; the
 * shell now pads the header once and this renders inside that padding.
 */

interface LoginHeaderProps {
  /** Null while choosing a role — the header is the shrinking logo until then. */
  hasRole: boolean;
  /** Scroll offset from the shell, used to shrink the logo as the list moves under it. */
  scrollTop: number;
  onBack: () => void;
}

export function LoginHeader({ hasRole, scrollTop, onBack }: LoginHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const themeToggle = (
    <Button
      size="icon"
      variant="ghost"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </Button>
  );

  if (!hasRole) {
    return (
      <div className="relative flex flex-col items-center justify-center text-center px-4 sm:px-6 pb-5">
        <span className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-10">
          {themeToggle}
        </span>
        <div
          className="origin-center"
          style={{
            // Shrinks as the role list scrolls under it. The shell reports the offset; this
            // used to need a second scroll container nested inside the first.
            transform: `scale(${Math.max(0.72, Math.min(1, 1 - scrollTop / 300))})`,
            opacity: Math.max(0.9, Math.min(1, 1 - scrollTop / 550)),
            transitionProperty: 'transform, opacity',
            transitionDuration: 'var(--duration-fast)',
            transitionTimingFunction: 'var(--ease-out)',
          }}
        >
          <LaBouffeLogo
            className="flex flex-col items-center gap-2.5 w-full"
            iconSize={scrollTop > 10 ? 'w-11 h-11' : 'w-18 h-18'}
            align="center"
            textColorClass={theme === 'dark' ? 'text-white' : 'text-slate-800'}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between w-full max-w-7xl mx-auto px-4 sm:px-8 py-2">
      <Button size="icon" variant="ghost" aria-label="Back" onClick={onBack}>
        <ArrowLeft className="w-5 h-5" />
      </Button>
      <span className="flex items-center gap-1.5">
        <LaBouffeLogoMark className="w-6 h-6" />
        <span className="font-bold text-sm" style={{ color: 'var(--color-ink)' }}>
          La Bouffe
        </span>
      </span>
      {themeToggle}
    </div>
  );
}
