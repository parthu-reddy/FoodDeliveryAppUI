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

vi.mock('@/pages/restaurant/RestaurantEarningsTab', () => ({
  default: ({ outletId }: { outletId: string }) => <div>EARNINGS FOR [{outletId}]</div>,
}));
vi.mock('@features/campaigns-ads/components/RestaurantCampaigns', () => ({
  RestaurantCampaigns: ({ brandName, outletTimeZone }: { brandName?: string; outletTimeZone?: string }) =>
    <div>CAMPAIGNS FOR [{brandName}] IN [{outletTimeZone}]</div>,
}));

function props(activeTab: RestaurantTabPanelsProps['activeTab']): RestaurantTabPanelsProps {
  return {
    activeTab,
    showSettings: false,
    setShowSettings: () => {},
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

  it('shows earnings for the selected outlet', () => {
    // The tab was keyed on a dashboard restaurantId that was always "", so it never loaded anything.
    render(
      <MemoryRouter>
        <RestaurantTabPanels {...props('earnings')} selectedOutletId="outlet-3" />
      </MemoryRouter>
    );
    expect(screen.getByText('EARNINGS FOR [outlet-3]')).toBeInTheDocument();
  });

  it("offers campaigns under the selected outlet's brand and time zone", () => {
    const outlets = [
      { id: 'outlet-1', brandId: 'brand-a', timeZone: 'Asia/Kolkata' },
      { id: 'outlet-2', brandId: 'brand-b', timeZone: 'Asia/Dubai' },
    ];
    const brands = [{ id: 'brand-a', name: 'Alpha Kitchen' }, { id: 'brand-b', name: 'Beta Biryani' }];
    render(
      <MemoryRouter>
        <RestaurantTabPanels {...props('campaigns')} selectedOutletId="outlet-2"
          outlets={outlets as RestaurantTabPanelsProps['outlets']} brands={brands as RestaurantTabPanelsProps['brands']} />
      </MemoryRouter>
    );
    expect(screen.getByText('CAMPAIGNS FOR [Beta Biryani] IN [Asia/Dubai]')).toBeInTheDocument();
  });
});
