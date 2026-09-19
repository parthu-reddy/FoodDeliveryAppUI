import React from 'react';
import { Skeleton, Surface } from '@shared/ui';
import { groupByCategory, type MenuItemView } from '../model/menuItem';
import { MenuCategoryGroup } from './MenuCategoryGroup';
import { MenuItemRow, type MenuItemCapabilities } from './MenuItemRow';

/**
 * A whole menu: categories in the order the API returned them, each holding shared rows.
 *
 * The customer menu used to build this inline with a `reduce` keyed on `dish.category` — a
 * field `/catalog/items` never sets — so every dish landed in a single "Food" bucket and the
 * menu had no categories at all. `groupByCategory` keys on what the DTO actually carries.
 */

interface MenuListProps {
  views: MenuItemView[];
  /** Renders placeholder rows instead of the menu. The list owns its own loading shape. */
  loading?: boolean;
  can?: MenuItemCapabilities;
  /** Quantity currently in the cart, by item id. */
  quantities?: Record<string, number>;
  /** Applied to every item that is otherwise available — see `MenuItemRow.blockedReason`. */
  blockedReason?: string;
  /** Per-item rating node, by item id. A slot, so `catalog` need not import `reviews`. */
  ratings?: Record<string, React.ReactNode>;
  onAdd?: (id: string) => void;
  onIncrement?: (id: string) => void;
  onDecrement?: (id: string) => void;
}

export function MenuList({
  views,
  loading = false,
  can,
  quantities = {},
  blockedReason,
  ratings = {},
  onAdd,
  onIncrement,
  onDecrement,
}: MenuListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[0, 1, 2, 3].map((i) => (
          <Surface key={i} radius="xl" elevation={1} className="p-4">
            <Skeleton className="h-20 w-full" />
          </Surface>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groupByCategory(views).map(({ category, items }) => (
        <MenuCategoryGroup key={category} title={category} itemCount={items.length}>
          <div className="space-y-4">
            {items.map((view) => (
              <Surface key={view.id} radius="xl" elevation={1} className="p-4">
                <MenuItemRow
                  view={view}
                  can={can}
                  quantity={quantities[view.id] ?? 0}
                  blockedReason={blockedReason}
                  rating={ratings[view.id]}
                  onAdd={onAdd}
                  onIncrement={onIncrement}
                  onDecrement={onDecrement}
                />
              </Surface>
            ))}
          </div>
        </MenuCategoryGroup>
      ))}
    </div>
  );
}
