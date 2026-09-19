import React from 'react';
import { SPECIALS } from '../model/specials';

/**
 * The legal line and the rotating "today's special" marker under the login form.
 *
 * The rotation used to index a six-item array of Unsplash URLs that nothing rendered — the
 * array existed solely to supply the number 6 to a modulo. The names are the data; the images
 * are gone.
 */

export function LoginFooter({ specialIndex }: { specialIndex: number }) {
  return (
    <div className="shrink-0 text-center space-y-1 sm:space-y-1.5 w-full max-w-7xl mx-auto px-4 sm:px-8 pb-4">
      <p className="text-[9.5px] sm:text-[10px]" style={{ color: 'var(--color-ink-3)' }}>
        By continuing, you agree to our terms &amp; instant delivery guidelines.
      </p>
      <div
        className="flex items-center justify-center gap-3 text-[9px] sm:text-[10px] font-mono"
        style={{ color: 'var(--color-ink-3)' }}
      >
        <span>SECURE END-TO-END</span>
        <span>&bull;</span>
        <span>BIOMETRIC READY</span>
      </div>
      <div
        className="flex items-center justify-center gap-1.5 mt-1 sm:mt-2 text-[9px] font-mono tracking-wider font-semibold px-2 py-0.5 w-fit mx-auto rounded-full"
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
