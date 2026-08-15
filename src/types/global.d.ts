import * as maplibregl from 'maplibre-gl';

declare global {
  interface Window {
    maplibregl: typeof maplibregl;
  }
}

// This export is necessary to make the file a module
export {};
