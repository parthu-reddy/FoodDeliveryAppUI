import React from 'react';
import type { MenuItem } from '@/types';
import { vegClass } from '../model/menuItem';

/**
 * The Indian veg / non-veg marker: a bordered square with a filled dot inside.
 *
 * The convention is not decorative — it is what customers actually scan for, and in India it
 * is a legal labelling requirement for packaged food. Green means vegetarian, brown-red means
 * non-vegetarian. The previous implementation lived inline in the customer menu and drew the
 * veg marker in **amber**, a side effect of the old palette collapsing green onto amber. No
 * customer reads amber as "vegetarian".
 *
 * An unclassified item renders nothing at all. Guessing would be a food claim the data does
 * not support.
 */

type MarkerSize = 'sm' | 'md';

const PX: Record<MarkerSize, { box: number; dot: number; border: number }> = {
  sm: { box: 13, dot: 6, border: 1.6 },
  md: { box: 16, dot: 7, border: 1.8 },
};

const COLOUR = {
  veg: 'var(--color-success)',
  'non-veg': 'var(--color-danger)',
} as const;

const LABEL = {
  veg: 'Vegetarian',
  'non-veg': 'Non-vegetarian',
} as const;

interface VegMarkerProps {
  item: Pick<MenuItem, 'isVeg'>;
  size?: MarkerSize;
  className?: string;
}

export function VegMarker({ item, size = 'sm', className = '' }: VegMarkerProps) {
  const kind = vegClass(item);
  if (kind === 'unknown') return null;

  const { box, dot, border } = PX[size];
  const colour = COLOUR[kind];

  return (
    <span
      role="img"
      aria-label={LABEL[kind]}
      title={LABEL[kind]}
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
      style={{
        width: box,
        height: box,
        border: `${border}px solid ${colour}`,
        borderRadius: 3,
      }}
    >
      <span
        style={{ width: dot, height: dot, borderRadius: '50%', background: colour }}
      />
    </span>
  );
}
