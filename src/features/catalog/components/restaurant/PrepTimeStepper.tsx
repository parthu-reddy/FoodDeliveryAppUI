import { useEffect, useRef, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import type { Outlet } from '@/types';
import { restaurantApi } from '@/lib/zodiosClients';
import { PREP_FLOOR_MINUTES, PREP_MAX_MINUTES, outletPrepMinutes, stepPrepMinutes } from '../../model/prepTime';

/**
 * "Prep time right now" from `Restaurant.dc.html`: the outlet's default prep time, in fives.
 *
 * It is the floor on every new order's promised prep time (CustomerApplication `OrderPrepTime`)
 * and the figure on the outlet's browse card, so a kitchen falling behind raises one number
 * instead of asking each customer for a delay. Saved through the same settings endpoint as
 * `OutletSettingsEditor`, a moment after the last press so three taps are one request; a failed
 * save puts the number back and says so.
 */

const SAVE_AFTER_MS = 700;

interface PrepTimeStepperProps {
  outlet: Outlet | undefined;
  /** Refetch outlets after a save, so every other view of the default agrees. */
  onSaved?: () => void;
}

export function PrepTimeStepper({ outlet, onSaved }: PrepTimeStepperProps) {
  if (!outlet?.id) return null;
  const saved = outletPrepMinutes(outlet.defaultPrepTimeSeconds) ?? PREP_FLOOR_MINUTES;
  // Keyed on outlet and saved value: switching outlet, or a refetch that changed the default,
  // starts the stepper fresh from the server's number.
  return <Stepper key={`${outlet.id}:${saved}`} outletId={outlet.id} saved={saved} onSaved={onSaved} />;
}

function Stepper({ outletId, saved, onSaved }: { outletId: string; saved: number; onSaved?: () => void }) {
  const [minutes, setMinutes] = useState(saved);
  const [error, setError] = useState('');
  const lastSaved = useRef(saved);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const press = (direction: 1 | -1) => {
    const next = stepPrepMinutes(minutes, direction);
    if (next === minutes) return;
    setMinutes(next);
    setError('');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      try {
        await restaurantApi.restaurantOutlet.put(
          '/api/v1/outlets/:outletId/settings',
          { defaultPrepTimeSeconds: next * 60 },
          { params: { outletId } },
        );
        lastSaved.current = next;
        onSaved?.();
      } catch (e: unknown) {
        console.error('Failed to save prep time', e);
        setMinutes(lastSaved.current);
        setError(`Could not save. Still ${lastSaved.current} min.`);
      }
    }, SAVE_AFTER_MS);
  };

  const buttonClass = 'w-[42px] h-[42px] shrink-0 rounded-md border border-paper-line bg-paper-sunken flex items-center justify-center text-ink disabled:opacity-40';
  return (
    <section aria-label="Prep time right now" className="mt-3 p-3.5 rounded-2xl border border-paper-line flex flex-col gap-2.5" data-testid="prep-time-stepper">
      <h3 className="text-xs font-bold text-ink">Prep time right now</h3>
      <div className="flex items-center gap-2.5">
        <button type="button" className={buttonClass} aria-label="Decrease prep time by five minutes" disabled={minutes <= PREP_FLOOR_MINUTES} onClick={() => press(-1)}>
          <Minus className="w-[17px] h-[17px]" aria-hidden="true" />
        </button>
        <span className="flex-1 text-center flex flex-col">
          <span className="font-mono text-[28px] font-bold tracking-tight text-ink" aria-live="polite">{minutes}</span>
          <span className="font-mono text-[9px] font-bold tracking-[.12em] text-ink-3">MINUTES</span>
        </span>
        <button type="button" className={buttonClass} aria-label="Increase prep time by five minutes" disabled={minutes >= PREP_MAX_MINUTES} onClick={() => press(1)}>
          <Plus className="w-[17px] h-[17px]" aria-hidden="true" />
        </button>
      </div>
      {error ? (
        <p role="alert" className="text-[11px] font-semibold text-danger">{error}</p>
      ) : (
        <p className="text-[11px] text-ink-2 leading-snug">
          New orders are promised at least this long, and customers browsing this outlet see it before they order.
        </p>
      )}
    </section>
  );
}
