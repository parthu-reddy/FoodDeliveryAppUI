import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { RestaurantTabPanels, type RestaurantTabPanelsProps } from './RestaurantTabPanels';

/**
 * The contract the restaurant tabs depend on: changing `activeTab` must change the panel.
 *
 * On the deployed app this was broken for weeks — the URL and the tab highlight followed the
 * click while the previous panel stayed on screen, so Menu Stock Toggles, Ad Campaigns,
 * Earnings and Reviews were all unreachable. A full page load rendered each panel correctly,
 * which is why it read as a routing problem for a long time and was not.
 *
 * This asserts the switch itself, with no router, no backend and no outlet data, so a
 * regression shows up in a second instead of after a build-and-deploy cycle.
 */

// The panels pull in maps, charts and data widgets that are irrelevant to which panel renders.
// Stubbing them keeps this test about the switch.
vi.mock('@features/restaurant-orders/components/RestaurantOrderQueue', () => ({
  RestaurantOrderQueue: () => <div>ORDERS PANEL</div>,
}));
vi.mock('@features/catalog/components/restaurant/RestaurantMenuTogglesView', () => ({
  default: () => <div>MENU PANEL</div>,
  RestaurantMenuTogglesView: () => <div>MENU PANEL</div>,
}));

function props(activeTab: RestaurantTabPanelsProps['activeTab']): RestaurantTabPanelsProps {
  return {
    activeTab,
    showSettings: false,
    setShowSettings: () => {},
    restaurantId: 'r1',
    selectedOutletId: 'o1',
    menuList: [],
    brands: [],
    outlets: [],
    stockStatus: {},
    toggleStock: () => {},
    activeOrders: [],
    refundRequests: [],
    internalOrders: [],
    pendingOrders: [],
    activePreparing: [],
    completedOrders: [],
    cardDelayStatus: {},
    totalRevenue: 0,
    loadData: () => {},
    setSelectedChatOrder: () => {},
    handleStatusTransition: () => {},
    handleCardCancelSubmit: () => {},
    handleCardPartialRefundSubmit: () => {},
    handleCardDelaySubmit: () => {},
  } as unknown as RestaurantTabPanelsProps;
}

const renderAt = (tab: RestaurantTabPanelsProps['activeTab']) =>
  render(
    <MemoryRouter>
      <RestaurantTabPanels {...props(tab)} />
    </MemoryRouter>
  );

describe('RestaurantTabPanels', () => {
  it('renders the orders panel first', () => {
    renderAt('orders');
    expect(screen.getByText('ORDERS PANEL')).toBeInTheDocument();
  });

  it('swaps the panel when activeTab changes — the defect that shipped', async () => {
    const { rerender } = renderAt('orders');
    expect(screen.getByText('ORDERS PANEL')).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <RestaurantTabPanels {...props('menu')} />
      </MemoryRouter>
    );

    // The outgoing panel must go and the incoming one must arrive. On the broken build the
    // orders panel stayed and the menu panel never entered the DOM at all.
    expect(await screen.findByText('MENU PANEL')).toBeInTheDocument();
    expect(screen.queryByText('ORDERS PANEL')).not.toBeInTheDocument();
  });
});
