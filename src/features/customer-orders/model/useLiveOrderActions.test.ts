import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrderStatus } from '@/types/backend-enums';
import type { Order } from '@/types';

const post = vi.fn();
vi.mock('@/lib/zodiosClients', () => ({
  customerApi: { order: { post: (...a: unknown[]) => post(...a) } },
}));
const confirm = vi.fn();
vi.mock('@shared/ui', () => ({ useConfirm: () => confirm }));

import { useLiveOrderActions } from './useLiveOrderActions';

const order = { id: 'o1', status: OrderStatus.AWAITING_DELAY_APPROVAL, restaurantName: 'Brand 1' } as unknown as Order;

function setup() {
  const onUpdateOrder = vi.fn();
  const showError = vi.fn();
  const hook = renderHook(() =>
    useLiveOrderActions({ order, onUpdateOrder, setInternalOrders: vi.fn(), showError }),
  );
  return { hook, onUpdateOrder, showError };
}

describe('useLiveOrderActions.answerDelay', () => {
  beforeEach(() => {
    post.mockReset().mockResolvedValue({});
    confirm.mockReset().mockResolvedValue(true);
  });

  // Declining publishes ORDER_DELAY_REJECTED; CustomerApplication's
  // AwaitingDelayApprovalState.handleDelayRejected settles the order as CANCELLED_BY_RESTAURANT.
  // The screen used to set CANCELLED, so the tracker said "This order was cancelled." until the
  // next refresh said "The restaurant could not fulfil this order." (backlog A9).
  it('shows the status the server settles on when the customer declines', async () => {
    const { hook, onUpdateOrder } = setup();
    await act(() => hook.result.current.answerDelay(false));
    expect(post).toHaveBeenCalledWith(
      '/api/v1/orders/:orderId/delay-approval',
      { approved: false },
      { params: { orderId: 'o1' } },
    );
    expect(onUpdateOrder).toHaveBeenCalledWith('o1', OrderStatus.CANCELLED_BY_RESTAURANT);
  });

  // Approving: the restaurant's PendingDelayState.handleDelayApproved re-accepts at once.
  it('moves to ACCEPTED when the customer agrees to wait, without asking first', async () => {
    const { hook, onUpdateOrder } = setup();
    await act(() => hook.result.current.answerDelay(true));
    expect(confirm).not.toHaveBeenCalled();
    expect(onUpdateOrder).toHaveBeenCalledWith('o1', OrderStatus.ACCEPTED);
  });

  it('changes nothing when the customer backs out of the confirm', async () => {
    confirm.mockResolvedValue(false);
    const { hook, onUpdateOrder } = setup();
    await act(() => hook.result.current.answerDelay(false));
    expect(post).not.toHaveBeenCalled();
    expect(onUpdateOrder).not.toHaveBeenCalled();
  });

  it('leaves the status alone and says why when the server refuses', async () => {
    post.mockRejectedValue({ response: { data: { message: 'Order is not awaiting delay approval' } } });
    const { hook, onUpdateOrder, showError } = setup();
    await act(() => hook.result.current.answerDelay(false));
    expect(onUpdateOrder).not.toHaveBeenCalled();
    expect(showError).toHaveBeenCalledWith('Order is not awaiting delay approval');
  });
});
