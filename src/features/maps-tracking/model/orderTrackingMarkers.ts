import { createMapPin } from '@shared/ui';

/**
 * The three pins on the live-tracking map, and the directions link two of them open.
 *
 * They were nested inside `attachMap`, inside the component, purely because that is where
 * they were first written: none of them reads anything from the component. Out here the
 * tracking screen is a screen again rather than 45 lines of inline SVG.
 */

function openDirections(lat: number, lng: number) {
  try {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  } catch (e: unknown) {
    console.error("Could not open external map navigation", e);
  }
}

  const createHomeMarker = (lat: number, lng: number) => {
    const el = createMapPin({
      tone: 'destination',
      className: 'cursor-pointer pointer-events-auto',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    });
    el.onclick = () => openDirections(lat, lng);
    return el;
  };

  const createRiderMarker = () => {
    // Bike icon
    return createMapPin({
      tone: 'rider',
      size: 40,
      className: 'cursor-pointer pointer-events-auto',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 5.5h5l-4-5h-3L8 12M5.5 17.5 8 12M18.5 17.5 15 11.5"/></svg>',
    });
  };

  const createRestaurantMarker = (lat: number, lng: number) => {
    const el = createMapPin({
      tone: 'restaurant',
      className: 'cursor-pointer pointer-events-auto',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></svg>',
    });
    el.onclick = () => openDirections(lat, lng);
    return el;
  };

export { createHomeMarker, createRiderMarker, createRestaurantMarker };
