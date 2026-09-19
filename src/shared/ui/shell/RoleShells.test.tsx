import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AdminShell, CustomerShell, DeliveryShell, RestaurantShell } from './RoleShells';

describe('the role shells', () => {
  it('each names its own main region', () => {
    for (const [Shell, label] of [
      [CustomerShell, 'Customer'],
      [RestaurantShell, 'Restaurant'],
      [DeliveryShell, 'Delivery'],
      [AdminShell, 'Admin'],
    ] as const) {
      const { unmount } = render(<Shell>body</Shell>);
      expect(screen.getByRole('main', { name: label })).toBeInTheDocument();
      unmount();
    }
  });

  it('forces dark on the rider shell, and only there', () => {
    // Legibility in direct sunlight, not a preference — so it does not follow the OS setting.
    const rider = render(<DeliveryShell>body</DeliveryShell>);
    expect(rider.container.querySelector('[data-role-shell]')?.className).toContain('dark');
    rider.unmount();

    const customer = render(<CustomerShell>body</CustomerShell>);
    expect(customer.container.querySelector('[data-role-shell]')?.className).not.toContain('dark');
  });

  it('gives the two desk-bound roles a side nav and the phone roles a bottom one', () => {
    const admin = render(<AdminShell nav={<span>n</span>}>body</AdminShell>);
    expect(admin.container.querySelector('[data-role-shell]')?.getAttribute('data-nav')).toBe('side');
    admin.unmount();

    const restaurant = render(<RestaurantShell nav={<span>n</span>}>body</RestaurantShell>);
    expect(restaurant.container.querySelector('[data-role-shell]')?.getAttribute('data-nav')).toBe('side');
    restaurant.unmount();

    const customer = render(<CustomerShell nav={<span>n</span>}>body</CustomerShell>);
    expect(customer.container.querySelector('[data-role-shell]')?.getAttribute('data-nav')).toBe('bottom');
  });
});
