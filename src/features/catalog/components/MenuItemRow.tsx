import { Pencil } from 'lucide-react';
import React from 'react';
import { formatINR } from '@shared/money';
import { AddToCartControl, Button, StatusPill, Surface } from '@shared/ui';
import ImageLoader from '@shared/ui/ImageLoader';
import type { MenuItemView } from '../model/menuItem';
import { VegMarker } from './VegMarker';

/**
 * One menu item, rendered the same way for every role.
 *
 * Roles differ by CAPABILITY, not by a second implementation and not by a role string. A
 * customer gets `addToCart`; a restaurant gets `edit` and `toggleAvailability`. The item
 * itself — image, veg marker, name, price, description, availability — is identical in both,
 * which is the point: it was not identical before, and the veg marker existed on only one of
 * the three screens that render menu items.
 *
 * There is deliberately no `role` prop. A role literal inside a shared domain component is
 * how the three-way split started, and the Phase 3 gate fails on one.
 *
 * It takes a `MenuItemView`, not a DTO, because the three screens do not read the same DTO —
 * see `model/menuItem.ts`. `rating` is a slot rather than a prop so that `catalog` does not
 * have to depend on `reviews`; the customer screen passes a `<StarRating>` into it.
 */

export interface MenuItemCapabilities {
  addToCart?: boolean;
  edit?: boolean;
  toggleAvailability?: boolean;
}

interface MenuItemRowProps {
  view: MenuItemView;
  can?: MenuItemCapabilities;
  /** Current quantity in the cart, when `addToCart` is granted. */
  quantity?: number;
  /**
   * Why ordering is blocked for a reason that is not the item's own availability — the
   * outlet not delivering to this address, for instance. Applies only to an item that is
   * itself available: "Out of stock" is the more specific fact and wins.
   */
  blockedReason?: string;
  /** Rating slot. Kept as a node so `catalog` need not import `reviews`. */
  rating?: React.ReactNode;
  onAdd?: (id: string) => void;
  onIncrement?: (id: string) => void;
  onDecrement?: (id: string) => void;
  onEdit?: (id: string) => void;
  onToggleAvailability?: (id: string, next: boolean) => void;
  className?: string;
}

export function MenuItemRow({
  view,
  can = {},
  quantity = 0,
  blockedReason,
  rating,
  onAdd,
  onIncrement,
  onDecrement,
  onEdit,
  onToggleAvailability,
  className = '',
}: MenuItemRowProps) {
  const blocked = view.available && Boolean(blockedReason);
  const note = view.available ? (blockedReason ?? null) : 'Out of stock';
  const orderable = view.available && !blocked;

  return (
    <div
      className={`flex gap-4 ${className}`}
      style={{ opacity: view.available ? 1 : 0.6 }}
      data-menu-item={view.id}
    >
      {view.imageUrl && (
        // The radius comes from Surface, not from a token reference: feature code does not
        // touch the surface tokens, and the Phase 2 gate enforces that.
        <Surface radius="md" elevation={0} variant="solid" className="overflow-hidden p-0 shrink-0">
          <ImageLoader
            src={view.imageUrl}
            alt=""
            className="w-20 h-20 object-cover block"
            referrerPolicy="no-referrer"
            containerClassName="w-20 h-20"
            loading="lazy"
          />
        </Surface>
      )}

      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <VegMarker item={view} />
          <h4
            className="text-[15px] font-bold leading-tight truncate"
            style={{ color: 'var(--color-ink)' }}
          >
            {view.name}
          </h4>
        </div>

        {rating}

        <div className="flex items-baseline gap-2">
          {view.priceBeforeOverride !== undefined && (
            <span
              className="font-mono text-[12px] line-through"
              style={{ color: 'var(--color-ink-2)' }}
            >
              {formatINR(view.priceBeforeOverride)}
            </span>
          )}
          <span className="font-mono text-[17px] font-bold" style={{ color: 'var(--color-ink)' }}>
            {formatINR(view.price)}
          </span>
        </div>

        {view.description && (
          <p
            className="text-[11.5px] leading-snug line-clamp-2"
            style={{ color: 'var(--color-ink-2)' }}
          >
            {view.description}
          </p>
        )}

        {view.prepMinutes !== null && (
          <p className="text-[11px] font-medium" style={{ color: 'var(--color-ink-2)' }}>
            Ready in <span className="font-mono font-bold">{view.prepMinutes} min</span>
            {view.prepOverridden && <span className="opacity-70"> (edited)</span>}
          </p>
        )}

        {can.toggleAvailability && (
          <label
            className="flex items-center gap-2 mt-1 text-[11px] font-bold cursor-pointer"
            style={{ color: 'var(--color-ink-2)' }}
          >
            <input
              type="checkbox"
              checked={view.available}
              onChange={(e) => onToggleAvailability?.(view.id, e.target.checked)}
            />
            Available today
          </label>
        )}
      </div>

      <div className="shrink-0 flex flex-col items-end justify-between gap-2">
        {note && <StatusPill label={note} tone={view.available ? 'neutral' : 'danger'} />}

        {can.addToCart && orderable && (
          <AddToCartControl
            quantity={quantity}
            label={view.name}
            onAdd={() => onAdd?.(view.id)}
            onIncrement={() => onIncrement?.(view.id)}
            onDecrement={() => onDecrement?.(view.id)}
          />
        )}

        {can.edit && (
          <Button
            size="sm"
            variant="ghost"
            icon={<Pencil className="w-3.5 h-3.5" />}
            aria-label={`Edit ${view.name}`}
            onClick={() => onEdit?.(view.id)}
          >
            Edit
          </Button>
        )}
      </div>
    </div>
  );
}
