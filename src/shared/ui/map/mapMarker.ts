/**
 * The one map pin.
 *
 * Three map screens each built their own marker element by hand, with the depth written as
 * `shadow-lg shadow-rose-600/50` in a class string -- eleven of those across the three, and
 * every one of them a surface invented outside the system. A marker cannot be a `<Surface>`:
 * maplibre takes a raw `HTMLElement`, constructed before React sees it. So the pin is built
 * here instead, in the one place allowed to name a design token.
 *
 * The glyph colour is part of the tone, not a caller's choice: amber cannot carry white at
 * 4.5:1, which is why the customer pin reads dark.
 */

export type MapPinTone = 'restaurant' | 'rider' | 'rider-offline' | 'customer' | 'destination';

interface ToneStyle {
  background: string;
  ink: string;
}

const TONE: Record<MapPinTone, ToneStyle> = {
  restaurant: { background: 'var(--color-rose-600)', ink: '#ffffff' },
  rider: { background: 'var(--color-blue-600)', ink: '#ffffff' },
  'rider-offline': { background: 'var(--color-slate-400)', ink: '#ffffff' },
  customer: { background: 'var(--color-amber-500)', ink: 'var(--color-ink)' },
  // slate-700, not `--color-ink`: ink flips to white in dark mode and the pin would
  // disappear into its own glyph. A pin sits on map tiles, which do not follow the theme.
  destination: { background: 'var(--color-slate-700)', ink: '#ffffff' },
};

export interface MapPinOptions {
  tone: MapPinTone;
  /** 32 for a point of interest, 40 for the subject of the screen. */
  size?: 32 | 40;
  /** Inline SVG for the glyph. `currentColor` picks up the tone's ink. */
  icon: string;
  /** Extra classes the screen needs for its own behaviour, never for the surface. */
  className?: string;
}

export function createMapPin({ tone, size = 32, icon, className = '' }: MapPinOptions): HTMLDivElement {
  const { background, ink } = TONE[tone];
  const el = document.createElement('div');
  el.className = className;
  el.dataset.pinTone = tone;
  Object.assign(el.style, {
    width: `${size}px`,
    height: `${size}px`,
    background,
    color: ink,
    border: '2px solid var(--color-paper)',
    borderRadius: 'var(--radius-full)',
    boxShadow: 'var(--elevation-2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } satisfies Partial<CSSStyleDeclaration>);
  el.innerHTML = icon;
  return el;
}

/**
 * The label that floats above a pin -- a driver's name and the action on it.
 *
 * It is chrome over scrolling content, so it is the one marker part that is genuinely glass.
 * The screen that had it wrote `bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-xl`
 * into an innerHTML string, where neither the dark variant nor the token could reach it.
 */
export function createMapCallout(html: string, className = ''): HTMLDivElement {
  const el = document.createElement('div');
  el.className = className;
  Object.assign(el.style, {
    background: 'var(--glass-chrome-bg)',
    border: '1px solid var(--glass-chrome-line)',
    backdropFilter: 'var(--blur-chrome)',
    // Safari still needs the prefix, and CSSStyleDeclaration does not type it
    webkitBackdropFilter: 'var(--blur-chrome)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--elevation-3)',
    color: 'var(--color-ink)',
    padding: '6px 12px',
    marginBottom: '8px',
    minWidth: '100px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    pointerEvents: 'auto',
  } as Partial<CSSStyleDeclaration>);
  el.innerHTML = html;
  return el;
}
