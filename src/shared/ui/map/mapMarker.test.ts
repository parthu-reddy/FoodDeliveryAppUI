import { describe, it, expect } from 'vitest';
import { createMapCallout, createMapPin } from './mapMarker';

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
    const el = createMapCallout('<span id="n">Driver</span>');
    expect(el.style.backdropFilter).toBe('var(--blur-chrome)');
    expect(el.style.background).toBe('var(--glass-chrome-bg)');
    expect(el.querySelector('#n')?.textContent).toBe('Driver');
  });
});
