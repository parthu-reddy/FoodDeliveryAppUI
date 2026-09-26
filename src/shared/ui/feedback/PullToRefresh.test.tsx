import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PullToRefresh } from './PullToRefresh';

const reducedMotion = vi.hoisted(() => ({ value: false }));
vi.mock('motion/react', () => ({ useReducedMotion: () => reducedMotion.value }));

const indicator = () => document.querySelector('[data-pull-indicator]') as HTMLElement;
const scroller = () => screen.getByText('content').parentElement!.parentElement!;

describe('PullToRefresh', () => {
  it('tracks the drag 1:1 rather than animating its own arrival', () => {
    // The plan's requirement. An indicator that does not follow the finger is a spinner
    // that appeared on its own, and the gesture gives no feedback until it completes.
    render(<PullToRefresh onRefresh={() => {}}><div>content</div></PullToRefresh>);
    fireEvent.pointerDown(scroller(), { clientY: 0 });
    fireEvent.pointerMove(scroller(), { clientY: 40 });
    expect(indicator().style.transform).toBe('translateY(-24px)');
    // While the finger is down nothing is animated — the transform IS the finger.
    expect(indicator().style.transitionProperty).toBe('none');
  });

  it('gets heavy past the trigger instead of running away with the finger', () => {
    render(<PullToRefresh onRefresh={() => {}}><div>content</div></PullToRefresh>);
    fireEvent.pointerDown(scroller(), { clientY: 0 });
    fireEvent.pointerMove(scroller(), { clientY: 200 });
    const travelled = Number(indicator().style.transform.match(/-?[\d.]+/)![0]) + 64;
    expect(travelled).toBeLessThanOrEqual(96);
    expect(travelled).toBeGreaterThan(64);
  });

  it('refreshes only when the pull passed the trigger', async () => {
    const onRefresh = vi.fn();
    render(<PullToRefresh onRefresh={onRefresh}><div>content</div></PullToRefresh>);

    fireEvent.pointerDown(scroller(), { clientY: 0 });
    fireEvent.pointerMove(scroller(), { clientY: 20 });
    fireEvent.pointerUp(scroller());
    expect(onRefresh).not.toHaveBeenCalled();

    fireEvent.pointerDown(scroller(), { clientY: 0 });
    fireEvent.pointerMove(scroller(), { clientY: 80 });
    fireEvent.pointerUp(scroller());
    await waitFor(() => expect(onRefresh).toHaveBeenCalledTimes(1));
  });

  it('announces the state it is in', async () => {
    render(<PullToRefresh onRefresh={() => {}}><div>content</div></PullToRefresh>);
    fireEvent.pointerDown(scroller(), { clientY: 0 });
    fireEvent.pointerMove(scroller(), { clientY: 80 });
    expect(screen.getByRole('status', { name: 'Release to refresh' })).toBeInTheDocument();
  });

  it('snaps back without animating under reduced motion, and still refreshes', async () => {
    // The drag itself is direct manipulation and stays 1:1; what reduced motion removes is
    // the animated snap back once the finger lifts.
    reducedMotion.value = true;
    const onRefresh = vi.fn();
    render(<PullToRefresh onRefresh={onRefresh}><div>content</div></PullToRefresh>);
    fireEvent.pointerDown(scroller(), { clientY: 0 });
    fireEvent.pointerMove(scroller(), { clientY: 80 });
    fireEvent.pointerUp(scroller());
    await waitFor(() => expect(onRefresh).toHaveBeenCalled());
    expect(indicator().style.transitionDuration).toBe('0s');
    reducedMotion.value = false;
  });

  // Inside a page that scrolls (Account Settings), the list's own box never scrolls -- its
  // parent does. Checking only its own scrollTop, the pull armed with the list scrolled halfway
  // down, and a downward drag reloaded instead of scrolling back up.
  it('does not start a pull while the page around it is scrolled', async () => {
    const onRefresh = vi.fn();
    render(
      <div data-testid="page" style={{ overflowY: 'auto' }}>
        <PullToRefresh onRefresh={onRefresh}><div>content</div></PullToRefresh>
      </div>,
    );
    const page = screen.getByTestId('page');
    Object.defineProperty(page, 'scrollHeight', { configurable: true, value: 1000 });
    Object.defineProperty(page, 'clientHeight', { configurable: true, value: 400 });
    page.scrollTop = 200;

    fireEvent.pointerDown(scroller(), { clientY: 0 });
    fireEvent.pointerMove(scroller(), { clientY: 80 });
    fireEvent.pointerUp(scroller());
    expect(indicator().style.transform).toBe('translateY(-64px)');
    expect(onRefresh).not.toHaveBeenCalled();

    // Back at the top of the page, the same pull refreshes.
    page.scrollTop = 0;
    fireEvent.pointerDown(scroller(), { clientY: 0 });
    fireEvent.pointerMove(scroller(), { clientY: 80 });
    fireEvent.pointerUp(scroller());
    await waitFor(() => expect(onRefresh).toHaveBeenCalledTimes(1));
  });
});
