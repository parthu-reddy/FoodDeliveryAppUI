import type { MasterMenuItem, MenuItem } from '@/types';

/**
 * Everything the app needs to know about presenting a menu item, in one place.
 *
 * Before this, `CustomerMenuView`, `OutletMenuEditor` and `BrandMasterMenu` shared the
 * `MenuItem` *type* and nothing else — no shared row, price display, veg marker, category
 * grouping or availability rule. Each had re-solved the same problem, and they had already
 * drifted: only the customer view rendered a veg marker at all, so a restaurant manager could
 * not see which of their own items were vegetarian.
 *
 * The three screens do NOT all render the same DTO, which is why a plain `item: MenuItem`
 * prop was not enough:
 *
 *   - the customer reads `MenuItemDTO` from `/catalog/items` — `price`, `isAvailable`,
 *     `prepTimeMinutes`, `categoryName`, already resolved by the backend;
 *   - both restaurant editors read `MasterMenuItem` from `/master-menu` plus a separate
 *     outlet override record — `basePrice`, `packingCharge`, `defaultPrepTimeMinutes`, and
 *     availability that lives on the override, not on the item.
 *
 * `MenuItemView` is the shape the row actually renders, and the two adapters below are the
 * single place either DTO is turned into it.
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

/**
 * What each class is called, for a marker's accessible name and for an editor's options.
 *
 * One set of words. `VegMarker` and the item form had written these strings separately, which
 * is how a control could come to offer "Veg" while the marker announced "Vegetarian".
 */
export const VEG_LABEL: Record<VegClass, string> = {
  veg: 'Vegetarian',
  'non-veg': 'Non-vegetarian',
  unknown: 'Not specified',
};

/**
 * How the veg rule is edited: three states, because the data has three.
 *
 * A form control cannot hold `boolean | undefined` directly, so the editors carry the choice
 * as a string. Both directions live here beside `vegClass` — the module that owns what veg
 * means is the module that converts it, or the "unclassified is not non-veg" rule would be
 * re-decided wherever an item is saved.
 */
export type VegChoice = '' | 'true' | 'false';

export function vegChoiceOf(item: Pick<MenuItem, 'isVeg'>): VegChoice {
  const kind = vegClass(item);
  return kind === 'unknown' ? '' : kind === 'veg' ? 'true' : 'false';
}

/** `undefined` for "not specified" — never `false`, which would be a claim about the food. */
export function vegFromChoice(choice: VegChoice): boolean | undefined {
  return choice === '' ? undefined : choice === 'true';
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

/* ------------------------------------------------------------------------------------ */
/* The view the row renders                                                              */
/* ------------------------------------------------------------------------------------ */

export interface MenuItemView {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  isVeg?: boolean;
  /** Category label, when the source carries one. */
  category?: string;
  /** What the customer actually pays for this item, packing charge included. */
  price: number;
  /**
   * The price before an outlet override, when one applies — rendered struck through so a
   * manager can see what they changed. Absent when there is no override.
   */
  priceBeforeOverride?: number;
  prepMinutes: number | null;
  /** True when `prepMinutes` came from an outlet override, not the brand default. */
  prepOverridden: boolean;
  available: boolean;
}

/** The subset of an outlet menu override that changes how an item is presented. */
export interface OutletOverrideView {
  overriddenPrice?: number | null;
  overriddenPrepTimeMinutes?: number | null;
  isAvailable?: boolean;
}

/** The customer path: `MenuItemDTO`, already resolved by the backend. */
export function viewFromMenuItem(item: MenuItem): MenuItemView {
  return {
    id: item.id as string,
    name: item.name,
    description: item.description,
    imageUrl: item.imageUrl || item.image,
    isVeg: item.isVeg,
    category: item.categoryName,
    price: item.price,
    prepMinutes: prepMinutes(item),
    prepOverridden: false,
    available: isOrderable(item),
  };
}

/**
 * The restaurant path: a brand master item, plus the outlet's override when one exists.
 *
 * The arithmetic deliberately matches `CatalogService.getEffectiveMenuForOutlet`, which
 * builds the customer's price as `(overridden price ?? base price) + packing charge`. Before
 * this, `BrandMasterMenu` displayed the bare `basePrice` and so under-reported what the
 * customer is charged whenever an item carried a packing charge; `OutletMenuEditor` added it.
 * The two editors now show the same number, and it is the number the customer sees.
 */
export function viewFromMasterItem(
  master: MasterMenuItem,
  override?: OutletOverrideView,
): MenuItemView {
  const packing = master.packingCharge || 0;
  const hasPriceOverride =
    override?.overriddenPrice !== null && override?.overriddenPrice !== undefined;
  const hasPrepOverride =
    override?.overriddenPrepTimeMinutes !== null &&
    override?.overriddenPrepTimeMinutes !== undefined;

  return {
    id: master.id as string,
    name: master.name,
    description: master.description,
    imageUrl: master.imageUrl,
    isVeg: master.isVeg,
    price: (hasPriceOverride ? (override!.overriddenPrice as number) : master.basePrice) + packing,
    priceBeforeOverride: hasPriceOverride ? master.basePrice + packing : undefined,
    prepMinutes: hasPrepOverride
      ? (override!.overriddenPrepTimeMinutes as number)
      : prepMinutes({ prepTimeMinutes: master.defaultPrepTimeMinutes }),
    prepOverridden: hasPrepOverride,
    // No override record at all means the outlet has not disabled the item. The editors
    // treated a missing override as available and an `isAvailable: false` override as
    // unavailable; that rule is now stated once, here.
    available: override?.isAvailable !== false,
  };
}

/* ------------------------------------------------------------------------------------ */
/* Grouping                                                                              */
/* ------------------------------------------------------------------------------------ */

/**
 * Group items by category, preserving the order the API returned them in.
 *
 * Keyed on `categoryName`, which is what `MenuItemDTO` actually carries. `CustomerMenuView`
 * grouped on `dish.category` — a field the catalog endpoint never sets — so every dish fell
 * into a single "Food" bucket and the customer menu had, in effect, no categories at all.
 */
export function groupByCategory<T extends { category?: string }>(
  items: T[],
): { category: string; items: T[] }[] {
  const order: string[] = [];
  const buckets = new Map<string, T[]>();
  for (const item of items) {
    const key = item.category?.trim() || 'Other';
    if (!buckets.has(key)) {
      buckets.set(key, []);
      order.push(key);
    }
    buckets.get(key)!.push(item);
  }
  return order.map((category) => ({ category, items: buckets.get(category)! }));
}
