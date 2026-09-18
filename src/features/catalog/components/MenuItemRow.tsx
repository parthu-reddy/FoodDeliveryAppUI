import { Pencil } from 'lucide-react';
import React from 'react';
import type { MenuItem } from '@/types';
import { formatINR } from '@shared/money';
import { Button, StatusPill, Surface } from '@shared/ui';
import { isOrderable, prepMinutes, unavailableReason } from '../model/menuItem';
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
 */

export interface MenuItemCapabilities {
  addToCart?: boolean;
  edit?: boolean;
  toggleAvailability?: boolean;
}

interface MenuItemRowProps {
  item: MenuItem;
  can?: MenuItemCapabilities;
  /** Current quantity in the cart, when `addToCart` is granted. */
  quantity?: number;
  onAdd?: (item: MenuItem) => void;
  onIncrement?: (item: MenuItem) => void;
  onDecrement?: (item: MenuItem) => void;
  onEdit?: (item: MenuItem) => void;
  onToggleAvailability?: (item: MenuItem, next: boolean) => void;
  className?: string;
}

export function MenuItemRow({
  item,
  can = {},
  quantity = 0,
  onAdd,
  onIncrement,
  onDecrement,
  onEdit,
  onToggleAvailability,
  className = '',
}: MenuItemRowProps) {
  const orderable = isOrderable(item);
  const reason = unavailableReason(item);
  const prep = prepMinutes(item);

  return (
    <div
      className={`flex gap-4 py-4 ${className}`}
      style={{ opacity: orderable ? 1 : 0.6 }}
      data-menu-item={item.id}
    >
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <VegMarker item={item} />
          {!orderable && reason && <StatusPill label={reason} tone="neutral" />}
        </div>

        <h4 className="text-[15px] font-bold leading-tight" style={{ color: 'var(--color-ink)' }}>
          {item.name}
        </h4>

        <p className="font-mono text-[17px] font-bold" style={{ color: 'var(--color-ink)' }}>
          {formatINR(item.price)}
        </p>

        {item.description && (
          <p
            className="text-[11.5px] leading-snug line-clamp-2"
            style={{ color: 'var(--color-ink-2)' }}
          >
            {item.description}
          </p>
        )}

        {prep !== null && (
          <p className="text-[11px] font-medium" style={{ color: 'var(--color-ink-2)' }}>
            Ready in <span className="font-mono font-bold">{prep} min</span>
          </p>
        )}

        {can.toggleAvailability && (
          <label className="flex items-center gap-2 mt-1 text-[11px] font-bold cursor-pointer"
                 style={{ color: 'var(--color-ink-2)' }}>
            <input
              type="checkbox"
              checked={orderable}
              onChange={(e) => onToggleAvailability?.(item, e.target.checked)}
            />
            Available today
          </label>
        )}
      </div>

      <div className="w-24 shrink-0 flex flex-col items-center gap-2">
        {item.imageUrl && (
          // The radius comes from Surface, not from a token reference: feature code does not
          // touch the surface tokens, and the Phase 2 gate enforces that.
          <Surface radius="md" elevation={0} variant="solid" className="overflow-hidden p-0">
            <img src={item.imageUrl} alt="" className="w-24 h-24 object-cover block" />
          </Surface>
        )}

        {can.addToCart && orderable && quantity === 0 && (
          <Button size="sm" variant="outline" onClick={() => onAdd?.(item)}>
            ADD
          </Button>
        )}

        {can.addToCart && orderable && quantity > 0 && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              aria-label={`Remove one ${item.name}`}
              onClick={() => onDecrement?.(item)}
            >
              &minus;
            </Button>
            <span className="font-mono text-sm font-bold" style={{ color: 'var(--color-ink)' }}>
              {quantity}
            </span>
            <Button
              size="sm"
              variant="outline"
              aria-label={`Add one ${item.name}`}
              onClick={() => onIncrement?.(item)}
            >
              +
            </Button>
          </div>
        )}

        {can.edit && (
          <Button
            size="sm"
            variant="ghost"
            icon={<Pencil className="w-3.5 h-3.5" />}
            aria-label={`Edit ${item.name}`}
            onClick={() => onEdit?.(item)}
          >
            Edit
          </Button>
        )}
      </div>
    </div>
  );
}
