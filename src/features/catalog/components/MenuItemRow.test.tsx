import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MenuItemRow } from './MenuItemRow';
import { VegMarker } from './VegMarker';
import { groupByCategory, vegClass } from '../model/menuItem';
import type { MenuItem } from '@/types';

const base = {
  id: '1',
  restaurantId: 'r1',
  name: 'Chicken Dum Biryani',
  price: 420,
  isAvailable: true,
} as unknown as MenuItem;

const item = (over: Partial<MenuItem> = {}) => ({ ...base, ...over }) as MenuItem;

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

describe('MenuItemRow', () => {
  it('renders the same item content regardless of capabilities', () => {
    const { rerender } = render(<MenuItemRow item={item({ isVeg: true })} can={{ addToCart: true }} />);
    expect(screen.getByText('Chicken Dum Biryani')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Vegetarian' })).toBeInTheDocument();

    rerender(<MenuItemRow item={item({ isVeg: true })} can={{ edit: true }} />);
    expect(screen.getByText('Chicken Dum Biryani')).toBeInTheDocument();
    // the veg marker is present for the restaurant too -- it was not, before
    expect(screen.getByRole('img', { name: 'Vegetarian' })).toBeInTheDocument();
  });

  it('only offers add-to-cart when granted', () => {
    const { rerender } = render(<MenuItemRow item={item()} can={{ edit: true }} />);
    expect(screen.queryByRole('button', { name: 'ADD' })).not.toBeInTheDocument();
    rerender(<MenuItemRow item={item()} can={{ addToCart: true }} />);
    expect(screen.getByRole('button', { name: 'ADD' })).toBeInTheDocument();
  });

  it('switches to a stepper once the item is in the cart', () => {
    const onIncrement = vi.fn();
    render(
      <MenuItemRow item={item()} can={{ addToCart: true }} quantity={2} onIncrement={onIncrement} />,
    );
    expect(screen.queryByRole('button', { name: 'ADD' })).not.toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Add one/ }));
    expect(onIncrement).toHaveBeenCalledTimes(1);
  });

  it('hides add-to-cart and says why when the item is unavailable', () => {
    render(<MenuItemRow item={item({ isAvailable: false })} can={{ addToCart: true }} />);
    expect(screen.queryByRole('button', { name: 'ADD' })).not.toBeInTheDocument();
    expect(screen.getByText('Out of stock')).toBeInTheDocument();
  });

  it('lets a capability-holder toggle availability', () => {
    const onToggle = vi.fn();
    render(
      <MenuItemRow
        item={item()}
        can={{ toggleAvailability: true }}
        onToggleAvailability={onToggle}
      />,
    );
    fireEvent.click(screen.getByRole('checkbox', { name: /Available today/ }));
    expect(onToggle).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }), false);
  });

  it('never omits a prep time it was given, and never invents one', () => {
    const { rerender } = render(<MenuItemRow item={item({ prepTimeMinutes: 25 })} />);
    expect(screen.getByText('25 min')).toBeInTheDocument();
    rerender(<MenuItemRow item={item({ prepTimeMinutes: undefined })} />);
    expect(screen.queryByText(/min/)).not.toBeInTheDocument();
  });
});

describe('groupByCategory', () => {
  it('preserves the order the API returned', () => {
    const groups = groupByCategory([
      item({ id: 'a', categoryName: 'Biryani' }),
      item({ id: 'b', categoryName: 'Desserts' }),
      item({ id: 'c', categoryName: 'Biryani' }),
    ]);
    expect(groups.map((g) => g.category)).toEqual(['Biryani', 'Desserts']);
    expect(groups[0].items).toHaveLength(2);
  });

  it('buckets uncategorised items under Other', () => {
    const groups = groupByCategory([item({ categoryName: undefined })]);
    expect(groups[0].category).toBe('Other');
  });
});
