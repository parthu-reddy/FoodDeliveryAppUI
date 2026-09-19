import { Clock, Save } from 'lucide-react';
import React, { useState } from 'react';
import { Button, Input, StatusPill, Surface } from '@shared/ui';

/**
 * The hours a menu category is orderable, and the control to change them.
 *
 * `BrandMasterMenu` and `OutletMenuEditor` had each written this panel, its all-day rule and
 * its three pieces of edit state. The two copies had already drifted — only the outlet one
 * showed the brand windows it falls back to.
 *
 * The edit state lives here rather than in the screens. Both screens held a
 * `editingTimingCatId` / `tOpening` / `tClosing` triple at the top of a 550-line component,
 * which is how the same panel came to be written twice.
 */

export interface CategoryTiming {
  openingTime: string;
  closingTime: string;
}

/**
 * A single 00:00:00–23:59:59 window is how the backend stores "no restriction". Treating it
 * as a configured window would tell a manager they had set hours when they had not.
 */
function isRestricted(timings: CategoryTiming[] | undefined): boolean {
  if (!timings || timings.length === 0) return false;
  return !(
    timings.length === 1 &&
    timings[0].openingTime === '00:00:00' &&
    timings[0].closingTime === '23:59:59'
  );
}

const hhmm = (time: string) => time.substring(0, 5);

interface CategoryTimingPanelProps {
  title: string;
  timings?: CategoryTiming[];
  /** The windows this level falls back to when it sets none of its own. */
  fallback?: { label: string; timings?: CategoryTiming[] };
  onSave: (openingTime: string, closingTime: string) => void;
}

export function CategoryTimingPanel({
  title,
  timings,
  fallback,
  onSave,
}: CategoryTimingPanelProps) {
  const [editing, setEditing] = useState(false);
  const [opening, setOpening] = useState('00:00');
  const [closing, setClosing] = useState('23:59');
  const restricted = isRestricted(timings);

  const startEditing = () => {
    setOpening(restricted ? hhmm(timings![0].openingTime) : '00:00');
    setClosing(restricted ? hhmm(timings![0].closingTime) : '23:59');
    setEditing(true);
  };

  return (
    <Surface variant="sunken" radius="lg" className="p-2.5 min-w-[200px]">
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-[9px] font-extrabold uppercase tracking-wider flex items-center gap-1"
          style={{ color: 'var(--color-ink-3)' }}
        >
          <Clock className="w-3 h-3" /> {title}
        </span>
        {!editing && (
          <Button variant="ghost" size="xs" onClick={startEditing}>
            Edit
          </Button>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input
              type="time"
              aria-label="Opening time"
              value={opening}
              onChange={(e) => setOpening(e.target.value)}
              className="w-full"
            />
            <span className="font-bold" style={{ color: 'var(--color-ink-3)' }}>-</span>
            <Input
              type="time"
              aria-label="Closing time"
              value={closing}
              onChange={(e) => setClosing(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex gap-1">
            <Button variant="secondary" size="xs" className="flex-1" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button
              variant="success"
              size="xs"
              className="flex-1"
              icon={<Save className="w-3 h-3" />}
              onClick={() => {
                onSave(opening, closing);
                setEditing(false);
              }}
            >
              Save
            </Button>
          </div>
          <p className="text-[9px] italic text-center" style={{ color: 'var(--color-ink-3)' }}>
            Set 00:00 to 23:59 for All Day
          </p>
        </div>
      ) : restricted ? (
        <div className="flex flex-wrap gap-1">
          {timings!.map((t, i) => (
            <StatusPill
              key={i}
              tone="warning"
              className="font-mono"
              label={`${hhmm(t.openingTime)} - ${hhmm(t.closingTime)}`}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {fallback && (
            <p className="text-[9px] font-bold italic" style={{ color: 'var(--color-ink-3)' }}>
              {fallback.label}
            </p>
          )}
          {isRestricted(fallback?.timings) ? (
            <div className="flex flex-wrap gap-1">
              {fallback!.timings!.map((t, i) => (
                <StatusPill
                  key={i}
                  tone="warning"
                  className="font-mono opacity-75"
                  label={`${hhmm(t.openingTime)} - ${hhmm(t.closingTime)}`}
                />
              ))}
            </div>
          ) : (
            <StatusPill tone="neutral" className="font-mono" label="All day" />
          )}
        </div>
      )}
    </Surface>
  );
}
