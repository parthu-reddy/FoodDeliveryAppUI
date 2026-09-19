import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

/**
 * The only module in the app that imports `maplibre-gl`.
 *
 * Six screens imported the package and its stylesheet directly. Everything that needs a
 * Marker, a Popup or a LngLatBounds takes it from here, and everything that needs a *map*
 * takes `MapPanel`, which is the only thing that constructs one.
 *
 * It lives beside the panel rather than inside it because a `.tsx` file that exports both a
 * component and a value breaks fast refresh for the whole module.
 */

export { maplibregl as maplibre };
export type MapInstance = maplibregl.Map;
