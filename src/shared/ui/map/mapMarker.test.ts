import { describe, it, expect } from 'vitest';
import { createMapCallout, createMapPin, createMapPopupContent } from './mapMarker';

describe('createMapPin', () => {
  it('takes its depth and shape from the tokens, not from a class string', () => {
    // The three map screens wrote `shadow-lg shadow-rose-600/50` by hand. That is a surface
    // invented outside the system, which is exactly what the Phase 4 gate counts.
    const el = createMapPin({ tone: 'restaurant', icon: '<svg></svg>' });
    expect(el.style.boxShadow).toBe('var(--elevation-2)');
    expect(el.style.borderRadius).toBe('var(--radius-full)');
    expect(el.className).not.toMatch(/shadow-/);
  });

  it('gives the amber pin dark ink, because amber cannot carry white text', () => {
    expect(createMapPin({ tone: 'customer', icon: '' }).style.color).toBe('var(--color-ink)');
    expect(createMapPin({ tone: 'rider', icon: '' }).style.color).toBe('rgb(255, 255, 255)');
  });

  it('carries the caller classes and the glyph through untouched', () => {
    const el = createMapPin({ tone: 'rider', size: 40, icon: '<svg id="g"></svg>', className: 'fleet-marker cursor-pointer' });
    expect(el.className).toBe('fleet-marker cursor-pointer');
    expect(el.style.width).toBe('40px');
    expect(el.querySelector('#g')).not.toBeNull();
    expect(el.dataset.pinTone).toBe('rider');
  });

  it('makes the callout glass, which is the one part of a marker that floats', () => {
    const name = document.createElement('span');
    name.id = 'n';
    name.textContent = 'Driver';
    const el = createMapCallout([name]);
    expect(el.style.backdropFilter).toBe('var(--blur-chrome)');
    expect(el.style.background).toBe('var(--glass-chrome-bg)');
    expect(el.querySelector('#n')?.textContent).toBe('Driver');
  });

  it('renders external popup values as text rather than markup', () => {
    const payload = '<img src=x onerror="window.__mapPopupXss = true">';
    const el = createMapPopupContent([{ label: 'Customer:', value: payload }]);

    expect(el.textContent).toBe(`Customer: ${payload}`);
    expect(el.querySelector('img')).toBeNull();
  });

  it('removes executable elements and attributes from an icon string before mounting it', () => {
    const el = createMapPin({
      tone: 'restaurant',
      icon: '<svg><path d="M0 0"/><script>window.__mapPinXss = true</script><image onerror="window.__mapPinXss = true"/></svg>',
    });

    expect(el.querySelector('path')).not.toBeNull();
    expect(el.querySelector('script, image, [onerror]')).toBeNull();
  });
});
