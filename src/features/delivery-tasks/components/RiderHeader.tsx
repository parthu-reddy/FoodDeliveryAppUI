import { Bike, User } from 'lucide-react';
import React from 'react';
import { Button } from '@shared/ui';
import ImageLoader from '@shared/ui/ImageLoader';
import LaBouffeLogo from '@shared/ui/LaBouffeLogo';
import { DeliveryOnlineToggle } from './DeliveryOnlineToggle';

/**
 * The rider's chrome, in `DeliveryShell`'s header slot.
 *
 * There is no theme toggle. `DeliveryShell` forces the dark scheme, because on this surface
 * dark is a legibility decision for direct sunlight rather than a preference — so a control
 * that claimed to switch it would have done nothing. That is a deliberate behaviour change
 * from the old header, and it is reversible in one line if riders want it back.
 *
 * Every control here is `touch`-sized: 48px, not the 44px that suits a phone held still.
 */

interface RiderHeaderProps {
  name: string;
  vehicleNumber: string;
  photoUrl: string;
  isOnline: boolean;
  deliveryExecutiveId: string;
  isProfileMandatory: boolean;
  onToggleOnline: () => void;
  inSettings: boolean;
  onToggleSettings: () => void;
}

export function RiderHeader({
  name,
  vehicleNumber,
  photoUrl,
  isOnline,
  deliveryExecutiveId,
  isProfileMandatory,
  onToggleOnline,
  inSettings,
  onToggleSettings,
}: RiderHeaderProps) {
  return (
    <div className="px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-3.5 flex-wrap">
        <LaBouffeLogo showText={false} iconSize="w-8 h-8" />
        <button
          onClick={onToggleSettings}
          className="flex items-center gap-2 text-left p-1.5 -ml-1.5 rounded-xl cursor-pointer"
          style={{ minHeight: 48 }}
        >
          {photoUrl ? (
            <ImageLoader
              src={photoUrl}
              alt=""
              className="w-8 h-8 rounded-full object-cover"
              containerClassName="w-8 h-8 rounded-full"
              loading="lazy"
            />
          ) : (
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'var(--color-paper-sunken)', color: 'var(--color-action)' }}
            >
              <Bike className="w-4 h-4" aria-hidden="true" />
            </span>
          )}
          <span>
            <span
              className="font-extrabold text-xs tracking-tight leading-none block"
              style={{ color: 'var(--color-ink)' }}
            >
              {name || 'Rider Portal'}
            </span>
            {vehicleNumber && (
              <span
                className="text-[9px] font-bold block mt-0.5"
                style={{ color: 'var(--color-ink-2)' }}
              >
                {vehicleNumber}
              </span>
            )}
          </span>
        </button>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto">
        <DeliveryOnlineToggle
          isOnline={isOnline}
          deliveryExecutiveId={deliveryExecutiveId}
          isProfileMandatory={isProfileMandatory}
          handleToggleOnline={onToggleOnline}
        />
        <Button
          size="touch-icon"
          variant={inSettings ? 'primary' : 'ghost'}
          aria-label={inSettings ? 'Back to jobs' : 'Profile settings'}
          aria-pressed={inSettings}
          onClick={onToggleSettings}
        >
          <User className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
