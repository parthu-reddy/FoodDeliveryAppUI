import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Order } from '@/types';
import { OrderStatus } from '@/types/backend-enums';

vi.mock('@/contexts/CallContext', () => ({ useCallContext: () => ({ startCall: () => {} }) }));
vi.mock('@features/maps-tracking/components/OrderTrackingMap', () => ({ default: () => <div data-testid="live-map" /> }));
vi.mock('./OrderTrackerLive', () => ({ OrderTrackerLive: () => <div data-testid="order-tracker" /> }));

import { CustomerLiveOrderRail } from './CustomerLiveOrderRail';

function setWidth(wide: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: wide, media: query, addEventListener: () => {}, removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
}

const order = { id: 'ord-12345678', status: OrderStatus.PREPARING } as Order;
const props = { order, setInternalOrders: () => {}, setTrackingOrder: () => {}, showError: () => {} };

describe('CustomerLiveOrderRail', () => {
  const original = window.matchMedia;
  afterEach(() => { window.matchMedia = original; });

  it('mounts nothing below 1280 -- no second tracker, map or live stream behind the main column', () => {
    setWidth(false);
    const { container } = render(<CustomerLiveOrderRail {...props} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the order beside the menu on a wide screen', async () => {
    setWidth(true);
    render(<CustomerLiveOrderRail {...props} />);
    expect(screen.getByRole('complementary', { name: 'Live order' })).toBeInTheDocument();
    expect(await screen.findByTestId('live-map')).toBeInTheDocument();
  });
});
