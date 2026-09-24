import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { CartItem } from '@/types';

const walletGet = vi.fn();
vi.mock('@/lib/zodiosClients', () => ({
  customerApi: { customerMoney: { get: (...a: unknown[]) => walletGet(...a) } },
}));

import CustomerCheckout, { type CheckoutTotals } from './CustomerCheckout';

const items = [
  { item: { id: 'i1', name: 'Chicken Dum Biryani', price: 420, isVeg: false }, quantity: 1 },
  { item: { id: 'i2', name: 'Double Ka Meetha', price: 160, isVeg: true }, quantity: 1 },
] as unknown as CartItem[];

const quoted: CheckoutTotals = { subtotal: 580, deliveryFee: 0, tax: 46.4, total: 626.4 };

function renderCheckout(over: Partial<React.ComponentProps<typeof CustomerCheckout>> = {}) {
  const onPlaceOrder = vi.fn();
  render(
    <CustomerCheckout
      open
      onClose={() => {}}
      status="idle"
      totals={quoted}
      items={items}
      restaurantName="Paradise Biryani"
      address="412, 5th Main, Indiranagar"
      onChangeAddress={() => {}}
      onPlaceOrder={onPlaceOrder}
      {...over}
    />,
  );
  return { onPlaceOrder };
}

const placeButton = () => screen.getByRole('button', { name: /place order/i });

describe('CustomerCheckout', () => {
  beforeEach(() => walletGet.mockReset());

  it('shows the delivery address as words, the whole bill, and the final total', async () => {
    walletGet.mockResolvedValue({ balance: 1240 });
    renderCheckout();
    expect(screen.getByText('412, 5th Main, Indiranagar')).toBeInTheDocument();
    expect(screen.getByText('GST & restaurant charges')).toBeInTheDocument();
    expect(screen.getByText('FREE')).toBeInTheDocument();
    expect(screen.getByText(/No surcharge at the door/)).toBeInTheDocument();
    await waitFor(() => expect(placeButton()).toBeEnabled());
  });

  it('pays from the wallet by default when it covers the bill', async () => {
    walletGet.mockResolvedValue({ balance: 1240 });
    const { onPlaceOrder } = renderCheckout();
    await screen.findByText(/Balance/);
    fireEvent.click(placeButton());
    expect(onPlaceOrder).toHaveBeenCalledWith('WALLET', 0);
  });

  it('does not let a short wallet be charged and waits for another method', async () => {
    walletGet.mockResolvedValue({ balance: 100 });
    const { onPlaceOrder } = renderCheckout();
    await screen.findByText(/not enough for this order/);
    expect(screen.getByRole('radio', { name: /wallet/i })).toBeDisabled();
    expect(placeButton()).toBeDisabled();

    fireEvent.click(screen.getByRole('radio', { name: /^UPI$/ }));
    fireEvent.click(placeButton());
    expect(onPlaceOrder).toHaveBeenCalledWith('UPI', 0);
  });

  it('starts with no tip -- the customer opts in', async () => {
    walletGet.mockResolvedValue({ balance: 1240 });
    renderCheckout();
    expect(screen.getByRole('radio', { name: '₹0' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.queryByText('Rider tip')).not.toBeInTheDocument();
  });

  it('a tip is on the bill, in the total on the button, and sent with the order', async () => {
    walletGet.mockResolvedValue({ balance: 1240 });
    const { onPlaceOrder } = renderCheckout();
    await screen.findByText(/Balance/);
    fireEvent.click(screen.getByRole('radio', { name: '₹20' }));
    expect(screen.getByText('Rider tip')).toBeInTheDocument();
    expect(placeButton()).toHaveTextContent('646.40');
    fireEvent.click(placeButton());
    expect(onPlaceOrder).toHaveBeenCalledWith('WALLET', 20);
  });

  it('checks the wallet against the total with the tip', async () => {
    walletGet.mockResolvedValue({ balance: 640 });
    renderCheckout();
    await screen.findByText(/Balance/);
    expect(screen.getByRole('radio', { name: /Wallet/ })).toBeEnabled();
    fireEvent.click(screen.getByRole('radio', { name: '₹20' }));
    expect(screen.getByRole('radio', { name: /Wallet/ })).toBeDisabled();
  });

  it('never offers an unquoted total as payable', async () => {
    walletGet.mockResolvedValue({ balance: 1240 });
    const { onPlaceOrder } = renderCheckout({
      totals: { subtotal: 580, deliveryFee: 40, tax: 0, total: 620, isEstimated: true },
    });
    await screen.findByText(/Balance/);
    expect(screen.queryByText('GST & restaurant charges')).not.toBeInTheDocument();
    expect(screen.getByText('Total before taxes')).toBeInTheDocument();
    expect(placeButton()).toBeDisabled();
    fireEvent.click(placeButton());
    expect(onPlaceOrder).not.toHaveBeenCalled();
  });

  it('will not place an order with no address', async () => {
    walletGet.mockResolvedValue({ balance: 1240 });
    renderCheckout({ address: '' });
    await screen.findByText(/Balance/);
    expect(screen.getByText('Choose a delivery address')).toBeInTheDocument();
    expect(placeButton()).toBeDisabled();
  });
});
