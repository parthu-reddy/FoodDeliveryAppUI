import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Surface } from './Surface';

describe('Surface', () => {
  it('applies the requested elevation from the token ramp', () => {
    render(<Surface elevation={3}>content</Surface>);
    const el = screen.getByText('content');
    expect(el).toHaveAttribute('data-elevation', '3');
    expect(el.style.boxShadow).toBe('var(--elevation-3)');
  });

  it('defaults to a solid, opaque surface', () => {
    render(<Surface>content</Surface>);
    const el = screen.getByText('content');
    expect(el).toHaveAttribute('data-surface', 'solid');
    expect(el.style.backdropFilter).toBe('');
  });

  it('only applies backdrop-filter for glass variants', () => {
    const { rerender } = render(<Surface variant="glass-chrome">content</Surface>);
    expect(screen.getByText('content').style.backdropFilter).toBe('var(--blur-chrome)');

    rerender(<Surface variant="glass-overlay">content</Surface>);
    expect(screen.getByText('content').style.backdropFilter).toBe('var(--blur-overlay)');

    rerender(<Surface variant="sunken">content</Surface>);
    expect(screen.getByText('content').style.backdropFilter).toBe('');
  });

  it('maps radius names onto the token scale', () => {
    render(<Surface radius="xl">content</Surface>);
    expect(screen.getByText('content').style.borderRadius).toBe('var(--radius-xl)');
  });

  it('renders the requested element', () => {
    render(<Surface as="section" aria-label="panel">content</Surface>);
    expect(screen.getByLabelText('panel').tagName).toBe('SECTION');
  });

  it('adds transition properties only when interactive', () => {
    const { rerender } = render(<Surface>content</Surface>);
    expect(screen.getByText('content').style.transitionProperty).toBe('');

    rerender(<Surface interactive>content</Surface>);
    expect(screen.getByText('content').style.transitionProperty).toBe('transform, box-shadow');
  });
});
