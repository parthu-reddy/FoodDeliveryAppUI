import { Moon, Settings, Sun, ToggleLeft, ToggleRight, User } from 'lucide-react';
import React from 'react';
import type { Outlet } from '@/types';
import { Button, StatusPill } from '@shared/ui';
import { RestaurantBrandSelector } from '@features/catalog/components/restaurant/RestaurantBrandSelector';

/**
 * The restaurant's chrome, in `RestaurantShell`'s header slot.
 *
 * Four of these five controls were hand-rolled `<button>`s with their own slate backgrounds
 * and their own light/dark branch. The outlet toggle is the one that matters during service —
 * it stops orders arriving — so it now states its state with a pill rather than relying on
 * the colour of an icon.
 */

interface RestaurantHeaderBarProps {
  myRestaurantName: string;
  hasOutlets: boolean;
  selectedOutletId: string;
  setSelectedOutletId: (id: string) => void;
  outlets: Outlet[];
  acceptingOrders: boolean;
  onToggleAccepting: () => void;
  theme: string;
  onToggleTheme: () => void;
  inProfile: boolean;
  onToggleProfile: () => void;
  inSettings: boolean;
  onToggleSettings: () => void;
}

export function RestaurantHeaderBar({
  myRestaurantName,
  hasOutlets,
  selectedOutletId,
  setSelectedOutletId,
  outlets,
  acceptingOrders,
  onToggleAccepting,
  theme,
  onToggleTheme,
  inProfile,
  onToggleProfile,
  inSettings,
  onToggleSettings,
}: RestaurantHeaderBarProps) {
  return (
    <div className="px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <RestaurantBrandSelector
        myRestaurantName={myRestaurantName}
        hasOutlets={hasOutlets}
        selectedOutletId={selectedOutletId}
        setSelectedOutletId={setSelectedOutletId}
        outlets={outlets}
        isCurrentOutletAcceptingOrders={acceptingOrders}
      />

      <div className="flex items-center gap-2 self-end sm:self-auto">
        <Button
          variant="ghost"
          onClick={onToggleAccepting}
          aria-pressed={acceptingOrders}
          title="Toggle whether this outlet accepts orders"
          icon={acceptingOrders ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
        >
          <StatusPill
            tone={acceptingOrders ? 'success' : 'danger'}
            label={acceptingOrders ? 'Active' : 'Inactive'}
          />
        </Button>

        <Button
          size="icon"
          variant="ghost"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        <Button
          size="icon"
          variant={inProfile ? 'primary' : 'ghost'}
          aria-pressed={inProfile}
          aria-label="Profile settings"
          onClick={onToggleProfile}
        >
          <User className="w-4 h-4" />
        </Button>

        <Button
          size="icon"
          variant={inSettings ? 'primary' : 'ghost'}
          aria-pressed={inSettings}
          aria-label="Restaurant registration and menu settings"
          onClick={onToggleSettings}
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
