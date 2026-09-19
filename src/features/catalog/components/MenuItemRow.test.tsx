import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MenuItemRow } from './MenuItemRow';
import { VegMarker } from './VegMarker';
import {
  groupByCategory,
  vegClass,
  viewFromMasterItem,
  viewFromMenuItem,
  type MenuItemView,
} from '../model/menuItem';
import type { MasterMenuItem, MenuItem } from '@/types';

const base = {
  id: '1',
  restaurantId: 'r1',
  name: 'Chicken Dum Biryani',
  price: 420,
  isAvailable: true,
} as unknown as MenuItem;

const item = (over: Partial<MenuItem> = {}) => ({ ...base, ...over }) as MenuItem;
const view = (over: Partial<MenuItemView> = {}): MenuItemView => ({
  ...viewFromMenuItem(base),
  ...over,
});

const master = (over: Partial<MasterMenuItem> = {}): MasterMenuItem =>
  ({ id: 'm1', name: 'Paneer Tikka', basePrice: 300, packingCharge: 20, ...over }) as MasterMenuItem;

describe('vegClass', () => {
  it('distinguishes unclassified from non-vegetarian', () => {
    // absent and false are NOT the same: showing the non-veg marker for an unclassified item
    // would be a food claim the data does not support.
    expect(vegClass(item({ isVeg: true }))).toBe('veg');
    expect(vegClass(item({ isVeg: false }))).toBe('non-veg');
    expect(vegClass(item({ isVeg: undefined }))).toBe('unknown');
  });
});

