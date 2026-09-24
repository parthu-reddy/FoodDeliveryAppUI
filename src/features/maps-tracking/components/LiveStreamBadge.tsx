export type LiveStreamState = 'connecting' | 'live' | 'reconnecting' | 'unavailable';

/**
 * What the live-location stream is doing, as a label on the map. It replaced error toasts
 * that stacked one per failed attempt over the whole screen. Renders nothing once live --
 * the moving rider says that.
 */
export function LiveStreamBadge({ state }: { state: LiveStreamState }) {
  if (state === 'live') return null;
  return (
    <span
      role="status"
      className="absolute top-2 left-2 z-10 px-2.5 py-1 rounded-full text-[11px] font-bold"
      style={{ background: 'var(--color-paper)', color: 'var(--color-ink-2)', border: '1px solid var(--color-paper-line)' }}
    >
      {state === 'unavailable' ? 'Live location unavailable' : state === 'reconnecting' ? 'Reconnecting…' : 'Connecting…'}
    </span>
  );
}
