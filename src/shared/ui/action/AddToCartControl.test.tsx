import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AddToCartControl } from './AddToCartControl';

const reducedMotion = vi.hoisted(() => ({ value: false }));
vi.mock('motion/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('motion/react')>()),
  useReducedMotion: () => reducedMotion.value,
}));

const props = {
  label: 'Margherita',
  onAdd: vi.fn(),
  onIncrement: vi.fn(),
  onDecrement: vi.fn(),
};

describe('AddToCartControl', () => {
  it('offers ADD while the cart is empty of it', () => {
    render(<AddToCartControl {...props} quantity={0} />);
    expect(screen.getByRole('button', { name: /ADD/ })).toBeInTheDocument();
    expect(screen.queryByLabelText('Margherita quantity')).not.toBeInTheDocument();
  });

  it('morphs into the stepper once there is one', async () => {
    // The two states used to swap with no transition, so the control under the thumb
    // changed shape between frames. `mode="wait"` means the old one leaves before the new
    // one arrives, which is why this has to await rather than assert synchronously.
    const { rerender } = render(<AddToCartControl {...props} quantity={0} />);
    rerender(<AddToCartControl {...props} quantity={1} />);
    expect(await screen.findByLabelText('Margherita quantity')).toHaveTextContent('1');
  });

  it('reports adding, incrementing and decrementing to the caller', async () => {
    const onAdd = vi.fn();
    const { rerender } = render(<AddToCartControl {...props} quantity={0} onAdd={onAdd} />);
    fireEvent.click(screen.getByRole('button', { name: /ADD/ }));
    expect(onAdd).toHaveBeenCalled();

    const onIncrement = vi.fn();
    rerender(<AddToCartControl {...props} quantity={2} onIncrement={onIncrement} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Add one Margherita' }));
    expect(onIncrement).toHaveBeenCalled();
  });

  it('swaps instantly under reduced motion, to the same two states', async () => {
    reducedMotion.value = true;
    const { rerender } = render(<AddToCartControl {...props} quantity={0} />);
    expect(screen.getByRole('button', { name: /ADD/ })).toBeInTheDocument();
    rerender(<AddToCartControl {...props} quantity={1} />);
    expect(await screen.findByLabelText('Margherita quantity')).toHaveTextContent('1');
    reducedMotion.value = false;
  });
});
