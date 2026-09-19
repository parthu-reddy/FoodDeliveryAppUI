import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LoadingSkeleton, MenuCategorySkeleton, RestaurantCardSkeleton, Skeleton } from './Skeleton';

describe('Skeleton', () => {
  it('shows the shape of what is coming, rather than a spinner', () => {
    // Phase 5: "skeletons, never spinners, wherever the layout is known in advance". A
    // skeleton that is not shaped like its content is just a grey box.
    const { container } = render(<RestaurantCardSkeleton />);
    expect(container.querySelectorAll('div').length).toBeGreaterThan(2);
  });

  it('pulses, and the pulse is the only motion it has', () => {
    render(<Skeleton className="h-4 w-10" />);
    const node = document.querySelector('.animate-pulse');
    expect(node).not.toBeNull();
    // `animate-pulse` is opacity only, so it composites and cannot trigger layout.
    expect(node?.className).not.toMatch(/animate-(bounce|spin|ping)/);
  });

  it('is covered by the prefers-reduced-motion block rather than a JS branch', () => {
    // The pulse is a CSS animation, and index.css reduces every animation-duration to
    // 0.01ms under `prefers-reduced-motion: reduce`. There is deliberately no
    // useReducedMotion() here: adding one would be a second, divergent switch.
    const { container } = render(<LoadingSkeleton />);
    expect(container.querySelector('.animate-pulse')).not.toBeNull();
    expect(container.innerHTML).not.toMatch(/style="[^"]*animation/);
  });

  it('renders the menu category placeholder', () => {
    const { container } = render(<MenuCategorySkeleton />);
    expect(container.firstChild).not.toBeNull();
  });
});
