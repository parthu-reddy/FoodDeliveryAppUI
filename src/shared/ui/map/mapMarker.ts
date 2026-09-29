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

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const SAFE_SVG_ELEMENTS = new Set(['svg', 'path', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'rect', 'g']);
const SAFE_SVG_ATTRIBUTES = new Set([
  'aria-hidden', 'class', 'clip-rule', 'cx', 'cy', 'd', 'fill', 'fill-rule', 'focusable',
  'height', 'id', 'points', 'r', 'rx', 'ry', 'stroke', 'stroke-linecap', 'stroke-linejoin',
  'stroke-width', 'transform', 'viewBox', 'width', 'x', 'x1', 'x2', 'y', 'y1', 'y2', 'xmlns',
]);

/**
 * Map pins are raw DOM because MapLibre owns their lifecycle. The existing icons are source
 * literals, but this keeps the helper safe if a future caller accidentally forwards data into
 * `icon`: only a small SVG allowlist is copied into the live document.
 */
function createSafeSvgIcon(icon: string): SVGElement | null {
  const source = new DOMParser().parseFromString(icon, 'image/svg+xml').documentElement;

  const copy = (node: Element): SVGElement | null => {
    const tagName = node.localName?.toLowerCase();
    if (!tagName || !SAFE_SVG_ELEMENTS.has(tagName)) return null;

    const safeNode = document.createElementNS(SVG_NAMESPACE, tagName);
    for (const attribute of Array.from(node.attributes)) {
      if (SAFE_SVG_ATTRIBUTES.has(attribute.name)) {
        safeNode.setAttribute(attribute.name, attribute.value);
      }
    }
    for (const child of Array.from(node.children)) {
      const safeChild = copy(child);
      if (safeChild) safeNode.appendChild(safeChild);
    }
    return safeNode;
  };

  return copy(source);
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
  const safeIcon = createSafeSvgIcon(icon);
  if (safeIcon) el.appendChild(safeIcon);
  return el;
}

/**
 * The label that floats above a pin -- a driver's name and the action on it.
 *
 * It is chrome over scrolling content, so it is the one marker part that is genuinely glass.
 * Its children are DOM nodes rather than an HTML string. Driver names originate outside the
 * admin UI, so accepting markup here would turn a marker callout into an injection sink.
 */
export function createMapCallout(children: readonly Node[] = [], className = ''): HTMLDivElement {
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
  el.replaceChildren(...children);
  return el;
}

export interface MapPopupLine {
  /** Text placed in a bold label before the value, for example `Rider:`. */
  label?: string;
  /** Untrusted values are always written as text nodes. */
  value: string;
  /** Emphasise a value when the popup has no separate label. */
  strong?: boolean;
}

/**
 * Builds a MapLibre popup body without parsing string HTML. MapLibre's `setHTML` accepts markup
 * verbatim, so all API supplied values must arrive here as text nodes instead.
 */
export function createMapPopupContent(lines: readonly MapPopupLine[]): HTMLDivElement {
  const el = document.createElement('div');

  lines.forEach((line, index) => {
    if (index > 0) el.appendChild(document.createElement('br'));

    if (line.label) {
      const label = document.createElement('strong');
      label.textContent = line.label;
      el.appendChild(label);
      el.appendChild(document.createTextNode(' '));
    }

    if (line.strong) {
      const value = document.createElement('strong');
      value.textContent = line.value;
      el.appendChild(value);
    } else {
      el.appendChild(document.createTextNode(line.value));
    }
  });

  return el;
}
