import type { MenuItem } from '@/types';

/**
 * Everything the app needs to know about presenting a menu item, in one place.
 *
 * Before this, `CustomerMenuView`, `OutletMenuEditor` and `BrandMasterMenu` shared the
 * `MenuItem` *type* and nothing else — no shared row, price display, veg marker, category
 * grouping or availability rule. Each had re-solved the same problem, and they had already
 * drifted: only the customer view rendered a veg marker at all, so a restaurant manager could
 * not see which of their own items were vegetarian.
 */

export type VegClass = 'veg' | 'non-veg' | 'unknown';

/**
 * `isVeg` is optional in MenuItemDTO, so absent and false mean different things: an item the
 * restaurant has not classified is NOT the same as one classified as non-vegetarian. Showing
 * the non-veg marker for an unclassified item would be a food-safety claim the data does not
 * support.
 */
export function vegClass(item: Pick<MenuItem, 'isVeg'>): VegClass {
  if (item.isVeg === true) return 'veg';
  if (item.isVeg === false) return 'non-veg';
  return 'unknown';
}

/** Can a customer add this to a cart right now? */
export function isOrderable(item: Pick<MenuItem, 'isAvailable'>): boolean {
  return item.isAvailable === true;
}

/**
 * Why an item cannot be ordered, for a customer-facing label. `null` when it can.
 */
export function unavailableReason(item: Pick<MenuItem, 'isAvailable'>): string | null {
  return isOrderable(item) ? null : 'Out of stock';
}

/** Prep time, or null when the restaurant has not set one. Never a made-up default. */
export function prepMinutes(item: Pick<MenuItem, 'prepTimeMinutes'>): number | null {
  const value = item.prepTimeMinutes;
  return typeof value === 'number' && value > 0 ? value : null;
}

/** Group items by category, preserving the order the API returned them in. */
export function groupByCategory<T extends Pick<MenuItem, 'categoryName'>>(
  items: T[],
): { category: string; items: T[] }[] {
  const order: string[] = [];
  const buckets = new Map<string, T[]>();
  for (const item of items) {
    const key = item.categoryName?.trim() || 'Other';
    if (!buckets.has(key)) {
      buckets.set(key, []);
      order.push(key);
    }
    buckets.get(key)!.push(item);
  }
  return order.map((category) => ({ category, items: buckets.get(category)! }));
}
