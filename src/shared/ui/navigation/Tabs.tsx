import React from 'react';
import { Surface } from '../surface/Surface';

/**
 * The one tab bar.
 *
 * `SharedSettingsView`, `OperationsPage`, `RestaurantDashboard` and `AdminPortal` had each
 * written their own — `SharedSettingsView` alone repeated the same 200-character conditional
 * class string five times, once per tab. None of them was a real tabset: they were rows of
 * buttons with no `role`, no `aria-selected` and no keyboard navigation, so a screen-reader
 * user could not tell a tab from any other button, and arrow keys did nothing.
 */

export interface TabItem<T extends string = string> {
  key: T;
  label: React.ReactNode;
  /** Hidden without removing it from the list, so indices stay stable. */
  hidden?: boolean;
  /** Present but not reachable yet -- a section that needs something created first. Arrow
   *  navigation steps over it, which `aria-disabled` alone would not do. */
  disabled?: boolean;
}

interface TabsProps<T extends string> {
  items: TabItem<T>[];
  /**
   * `responsive` is a row on a phone and a column from `lg:` — the shape a side navigation
   * takes when the same set of sections has to work on both. It reports the orientation it
   * is actually in, because `aria-orientation` also tells assistive technology which arrow
   * keys to expect.
   */
  orientation?: 'horizontal' | 'responsive';
  value: T;
  onChange: (key: T) => void;
  /** Names the tabset for assistive technology. */
  label: string;
  className?: string;
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  label,
  orientation = 'horizontal',
  className = '',
}: TabsProps<T>) {
  const visible = items.filter((item) => !item.hidden);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    const at = visible.findIndex((item) => item.key === value);
    // Step over disabled tabs rather than landing on one. A full lap means every other tab
    // is disabled, and the selection stays where it is.
    for (let step = 1; step <= visible.length; step += 1) {
      const index = (((at + delta * step) % visible.length) + visible.length) % visible.length;
      const next = visible[index];
      if (!next.disabled) {
        if (next.key !== value) onChange(next.key);
        return;
      }
    }
  };

  return (
    <Surface
      radius="md"
      elevation={1}
      variant="sunken"
      className={`flex gap-2 p-1.5 overflow-x-auto whitespace-nowrap ${
        orientation === 'responsive' ? 'lg:overflow-x-visible lg:whitespace-normal' : ''
      } ${className}`}
    >
      <div
        role="tablist"
        aria-label={label}
        aria-orientation={orientation === 'responsive' ? undefined : 'horizontal'}
        onKeyDown={onKeyDown}
        className={`flex gap-2 flex-1 ${orientation === 'responsive' ? 'lg:flex-col' : ''}`}
      >
        {visible.map((item) => {
          const selected = item.key === value;
          return (
            <button
              key={item.key}
              role="tab"
              aria-selected={selected}
              aria-disabled={item.disabled || undefined}
              disabled={item.disabled}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(item.key)}
              className={`flex-1 min-w-[80px] px-3 py-2 rounded-lg text-xs font-bold ${
                item.disabled ? 'cursor-not-allowed' : 'cursor-pointer'
              }`}
              style={{
                background: selected ? 'var(--color-action)' : 'transparent',
                color: selected ? '#ffffff' : 'var(--color-ink-2)',
                opacity: item.disabled ? 0.5 : 1,
                border: '1px solid',
                borderColor: selected ? 'transparent' : 'var(--color-paper-line)',
                transitionProperty: 'background-color, color, border-color',
                transitionDuration: 'var(--duration-fast)',
                transitionTimingFunction: 'var(--ease-out)',
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </Surface>
  );
}
