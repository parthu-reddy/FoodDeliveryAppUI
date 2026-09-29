import { describe, expect, test, vi } from 'vitest';

const mapState = vi.hoisted(() => {
  const popupContents: HTMLElement[] = [];

  class Popup {
    setDOMContent(content: HTMLElement) {
      popupContents.push(content);
      return this;
    }
  }

  class Marker {
    setLngLat() { return this; }
    setPopup() { return this; }
    addTo() { return this; }
    togglePopup() { return this; }
  }

  return { popupContents, Popup, Marker };
});

vi.mock('./maplibre', () => ({
  maplibre: { Popup: mapState.Popup, Marker: mapState.Marker },
}));
vi.mock('@/lib/zodiosClients', () => ({
  deliveryApi: { logistics: { get: vi.fn() } },
}));

import { placePins } from './placeOrderMap';

describe('placePins popup content', () => {
  test('uses accessible DOM popup controls instead of parsed HTML', () => {
    mapState.popupContents.length = 0;
    const map = { flyTo: vi.fn() };

    placePins(map as never, {
      restaurant: { lat: 12.98, lng: 77.58 },
      customer: { lat: 12.97, lng: 77.59 },
      rider: null,
    });

    expect(mapState.popupContents).toHaveLength(2);
    expect(mapState.popupContents.map(content => content.tagName)).toEqual(['BUTTON', 'BUTTON']);
    expect(mapState.popupContents.map(content => content.getAttribute('aria-label'))).toEqual([
      'Open directions to Customer',
      'Open directions to Restaurant',
    ]);
  });
});
