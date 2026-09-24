import { useEffect, useState } from 'react';
import { ACCEPT_WINDOW_MS, formatCountdown } from '../model/acceptDeadline';

/**
 * The accept clock from `Restaurant.dc.html`: the time left before an unaccepted order is
 * cancelled for the kitchen. It is the screen's loudest element on purpose -- a slow accept
 * is a late order, and a missed one is a lost one.
 *
 * The ring drains by `stroke-dashoffset` (paint only, no layout). It is ink until the last two
 * minutes and danger-red inside them, so urgency is a change you can see, not a constant. At zero it says what happens, rather than showing 0:00 and nothing else.
 */
export function AcceptClock({ deadline, size = 96 }: { deadline: number; size?: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const left = deadline - now;
  const expired = left <= 0;
  const urgent = left < 2 * 60_000;
  const fraction = Math.min(1, Math.max(0, left / ACCEPT_WINDOW_MS));
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  const tone = urgent ? 'var(--color-danger)' : 'var(--color-ink)';

  return (
    <span
      role="timer"
      aria-label={expired ? 'Accept window has closed' : `${formatCountdown(left)} left to accept`}
      className="relative shrink-0 inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-paper-line)" strokeWidth={6} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={tone} strokeWidth={6} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - fraction)}
          style={{ transitionProperty: 'stroke-dashoffset', transitionDuration: '1s', transitionTimingFunction: 'linear' }}
        />
      </svg>
      <span className="relative flex flex-col items-center leading-none">
        {expired ? (
          <span className="px-2 text-center text-[10px] font-extrabold uppercase" style={{ color: 'var(--color-danger)' }}>
            Cancelling
          </span>
        ) : (
          <>
            <span className="font-mono font-bold text-[22px]" style={{ color: tone }}>{formatCountdown(left)}</span>
            <span className="mt-1 font-mono text-[8px] font-bold tracking-wider text-ink-2">TO ACCEPT</span>
          </>
        )}
      </span>
    </span>
  );
}
