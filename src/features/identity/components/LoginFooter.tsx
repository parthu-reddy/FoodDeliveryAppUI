import React from 'react';
import { SPECIALS } from '../model/specials';

/**
 * The legal line and the rotating "today's special" marker under the login form.
 *
 * The rotation used to index a six-item array of Unsplash URLs that nothing rendered — the
 * array existed solely to supply the number 6 to a modulo. The names are the data; the images
 * are gone.
 *
 * These two lines are the only text in the app that sits DIRECTLY on the sign-in hero rather
 * than inside a `Surface`, so they are the one place that has to be coloured for that ground.
 * They were `--color-ink-3` at 9.5px: ink-3 is documented in the token block as large text and
 * icons ONLY (3.97:1 on paper), so that was a contrast failure at any size and a bad one at
 * 9.5px. They are now paper-derived, which is what the dark scrim in
 * `CinematicFoodBackground` needs, and 11px, which is a size a person can actually read.
 */

export function LoginFooter({ specialIndex }: { specialIndex: number }) {
  return (
    <div className="shrink-0 text-center space-y-1 sm:space-y-1.5 w-full max-w-7xl mx-auto px-4 sm:px-8 pb-4">
      <p
        className="text-[11px] sm:text-[12px] text-slate-500 dark:text-slate-400"
      >
        By continuing, you agree to our terms &amp; instant delivery guidelines.
      </p>
      <div
        className="flex items-center justify-center gap-3 text-[11px] sm:text-[12px] font-mono tracking-wide text-slate-500 dark:text-slate-400"
      >
        <span>SECURE END-TO-END</span>
        <span>&bull;</span>
        <span>BIOMETRIC READY</span>
      </div>
      <div
        className="flex items-center justify-center gap-1.5 mt-1.5 sm:mt-2.5 text-[10px] font-mono tracking-wider font-semibold px-2 py-0.5 w-fit mx-auto rounded-full"
        style={{
          color: 'var(--color-warning)',
          background: 'var(--color-warning-bg)',
          border: '1px solid var(--color-warning-line)',
        }}
      >
        <span
          className="w-1 h-1 rounded-full animate-pulse"
          style={{ background: 'var(--color-warning)' }}
        />
        <span>TODAY&rsquo;S SPECIAL: {SPECIALS[specialIndex].toUpperCase()}</span>
      </div>
    </div>
  );
}
