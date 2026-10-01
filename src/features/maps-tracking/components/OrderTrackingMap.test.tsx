import { useEffect, useRef, type ReactNode } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FetchEventSourceInit } from '@microsoft/fetch-event-source';
import type { Order } from '@/types';
const wire = vi.hoisted(() => ({ fetch: vi.fn(), get: vi.fn(), moves: [] as number[][] }));
vi.mock('@microsoft/fetch-event-source', () => ({ fetchEventSource: wire.fetch }));
vi.mock('@/lib/tokenStore', () => ({ getToken: () => 'test-token' }));
vi.mock('@/lib/zodiosClients', () => ({ restaurantApi: { restaurantOutlet: { get: wire.get } } }));
vi.mock('@/contexts/ConfigContext', () => ({ useConfig: () => ({}) }));
vi.mock('@features/maps-tracking/model/placeOrderMap', () => ({ placePins: vi.fn(), drawRoute: vi.fn() }));
vi.mock('@features/maps-tracking/model/smoothPosition', () => ({
  createSmoothMover: (apply: (point: [number, number]) => void) => ({ moveTo: apply, cancel: vi.fn() }),
}));
vi.mock('../model/maplibre', () => ({ maplibre: { Marker: class {
  element: HTMLElement;
  position?: number[];
  constructor({ element }: { element: HTMLElement }) { this.element = element; }
  setLngLat(point: number[]) { this.position = point; wire.moves.push(point); return this; }
  getElement() { return this.element; }
  addTo(map: { container: HTMLElement }) { if (!this.position) throw new Error('MapLibre requires coordinates before attaching a marker'); map.container.appendChild(this.element); return this; }
} } }));
vi.mock('./MapPanel', () => ({
  MapPanel: function MockMapPanel({ onReady, children }: { onReady: (map: unknown) => (() => void) | void; children: ReactNode }) {
    const container = useRef<HTMLDivElement>(null);
    useEffect(() => {
      const cleanup = onReady({ container: container.current });
      return () => { if (typeof cleanup === 'function') cleanup(); };
      // Model the actual wrapper's once-per-mount map lifetime.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return <div><div ref={container} />{children}</div>;
  },
}));
import OrderTrackingMap from './OrderTrackingMap';
const order = { id: 'order-one', restaurantId: 'outlet-one', deliveryLat: 12.97, deliveryLng: 77.64 } as Order;
const stream = (index = 0) => wire.fetch.mock.calls[index][1] as FetchEventSourceInit;
const message = (lat: number, lng: number) => ({ event: 'location-update', id: '', data: JSON.stringify({ lat, lng }) });
beforeEach(() => {
  wire.fetch.mockReset().mockResolvedValue(undefined); wire.get.mockReset().mockResolvedValue({ data: { lat: 12.98, lng: 77.63 } }); wire.moves.length = 0;
});

describe('owned live map stream', () => {
  it('aborts the old stream and binds the next owned order when selection changes', async () => {
    const { rerender } = render(<OrderTrackingMap order={order} enableLiveTracking />);
    await waitFor(() => expect(wire.fetch).toHaveBeenCalledTimes(1));
    const first = stream();
    rerender(<OrderTrackingMap order={{ ...order, id: 'order-two', restaurantId: 'outlet-two' }} enableLiveTracking />);
    await waitFor(() => expect(wire.fetch).toHaveBeenCalledTimes(2));
    expect(first.signal!.aborted).toBe(true);
    expect(wire.fetch.mock.calls[1][0]).toContain('/orders/order-two/live-tracking');
    act(() => first.onmessage!(message(12, 77)));
    expect(wire.moves).toHaveLength(0);
  });
  it('starts and stops the stream when its live-view mode changes', async () => {
    const { rerender } = render(<OrderTrackingMap order={order} />);
    expect(wire.fetch).not.toHaveBeenCalled();
    rerender(<OrderTrackingMap order={order} enableLiveTracking />);
    await waitFor(() => expect(wire.fetch).toHaveBeenCalledOnce());
    const active = stream(); rerender(<OrderTrackingMap order={order} />);
    expect(active.signal!.aborted).toBe(true);
  });
  it.each([{ lat: 0, lng: 10 }, { lat: 10, lng: 0 }])('renders valid axis coordinates $lat/$lng', ({ lat, lng }) => {
    render(<OrderTrackingMap order={order} enableLiveTracking />);
    act(() => stream().onmessage!(message(lat, lng)));
    expect(wire.moves).toContainEqual([lng, lat]);
    const marker = screen.getByRole('img', { name: 'Courier location' });
    expect(marker).toHaveAttribute('data-lat', String(lat));
    expect(marker).toHaveAttribute('data-lng', String(lng));
  });
  it.each([{ lat: 91, lng: 10 }, { lat: 10, lng: 181 }, { lat: 0, lng: 0 }])('does not plot invalid/unset coordinates $lat/$lng', ({ lat, lng }) => {
    render(<OrderTrackingMap order={order} enableLiveTracking />);
    act(() => stream().onmessage!(message(lat, lng)));
    expect(wire.moves).toHaveLength(0);
  });
  it('rejects a transient HTTP failure so the stream library can reconnect', async () => {
    render(<OrderTrackingMap order={order} enableLiveTracking />);
    await expect(stream().onopen!(new Response('', { status: 503 }))).rejects.toThrow();
  });
  it('rejects an HTTP200 JSON response instead of claiming it is a live stream', async () => {
    render(<OrderTrackingMap order={order} enableLiveTracking />);
    await expect(stream().onopen!(new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }))).rejects.toThrow();
  });
  it('accepts the event-stream content type and aborts on unmount', async () => {
    const { unmount } = render(<OrderTrackingMap order={order} enableLiveTracking />);
    await act(async () => { await stream().onopen!(new Response('', { status: 200, headers: { 'content-type': 'text/event-stream; charset=utf-8' } })); });
    const active = stream(); unmount(); expect(active.signal!.aborted).toBe(true);
  });
  it('updates the same rendered courier marker on the next location event', () => {
    render(<OrderTrackingMap order={order} enableLiveTracking />);
    act(() => stream().onmessage!(message(12.97, 77.64)));
    const marker = screen.getByRole('img', { name: 'Courier location' });
    act(() => stream().onmessage!(message(12.971, 77.641)));
    expect(screen.getAllByRole('img', { name: 'Courier location' })).toHaveLength(1);
    expect(marker).toHaveAttribute('data-lat', '12.971');
    expect(marker).toHaveAttribute('data-lng', '77.641');
  });
  it('exposes reconnecting after EOF and resets retry backoff after reconnection', async () => {
    render(<OrderTrackingMap order={order} enableLiveTracking />);
    await act(async () => { await stream().onopen!(new Response('', { headers: { 'content-type': 'text/event-stream' } })); });
    expect(() => stream().onclose!()).toThrow('closed');
    act(() => { expect(stream().onerror!(new Error('closed'))).toBe(1000); });
    expect(screen.getByRole('status')).toHaveTextContent('Reconnecting');
    act(() => { expect(stream().onerror!(new Error('network'))).toBe(2000); });
    await act(async () => { await stream().onopen!(new Response('', { headers: { 'content-type': 'text/event-stream' } })); });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    act(() => { expect(stream().onerror!(new Error('network'))).toBe(1000); });
  });
  it('stops retrying a denied stream and consumes its rejected promise', async () => {
    wire.fetch.mockRejectedValueOnce(new Error('refused'));
    render(<OrderTrackingMap order={order} enableLiveTracking />);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Live location unavailable'));
    let denied: unknown;
    try { await stream().onopen!(new Response('', { status: 403 })); } catch (error) { denied = error; }
    expect(denied).toBeInstanceOf(Error);
    expect(() => stream().onerror!(denied)).toThrow('refused');
    expect(wire.fetch).toHaveBeenCalledOnce();
  });

});
