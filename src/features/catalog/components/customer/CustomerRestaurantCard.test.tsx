import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Restaurant } from '@/types';
import CustomerRestaurantCard from './CustomerRestaurantCard';

const base = { id: 'r1', name: 'Paradise Biryani', rating: 4.4, deliveryFee: 30 } as Restaurant;

describe('CustomerRestaurantCard', () => {
  it("shows the kitchen's live prep default, not the onboarding delivery time", () => {
    render(<CustomerRestaurantCard restaurant={{ ...base, defaultPrepTimeSeconds: 1500, deliveryTime: 40 } as Restaurant} isLast={false} lastElementRef={() => {}} onClick={() => {}} />);
    expect(screen.getByText(/25 min prep/)).toBeInTheDocument();
    expect(screen.queryByText(/40 min/)).not.toBeInTheDocument();
  });

  it('shows no time at all when the outlet sent none', () => {
    render(<CustomerRestaurantCard restaurant={{ ...base, deliveryTime: 40 } as Restaurant} isLast={false} lastElementRef={() => {}} onClick={() => {}} />);
    expect(screen.queryByText(/min/)).not.toBeInTheDocument();
  });
});
