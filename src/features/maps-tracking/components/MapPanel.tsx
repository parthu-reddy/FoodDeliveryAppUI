import React, { useEffect, useRef } from 'react';
import { olaStyleUrl, transformOlaRequest } from '@/lib/olaMaps';
import { maplibre, type MapInstance } from '../model/maplibre';

/**
 * The one MapLibre wrapper.
 *
 * Six screens each constructed their own `new maplibregl.Map`, each importing the package and
 * its stylesheet, each repeating `style: olaStyleUrl()`, `transformRequest: transformOlaRequest`
 * and `attributionControl: false`, and each writing its own teardown. Two of them also assigned
 * `window.maplibregl` as a side effect of being imported. Any change to how this app talks to
 * Ola — the proxy base, a style id, a transform — had to be made in six places or it was made in
 * one and the other five silently kept the old behaviour.
 *
 * Markers, popups, sources and layers stay with the caller: those are what each screen is
 * actually about. `onReady` hands over the live map and takes a cleanup back, so a caller adds
 * what it needs and removes it without owning the map's lifetime.
 */

interface MapPanelProps {
  /** [lng, lat] — MapLibre's order, not the [lat, lng] most of this codebase uses. */
  center: [number, number];
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  /** False for a map that is a picture: pan and zoom off, controls off. */
  interactive?: boolean;
  navigation?: boolean;
  /** Names the map region for assistive technology. */
  label: string;
  className?: string;
  style?: React.CSSProperties;
  /**
   * Runs once the map is constructed. Return a function to undo whatever it added; it runs
   * before the map is removed.
   */
  onReady?: (map: MapInstance) => void | (() => void);
  /** Overlays drawn above the canvas — a recentre button, a centre pin, a legend. */
  children?: React.ReactNode;
}

export function MapPanel({
  center,
  zoom = 12,
  minZoom,
  maxZoom,
  interactive = true,
  navigation = false,
  label,
  className = '',
  style,
  onReady,
  children,
}: MapPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = new maplibre.Map({
      container,
      style: olaStyleUrl(),
      center,
      zoom,
      minZoom,
      maxZoom,
      interactive,
      attributionControl: false,
      transformRequest: transformOlaRequest,
    });

    if (navigation) map.addControl(new maplibre.NavigationControl(), 'top-right');

    const cleanup = onReady?.(map);

    return () => {
      // Every previous copy of this teardown removed the map; none of them removed what the
      // screen had added to it first, so a re-mount re-registered handlers on a dead map.
      if (typeof cleanup === 'function') cleanup();
      map.remove();
    };
    // The map is built once per mount. Moving the camera afterwards is the caller's job,
    // through the instance it was handed: rebuilding it on every prop change would throw
    // away tiles, markers and the user's own pan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`relative ${className}`} style={style}>
      <div ref={containerRef} role="region" aria-label={label} className="absolute inset-0" />
      {children}
    </div>
  );
}
