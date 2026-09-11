/**
 * Ola Maps access goes through our own origin at /olamaps, which the API Gateway proxies to
 * api.olamaps.io after appending the API key. The key stays server-side; the browser never sees it.
 *
 * These URLs MUST be absolute. MapLibre loads tiles and glyphs from a Web Worker created from a
 * `blob:` URL, and a blob worker has no base URL to resolve a relative path against, so a relative
 * `/olamaps/...` fails there with "Failed to construct 'Request': Failed to parse URL". The style
 * document itself is fetched on the main thread, where a relative path does resolve -- so a relative
 * base looks like it works while every tile silently fails, which renders as a blank map.
 */

const OLA_UPSTREAM_ORIGIN = 'https://api.olamaps.io';

/** Absolute base for the gateway-proxied Ola Maps API, e.g. `http://localhost:3000/olamaps`. */
export function olaProxyBase(): string {
  return `${window.location.origin}/olamaps`;
}

/** Absolute URL of a MapLibre style document served through the gateway proxy. */
export function olaStyleUrl(styleId: string = 'default-light-standard'): string {
  return `${olaProxyBase()}/tiles/vector/v1/styles/${styleId}/style.json`;
}

/**
 * MapLibre `transformRequest`: rewrites the absolute api.olamaps.io URLs found inside a style
 * document (sources, sprite, glyphs and the tile templates they resolve to) onto the gateway proxy.
 */
export function transformOlaRequest(url: string): { url: string } {
  if (url.startsWith(OLA_UPSTREAM_ORIGIN)) {
    return { url: olaProxyBase() + url.slice(OLA_UPSTREAM_ORIGIN.length) };
  }
  return { url };
}
