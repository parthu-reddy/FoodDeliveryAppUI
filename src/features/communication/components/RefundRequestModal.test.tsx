import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RefundRequestModal } from './RefundRequestModal';

const mocks = vi.hoisted(() => ({ getOrder: vi.fn() }));
vi.mock('@/lib/zodiosClients', () => ({
  customerApi: { order: { get: (...args: unknown[]) => mocks.getOrder(...args) } },
}));

describe('Refund quote form readiness', () => {
  beforeEach(() => {
    mocks.getOrder.mockReset().mockResolvedValue({
      data: { id: 'order-1', items: [{ item: { id: 'item-1', name: 'Selected dish', price: 25 }, quantity: 2 }] },
    });
  });

  it('retains the validated selection while disconnected and submits only after connection is restored', async () => {
    const onSubmit = vi.fn().mockReturnValue(true);
    const onClose = vi.fn();
    const props = { isOpen: true, orderId: 'order-1', isChatConnected: false, onSubmit, onClose };
    const { rerender } = render(<RefundRequestModal {...props} />);
    fireEvent.click(await screen.findByRole('checkbox', { name: /Selected dish/ }));
    fireEvent.change(screen.getByPlaceholderText('Please explain why you are requesting a refund...'),
      { target: { value: 'Missing portions' } });
    const submit = screen.getByRole('button', { name: 'Request Quote' });
    expect(submit).toBeDisabled();
    expect(screen.getByText('Connecting to chat before sending your quote request…')).toBeVisible();
    fireEvent.click(submit);
    expect(onSubmit).not.toHaveBeenCalled();

    rerender(<RefundRequestModal {...props} isChatConnected />);
    expect(submit).toBeEnabled();
    fireEvent.click(submit);
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith([{ itemId: 'item-1', quantity: 2 }], 'Missing portions');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('keeps the form and selection open when the send fails instead of claiming success', async () => {
    const onSubmit = vi.fn().mockReturnValue(false);
    const onClose = vi.fn();
    render(<RefundRequestModal isOpen orderId="order-1" isChatConnected onSubmit={onSubmit} onClose={onClose} />);
    fireEvent.click(await screen.findByRole('checkbox', { name: /Selected dish/ }));
    fireEvent.change(screen.getByPlaceholderText('Please explain why you are requesting a refund...'),
      { target: { value: 'Missing portions' } });
    fireEvent.click(screen.getByRole('button', { name: 'Request Quote' }));
    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Request refund quote' })).toBeVisible();
    expect(screen.getByRole('checkbox', { name: /Selected dish/ })).toBeChecked();
  });
});