describe('VegMarker', () => {
  it('labels the marker for screen readers', () => {
    const { rerender } = render(<VegMarker item={item({ isVeg: true })} />);
    expect(screen.getByRole('img', { name: 'Vegetarian' })).toBeInTheDocument();
    rerender(<VegMarker item={item({ isVeg: false })} />);
    expect(screen.getByRole('img', { name: 'Non-vegetarian' })).toBeInTheDocument();
  });

  it('renders nothing when the item is unclassified', () => {
    const { container } = render(<VegMarker item={item({ isVeg: undefined })} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('uses green for veg and the danger hue for non-veg, never amber', () => {
    const { rerender } = render(<VegMarker item={item({ isVeg: true })} />);
    expect(screen.getByRole('img').style.border).toContain('--color-success');
    rerender(<VegMarker item={item({ isVeg: false })} />);
    expect(screen.getByRole('img').style.border).toContain('--color-danger');
  });
});

describe('viewFromMenuItem', () => {
  it('reads the category the catalog endpoint actually sends', () => {
    // `categoryName` is what MenuItemDTO carries. CustomerMenuView grouped on `category`,
    // which that endpoint never sets, so every dish fell into one bucket.
    expect(viewFromMenuItem(item({ categoryName: 'Biryani' })).category).toBe('Biryani');
  });

  it('never invents a prep time', () => {
    expect(viewFromMenuItem(item({ prepTimeMinutes: 25 })).prepMinutes).toBe(25);
    expect(viewFromMenuItem(item({ prepTimeMinutes: undefined })).prepMinutes).toBeNull();
    expect(viewFromMenuItem(item({ prepTimeMinutes: 0 })).prepMinutes).toBeNull();
  });
});

describe('viewFromMasterItem', () => {
  it('adds the packing charge, as the backend does when it prices the item', () => {
    // CatalogService builds the customer's price as (override ?? base) + packingCharge.
    // BrandMasterMenu showed the bare basePrice and so under-reported what is charged.
    expect(viewFromMasterItem(master()).price).toBe(320);
  });

  it('shows the pre-override price alongside the override, not instead of it', () => {
    const v = viewFromMasterItem(master(), { overriddenPrice: 250 });
    expect(v.price).toBe(270);
    expect(v.priceBeforeOverride).toBe(320);
  });

  it('leaves the pre-override price absent when nothing is overridden', () => {
    expect(viewFromMasterItem(master(), { isAvailable: true }).priceBeforeOverride).toBeUndefined();
  });

  it('marks an overridden prep time so a manager can see it was edited', () => {
    const plain = viewFromMasterItem(master({ defaultPrepTimeMinutes: 15 }));
    expect(plain.prepMinutes).toBe(15);
    expect(plain.prepOverridden).toBe(false);

    const edited = viewFromMasterItem(master({ defaultPrepTimeMinutes: 15 }), {
      overriddenPrepTimeMinutes: 30,
    });
    expect(edited.prepMinutes).toBe(30);
    expect(edited.prepOverridden).toBe(true);
  });

  it('treats a missing override as available and only false as unavailable', () => {
    expect(viewFromMasterItem(master()).available).toBe(true);
    expect(viewFromMasterItem(master(), {}).available).toBe(true);
    expect(viewFromMasterItem(master(), { isAvailable: false }).available).toBe(false);
  });
});

describe('MenuItemRow', () => {
  it('renders the same item content regardless of capabilities', () => {
    const v = view({ isVeg: true });
    const { rerender } = render(<MenuItemRow view={v} can={{ addToCart: true }} />);
    expect(screen.getByText('Chicken Dum Biryani')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Vegetarian' })).toBeInTheDocument();

    rerender(<MenuItemRow view={v} can={{ edit: true }} />);
    expect(screen.getByText('Chicken Dum Biryani')).toBeInTheDocument();
    // the veg marker is present for the restaurant too -- it was not, before
    expect(screen.getByRole('img', { name: 'Vegetarian' })).toBeInTheDocument();
  });

  it('only offers add-to-cart when granted', () => {
    const { rerender } = render(<MenuItemRow view={view()} can={{ edit: true }} />);
    expect(screen.queryByRole('button', { name: 'ADD' })).not.toBeInTheDocument();
    rerender(<MenuItemRow view={view()} can={{ addToCart: true }} />);
    expect(screen.getByRole('button', { name: 'ADD' })).toBeInTheDocument();
  });

  it('switches to a stepper once the item is in the cart', () => {
    const onIncrement = vi.fn();
    render(
      <MenuItemRow view={view()} can={{ addToCart: true }} quantity={2} onIncrement={onIncrement} />,
    );
    expect(screen.queryByRole('button', { name: 'ADD' })).not.toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Add one/ }));
    expect(onIncrement).toHaveBeenCalledWith('1');
  });

  it('hides add-to-cart and says why when the item is unavailable', () => {
    render(<MenuItemRow view={view({ available: false })} can={{ addToCart: true }} />);
    expect(screen.queryByRole('button', { name: 'ADD' })).not.toBeInTheDocument();
    expect(screen.getByText('Out of stock')).toBeInTheDocument();
  });

  it('blocks ordering for an outlet-level reason without claiming the dish is out of stock', () => {
    render(
      <MenuItemRow view={view()} can={{ addToCart: true }} blockedReason="Unavailable here" />,
    );
    expect(screen.queryByRole('button', { name: 'ADD' })).not.toBeInTheDocument();
    expect(screen.getByText('Unavailable here')).toBeInTheDocument();
    expect(screen.queryByText('Out of stock')).not.toBeInTheDocument();
  });

  it('prefers the dish-level reason when both apply', () => {
    // "Out of stock" is the more specific fact about this dish, so it wins over the outlet
    // not delivering here.
    render(
      <MenuItemRow
        view={view({ available: false })}
        can={{ addToCart: true }}
        blockedReason="Unavailable here"
      />,
    );
    expect(screen.getByText('Out of stock')).toBeInTheDocument();
    expect(screen.queryByText('Unavailable here')).not.toBeInTheDocument();
  });

  it('lets a capability-holder toggle availability', () => {
    const onToggle = vi.fn();
    render(
      <MenuItemRow
        view={view()}
        can={{ toggleAvailability: true }}
        onToggleAvailability={onToggle}
      />,
    );
    fireEvent.click(screen.getByRole('checkbox', { name: /Available today/ }));
    expect(onToggle).toHaveBeenCalledWith('1', false);
  });

  it('never omits a prep time it was given, and never invents one', () => {
    const { rerender } = render(<MenuItemRow view={view({ prepMinutes: 25 })} />);
    expect(screen.getByText('25 min')).toBeInTheDocument();
    rerender(<MenuItemRow view={view({ prepMinutes: null })} />);
    expect(screen.queryByText(/min/)).not.toBeInTheDocument();
  });

  it('renders the rating slot it is given and nothing when there is none', () => {
    const { rerender } = render(<MenuItemRow view={view()} rating={<span>4.6 (12)</span>} />);
    expect(screen.getByText('4.6 (12)')).toBeInTheDocument();
    rerender(<MenuItemRow view={view()} />);
    expect(screen.queryByText('4.6 (12)')).not.toBeInTheDocument();
  });
});

describe('groupByCategory', () => {
  it('preserves the order the API returned', () => {
    const groups = groupByCategory([
      view({ id: 'a', category: 'Biryani' }),
      view({ id: 'b', category: 'Desserts' }),
      view({ id: 'c', category: 'Biryani' }),
    ]);
    expect(groups.map((g) => g.category)).toEqual(['Biryani', 'Desserts']);
    expect(groups[0].items).toHaveLength(2);
  });

  it('buckets uncategorised items under Other', () => {
    expect(groupByCategory([view({ category: undefined })])[0].category).toBe('Other');
  });
});
