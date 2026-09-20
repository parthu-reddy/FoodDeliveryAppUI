import { describe, expect, it } from 'vitest';
import { olaProxyBase, olaStyleUrl, transformOlaRequest } from './olaMaps';

/**
 * MapLibre fetches tiles and glyphs from a Web Worker created from a `blob:` URL, which has no base
 * URL to resolve a relative path against. A relative `/olamaps/...` therefore fails in the worker
 * with "Failed to construct 'Request': Failed to parse URL" while the style document -- fetched on
 * the main thread -- still loads. That combination renders as a blank map, so these tests pin the
 * URLs as absolute rather than merely "starting with /olamaps".
 */
describe('olaMaps proxy URLs', () => {
  const isAbsolute = (u: string) => {
    // The check the blob worker effectively performs: parse with no base.
    expect(() => new URL(u)).not.toThrow();
    return /^https?:\/\//.test(u);
  };

  it('olaProxyBase is absolute and points at our own origin', () => {
    const base = olaProxyBase();
    expect(isAbsolute(base)).toBe(true);
    expect(base).toBe(`${window.location.origin}/olamaps`);
  });

  it('olaStyleUrl is absolute and resolvable without a base', () => {
    const url = olaStyleUrl();
    expect(isAbsolute(url)).toBe(true);
    expect(url).toBe(`${window.location.origin}/olamaps/tiles/vector/v1/styles/default-light-standard/style.json?cb=2`);
  });

  it('olaStyleUrl honours a non-default style id', () => {
    expect(olaStyleUrl('default-dark-standard')).toBe(
      `${window.location.origin}/olamaps/tiles/vector/v1/styles/default-dark-standard/style.json?cb=2`,
    );
  });

  it('rewrites upstream tile URLs onto the proxy, absolutely', () => {
    const { url } = transformOlaRequest('https://api.olamaps.io/tiles/vector/v1/data/planet/12/2925/1789.pbf');
    expect(isAbsolute(url)).toBe(true);
    expect(url).toBe(`${window.location.origin}/olamaps/tiles/vector/v1/data/planet/12/2925/1789.pbf?cb=2`);
  });

  it('rewrites glyph and sprite URLs, preserving the path and query', () => {
    expect(transformOlaRequest('https://api.olamaps.io/tiles/vector/v1/fonts/Gentona%20Medium/0-255.pbf').url)
      .toBe(`${window.location.origin}/olamaps/tiles/vector/v1/fonts/Gentona%20Medium/0-255.pbf?cb=2`);
    expect(transformOlaRequest('https://api.olamaps.io/places/v1/details?place_id=abc').url)
      .toBe(`${window.location.origin}/olamaps/places/v1/details?place_id=abc&cb=2`);
  });

  it('leaves non-Ola URLs untouched', () => {
    const other = 'https://example.com/tiles/1.png';
    expect(transformOlaRequest(other)).toEqual({ url: other });
  });

  it('never returns a bare API key in the URL', () => {
    // The gateway appends api_key server-side; nothing the browser builds may carry one.
    expect(transformOlaRequest('https://api.olamaps.io/tiles/vector/v1/data/planet.json').url)
      .not.toMatch(/api_key/);
    expect(olaStyleUrl()).not.toMatch(/api_key/);
  });
});
