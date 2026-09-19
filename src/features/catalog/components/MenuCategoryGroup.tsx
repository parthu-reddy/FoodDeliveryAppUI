import { Layers } from 'lucide-react';
import React from 'react';
import { Surface } from '@shared/ui';

/**
 * One menu category: a heading, an optional aside, and the items under it.
 *
 * `BrandMasterMenu` and `OutletMenuEditor` had written this header twice — it is the pair the
 * Phase 3 duplication detector reported. The aside slot is what differed between them (brand
 * timings on one, outlet-override timings on the other), so that is a slot rather than a
 * branch, and the header around it is now written once.
 *
 * The customer menu renders the same component with no aside and no card chrome.
 */

interface MenuCategoryGroupProps {
  title: string;
  description?: string;
  /** The timing panel on the restaurant editors. Nothing on the customer menu. */
  aside?: React.ReactNode;
  /** Card chrome around the whole group. The customer menu is a plain list. */
  framed?: boolean;
  /** Shown instead of the children when the category holds no items. */
  emptyMessage?: string;
  itemCount: number;
  children: React.ReactNode;
  className?: string;
}

export function MenuCategoryGroup({
  title,
  description,
  aside,
  framed = false,
  emptyMessage,
  itemCount,
  children,
  className = '',
}: MenuCategoryGroupProps) {
  const header = (
    <div className={`flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 ${framed ? 'p-4' : ''}`}>
      <div>
        <div className="flex items-center gap-2 mb-1">
          {framed && <Layers className="w-4 h-4" style={{ color: 'var(--color-action)' }} />}
          <h5
            className="font-extrabold text-sm uppercase tracking-widest"
            style={{ color: 'var(--color-ink)' }}
          >
            {title}
          </h5>
        </div>
        {description && (
          <p className="text-[10px]" style={{ color: 'var(--color-ink-2)' }}>
            {description}
          </p>
        )}
      </div>
      {aside}
    </div>
  );

  const body =
    itemCount === 0 && emptyMessage ? (
      <div
        className="flex flex-col items-center justify-center py-8 gap-2"
        style={{ color: 'var(--color-ink-2)' }}
      >
        <Layers className="w-8 h-8 opacity-50" />
        <p className="text-xs font-bold uppercase tracking-wider">No items yet</p>
        <p className="text-[10px]">{emptyMessage}</p>
      </div>
    ) : (
      children
    );

  if (!framed) {
    return (
      <section className={`space-y-4 ${className}`}>
        {header}
        {body}
      </section>
    );
  }

  return (
    <Surface as="section" radius="lg" elevation={1} className={`overflow-hidden p-0 ${className}`}>
      {header}
      <div className="p-4">{body}</div>
    </Surface>
  );
}
