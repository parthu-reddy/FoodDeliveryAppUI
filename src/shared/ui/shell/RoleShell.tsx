import React from 'react';
import { Surface } from '../surface/Surface';

/**
 * The frame every role screen sits in.
 *
 * Its whole reason for existing is that **safe-area insets were handled in 1 file of 188**.
 * On a notched phone every other screen ran its content under the status bar and its bottom
 * bar under the home indicator. Solving that per screen is how it stayed unsolved: it is
 * solved here, once, and the Phase 4 gate fails if `env(safe-area-inset-*)` appears anywhere
 * else.
 *
 * Glass is a LAYER ROLE. The header, the nav and the action bar float over scrolling content,
 * so they are glass; the content region is not. That distinction is what the gate's check 5
 * enforces, and it is why this component owns the chrome rather than leaving each screen to
 * decide.
 */

export type NavPlacement = 'bottom' | 'side';

interface RoleShellProps {
  /** Sticky chrome at the top. Sits under the status bar, never behind it. */
  header?: React.ReactNode;
  /** Primary navigation. `bottom` is a phone tab bar; `side` becomes a sidebar from `lg:`. */
  nav?: React.ReactNode;
  navPlacement?: NavPlacement;
  /** Pinned bottom bar: checkout, swipe-to-confirm, bulk actions. */
  actionBar?: React.ReactNode;
  /** The live-order strip, floating just above the bottom chrome. */
  live?: React.ReactNode;
  /** Forces the dark scheme regardless of preference — the rider reads this in sunlight. */
  dark?: boolean;
  /** Names the main region for assistive technology. */
  label: string;
  /**
   * Scroll offset of the content region, in pixels.
   *
   * The shell owns the scroll container, so it is the only thing that can report this.
   * Without it a screen wanting a collapsing header has to create its own scroller inside
   * the shell's, which is how `LoginScreen` ended up with a second one.
   */
  onScroll?: (scrollTop: number) => void;
  children: React.ReactNode;
  className?: string;
}

// The insets, in one place. `env()` falls back to 0px on anything without a notch, so these
// are safe on desktop.
//
// The `calc()` wrapper is deliberate twice over. Chrome needs its OWN padding as well as the
// inset — a header flush against the status bar is as wrong as one under it — so the sum is
// what you actually want. It also happens to be the only form a DOM test can read back:
// jsdom discards a bare `env(...)` as an invalid value (verified: `paddingTop` came back
// empty) but keeps anything inside a `calc()`, which it does not parse. A shell whose insets
// cannot be asserted is a shell whose one job is untested.
const inset = (own: string, side: 'top' | 'bottom' | 'left' | 'right') =>
  `calc(${own} + env(safe-area-inset-${side}, 0px))`;

const INSET = {
  top: inset('0.5rem', 'top'),
  bottom: inset('0.5rem', 'bottom'),
  left: inset('0px', 'left'),
  right: inset('0px', 'right'),
  /** The scroll region gets the bare inset: it has its own padding from the screen inside. */
  scrollBottom: inset('0px', 'bottom'),
};

export function RoleShell({
  header,
  nav,
  navPlacement = 'bottom',
  actionBar,
  live,
  dark = false,
  label,
  onScroll,
  children,
  className = '',
}: RoleShellProps) {
  const side = navPlacement === 'side';

  return (
    <div
      data-role-shell
      data-nav={navPlacement}
      className={`flex flex-col h-full min-h-0 w-full overflow-hidden ${dark ? 'dark' : ''} ${className}`}
      style={{ paddingLeft: INSET.left, paddingRight: INSET.right }}
    >
      {header && (
        <Surface
          as="header"
          variant="glass-chrome"
          radius="none"
          elevation={2}
          className="shrink-0 z-30 p-0"
          style={{ paddingTop: INSET.top }}
        >
          {header}
        </Surface>
      )}

      <div className={`flex-1 flex min-h-0 ${side ? 'lg:flex-row' : 'flex-col'}`}>
        {side && nav && (
          <Surface
            as="nav"
            variant="glass-chrome"
            radius="none"
            elevation={1}
            className="hidden lg:flex lg:flex-col lg:w-60 lg:shrink-0 lg:overflow-y-auto p-0"
            style={{ paddingTop: header ? undefined : INSET.top, paddingBottom: INSET.bottom }}
          >
            {nav}
          </Surface>
        )}

        <main
          aria-label={label}
          onScroll={onScroll ? (e) => onScroll(e.currentTarget.scrollTop) : undefined}
          className="flex-1 min-w-0 min-h-0 overflow-y-auto overscroll-contain"
          style={{
            // Only the scroll region pads for the home indicator, and only when nothing
            // else is pinned below it — otherwise the bar underneath owns that space.
            paddingBottom: nav || actionBar ? undefined : INSET.scrollBottom,
          }}
        >
          {children}
        </main>
      </div>

      {live && <div className="shrink-0 px-4 pb-2 z-20">{live}</div>}

      {actionBar && (
        <Surface
          as="footer"
          variant="glass-chrome"
          radius="none"
          elevation={3}
          className="shrink-0 z-30 p-0"
          style={{ paddingBottom: INSET.bottom }}
        >
          {actionBar}
        </Surface>
      )}

      {nav && (
        <Surface
          as="nav"
          variant="glass-chrome"
          radius="none"
          elevation={3}
          className={`shrink-0 z-30 p-0 ${side ? 'lg:hidden' : ''}`}
          style={{ paddingBottom: actionBar ? undefined : INSET.bottom }}
        >
          {nav}
        </Surface>
      )}
    </div>
  );
}
