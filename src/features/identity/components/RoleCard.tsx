import React from 'react';
import { Surface } from '@shared/ui';
import type { RoleChoice } from '../model/roles';

/**
 * One role, as a card.
 *
 * Written once. `RoleSelector` previously held five copies of this markup — four in the
 * desktop grid and one in the mobile carousel — each with its own hand-rolled glass, its own
 * `shadow-[0_15px_35px_rgba(...)]` and its own light/dark branch, which is 58 of the ad-hoc
 * surface utilities Phase 4 removes.
 *
 * Solid, not glass. Glass is a layer role — it belongs on chrome that floats over scrolling
 * content, and a role card is the content. The first version of this used `glass-chrome` and
 * the Phase 4 gate rejected it, which is the check doing its job on its own author.
 */

interface RoleCardProps {
  choice: RoleChoice;
  onSelect: () => void;
  /** Carousel state. `undefined` on the desktop grid, where every card is equally present. */
  active?: boolean;
  compact?: boolean;
  className?: string;
}

export function RoleCard({ choice, onSelect, active, compact = false, className = '' }: RoleCardProps) {
  const Icon = choice.icon;
  const dimmed = active === false;

  return (
    <button
      onClick={onSelect}
      className={`group text-left cursor-pointer ${className}`}
      style={{
        transform: dimmed ? 'scale(0.9)' : undefined,
        opacity: dimmed ? 0.4 : 1,
        transitionProperty: 'transform, opacity',
        transitionDuration: 'var(--duration-base)',
        transitionTimingFunction: 'var(--ease-out)',
      }}
    >
      <Surface
        radius="xl"
        elevation={2}
        interactive
        className={`flex flex-col items-center justify-center text-center h-full ${
          compact ? 'p-6' : 'p-8 min-h-[260px]'
        }`}
      >
        <span
          className={`rounded-2xl text-white shrink-0 ${compact ? 'mb-4 p-4' : 'mb-4.5 p-4'}`}
          style={{ background: `var(--color-${choice.accent})` }}
        >
          <Icon className={compact ? 'w-6 h-6' : 'w-7 h-7'} aria-hidden="true" />
        </span>
        <span>
          <span
            className={`block font-extrabold ${compact ? 'text-base mb-1.5' : 'text-lg mb-2'}`}
            style={{ color: 'var(--color-ink)' }}
          >
            {choice.title}
          </span>
          <span
            className={`block text-xs leading-relaxed mx-auto ${compact ? 'max-w-[190px]' : 'max-w-[210px]'}`}
            style={{ color: 'var(--color-ink-2)' }}
          >
            {choice.description}
          </span>
        </span>
      </Surface>
    </button>
  );
}
