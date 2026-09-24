import { AnimatePresence, motion } from 'motion/react';
import { useMotionPresets } from '@shared/ui';
import React, { Suspense } from 'react';
import type { Brand, MenuItem, Order, Outlet } from '@/types';
import { RestaurantMenuTogglesView } from '@features/catalog/components/restaurant/RestaurantMenuTogglesView';
import { RestaurantOrderQueue } from '@features/restaurant-orders/components/RestaurantOrderQueue';
import { DishRatingsPanel } from '@features/reviews';
import { ReviewsPanel } from '@features/reviews/components/ReviewsPanel';
import { EmptyState, ErrorBoundary, LoadingSkeleton } from '@shared/ui';
import { RestaurantStatsBar } from '@features/catalog/components/RestaurantStatsBar';
import type { RefundView } from '@/types';
import CampaignManagement from '@features/campaigns-ads/components/CampaignManagement';
import RestaurantEarningsTab from '@/pages/restaurant/RestaurantEarningsTab';
import { RestaurantSettingsShell } from '@/pages/restaurant/RestaurantSettingsShell';

/**
 * Whichever of the restaurant's five sections is open, plus the settings console.
 *
 * These 129 lines of panel switching were the bottom half of an 845-line dashboard. Moving
 * them out is what lets the dashboard read as what it is: some state, three hooks, and a
 * choice of which panel to show.
 */

export interface RestaurantTabPanelsProps {
  activeTab: 'orders' | 'menu' | 'campaigns' | 'earnings' | 'reviews';
  showSettings: boolean;
  setShowSettings: (open: boolean) => void;
  restaurantId: string;
  selectedOutletId: string;
  menuList: MenuItem[];
  brands: Brand[];
  outlets: Outlet[];
  stockStatus: Record<string, boolean>;
  toggleStock: (dishId: string, currentStatus: boolean) => void;
  activeOrders: Order[];
  refundRequests: RefundView[];
  internalOrders: Order[];
  pendingOrders: Order[];
  activePreparing: Order[];
  completedOrders: Order[];
  cardDelayStatus: Record<string, { minutes: number; reason: string }>;
  totalRevenue: number;
  loadData: () => void;
  setSelectedChatOrder: (order: Order | null) => void;
  handleStatusTransition: (order: Order) => void;
  handleCardCancelSubmit: (orderId: string, reason: string) => void;
  handleCardPartialRefundSubmit: (orderId: string, amountStr: string, reason: string) => void;
  handleCardDelaySubmit: (orderId: string, minutesStr: string, reason: string) => void;
}

export function RestaurantTabPanels({
  activeTab, showSettings, setShowSettings, restaurantId, selectedOutletId,
  menuList, brands, outlets, stockStatus, toggleStock, activeOrders,
  refundRequests, internalOrders, pendingOrders, activePreparing, completedOrders,
  cardDelayStatus, totalRevenue, loadData, setSelectedChatOrder,
  handleStatusTransition, handleCardCancelSubmit, handleCardPartialRefundSubmit,
  handleCardDelaySubmit,
}: RestaurantTabPanelsProps) {
  const presets = useMotionPresets();
  return (
  <AnimatePresence mode="wait">
    {!showSettings && activeTab === 'orders' && (
      <motion.div
        key="orders-panel" {...presets.rise}
        className="p-5 space-y-5"
      >
        <RestaurantStatsBar 
          totalRevenue={totalRevenue} 
          completedOrdersCount={completedOrders.length} 
        />
        <ErrorBoundary fallbackLabel="Order Queue">
          <RestaurantOrderQueue 
            totalRevenue={totalRevenue}
            completedOrders={completedOrders}
            pendingOrders={pendingOrders}
            activePreparing={activePreparing}
            myOrders={internalOrders}
            refundRequests={refundRequests}
            cardDelayStatus={cardDelayStatus}
            handleCardCancelSubmit={handleCardCancelSubmit}
            handleCardDelaySubmit={handleCardDelaySubmit}
            handleCardPartialRefundSubmit={handleCardPartialRefundSubmit}
            handleStatusTransition={handleStatusTransition}
            setSelectedChatOrder={setSelectedChatOrder}
          />
        </ErrorBoundary>
      </motion.div>
    )}

    {!showSettings && activeTab === 'menu' && (
      /* ------------------- MENU STOCK TOGGLES -------------------
         No `key` here on purpose. The presence key for this branch lives on the child's own
         motion root (`RestaurantMenuTogglesView`), which is the pattern every branch follows.
         Adding a second one here would duplicate it inside the same AnimatePresence subtree --
         the exact fault that wedged the orders branch. */
      <ErrorBoundary fallbackLabel="Menu Stock Toggles">
        <RestaurantMenuTogglesView
          menuList={menuList}
          stockStatus={stockStatus}
          toggleStock={toggleStock}
          selectedOutletId={selectedOutletId}
        />
      </ErrorBoundary>
    )}

    {!showSettings && activeTab === 'campaigns' && (
      <motion.div
        key="campaigns-panel" {...presets.rise}
      >
        <ErrorBoundary fallbackLabel="Campaigns">
          <Suspense fallback={<LoadingSkeleton />}>
            <CampaignManagement advertiserId={restaurantId} />
          </Suspense>
        </ErrorBoundary>
      </motion.div>
    )}

    {!showSettings && activeTab === 'earnings' && (
      <motion.div
        key="earnings-panel" {...presets.rise}
        className="p-5 h-full"
      >
        <ErrorBoundary fallbackLabel="Earnings Tab">
          <Suspense fallback={<LoadingSkeleton />}>
            <RestaurantEarningsTab restaurantId={restaurantId} />
          </Suspense>
        </ErrorBoundary>
      </motion.div>
    )}

    {!showSettings && activeTab === 'reviews' && (
      <motion.div
        key="reviews-panel" {...presets.rise}
        className="p-5 h-full overflow-y-auto"
      >
        <ErrorBoundary fallbackLabel="Reviews Tab">
          {/* Scoped to the outlet currently selected in the header, not the brand: a review is
              written about the outlet that cooked the order, and two outlets of one brand can
              have very different kitchens. */}
          {selectedOutletId ? (
<>
              <ReviewsPanel
                entityType="RESTAURANT"
                entityId={selectedOutletId}
                title="What customers said"
                emptyTitle="No reviews yet"
                emptyDescription="Reviews appear here once customers rate a delivered order from this outlet."
              />
              {/* Customers rate dishes and see dish ratings on the menu; without this the
                  kitchen was the only party that could not. Brand-level, because a review of
                  EntityType.PRODUCT is a review of the brand's dish, not one outlet's copy. */}
              <DishRatingsPanel dishes={menuList} className="mt-8" />
            </>
          ) : (
            <EmptyState
              title="Select an outlet"
              description="Reviews are per outlet. Pick one from the header to see its ratings."
            />
          )}
        </ErrorBoundary>
      </motion.div>
    )}

    {showSettings && (
      /* ------------------- RESTAURANT SETTINGS CONSOLE ------------------- */
      <ErrorBoundary fallbackLabel="Restaurant Settings">
        <Suspense fallback={<LoadingSkeleton />}>
          <RestaurantSettingsShell
            brands={brands}
            outlets={outlets}
            selectedOutletId={selectedOutletId}
            restaurantId={restaurantId}
            loadData={loadData}
            activeOrders={activeOrders}
            setSelectedChatOrder={setSelectedChatOrder}
            setShowSettings={setShowSettings}
          />
        </Suspense>
      </ErrorBoundary>
    )}
  </AnimatePresence>
  );
}
