import { MenuItem, Restaurant } from '@/types';
import { CartState } from '@features/customer-orders/model/useCustomerCart';
import { motion } from 'motion/react';
import { useMotionPresets } from '@shared/ui';
import { AlertCircle, ChevronDown, MapPinOff } from 'lucide-react';
import { deliveryUnavailableReason } from '@features/catalog/model/deliveryReason';
import React, { useMemo, useState } from 'react';
import { InlineRating, useEntityAggregates } from '@features/reviews';
import { ReviewsPanel } from '@features/reviews/components/ReviewsPanel';
import { RestaurantReviewButton } from '@features/reviews/components/RestaurantReviewButton';
import { MenuList } from '@features/catalog/components/MenuList';
import { RestaurantHeader } from '@features/catalog/components/RestaurantHeader';
import { viewFromMenuItem } from '@features/catalog/model/menuItem';
import { AlertBanner, Button, EmptyState } from '@shared/ui';
import { formatINR } from '@shared/money';
import { formatKm } from '@features/catalog/model/restaurantFacts';

interface CustomerMenuViewProps {
  selectedRestaurant: Restaurant;
  setSelectedRestaurant: (res: Restaurant | null) => void;
  deliveryPricing?: {
    isDeliverable?: boolean;
    minAmountForFreeDelivery?: number;
    distanceKm?: number;
    [key: string]: unknown;
  } | null;
  getCartTotal: (resId?: string) => { subtotal: number };
  isDeliveryAvailable: boolean | null;
  deliveryAvailabilityError?: string | null;
  brandOutlets: unknown[];
  setIsOutletSelectorOpen: (isOpen: boolean) => void;
  isMenuLoading: boolean;
  menuError?: string | null;
  onRetryMenu?: () => void;
  effectiveMenu: MenuItem[];
  carts: Record<string, CartState>;
  addToCart: (item: MenuItem) => void;
  removeFromCart: (itemId: string, restaurantId: string) => void;
  isQuoting?: boolean;
  deliveryAddressId?: string | null;
  setIsAddressSelectorOpen?: (isOpen: boolean) => void;
}

export const CustomerMenuView: React.FC<CustomerMenuViewProps> = ({
  selectedRestaurant, setSelectedRestaurant, deliveryPricing, getCartTotal,
  isDeliveryAvailable, deliveryAvailabilityError, brandOutlets, setIsOutletSelectorOpen,
  isMenuLoading, menuError, onRetryMenu, effectiveMenu, carts, addToCart, removeFromCart, isQuoting,
  deliveryAddressId, setIsAddressSelectorOpen,
}) => {
  const outletId = selectedRestaurant.id as string;
  const isDeliverable = deliveryPricing?.isDeliverable ?? isDeliveryAvailable ?? true;
  const [showReviews, setShowReviews] = useState(false);

  // Aggregate only. The list is fetched by ReviewsPanel when the section is opened, so simply
  // viewing a menu does not pull a page of reviews nobody asked for -- and does not fetch them
  // twice when it is opened.
  // One request for the whole menu. PRODUCT reviews were writable from the rating sheet but shown
  // nowhere, so a customer rated a dish and the rating vanished -- this is the read side of that.
  const { aggregates: dishRatings } = useEntityAggregates(
    'PRODUCT',
    effectiveMenu.map((item) => item.id as string),
    effectiveMenu.length > 0,
  );

  const views = useMemo(() => effectiveMenu.map(viewFromMenuItem), [effectiveMenu]);
  const byId = useMemo(
    () => new Map(effectiveMenu.map((item) => [item.id as string, item])),
    [effectiveMenu],
  );
  const quantities = useMemo(() => Object.fromEntries(
    (carts[outletId]?.items ?? []).map((line) => [line.item.id as string, line.quantity]),
  ), [carts, outletId]);
  const ratings = useMemo(() => Object.fromEntries(views.map((view) => [
    view.id,
    <InlineRating
      average={dishRatings[view.id]?.average ?? 0}
      total={dishRatings[view.id]?.totalReviews ?? 0}
      label={view.name}
    />,
  ])), [views, dishRatings]);

  const addById = (id: string) => {
    const item = byId.get(id);
    if (item) addToCart(item);
  };

  // Plain words, not "Dynamic Fee" / "₹40 Base". The exact figure is on the checkout bill; here
  // the customer needs to know whether delivery is free and, if not, what makes it free.
  const minOrder = deliveryPricing?.minAmountForFreeDelivery;
  const baseFee = Number(selectedRestaurant.deliveryFee ?? 0);
  const feeLabel = isQuoting ? 'Checking delivery fee…'
    : minOrder != null && getCartTotal().subtotal >= minOrder ? 'Free delivery'
    : minOrder != null ? `Free delivery over ${formatINR(minOrder)}`
    : baseFee > 0 ? `Delivery ${formatINR(baseFee)}` : 'Free delivery';

  const unavailableReason = deliveryUnavailableReason(
    deliveryPricing?.error ?? deliveryAvailabilityError
  );

  const notices = (
    <div className="space-y-2 px-4 pt-3 empty:hidden">
      {!deliveryAddressId && (
        <AlertBanner variant="warning" icon={<AlertCircle className="w-5 h-5 shrink-0" />}>
          <span className="flex items-center justify-between gap-3">
            Set your delivery address to see accurate pricing
            <Button size="xs" variant="warning" onClick={() => setIsAddressSelectorOpen?.(true)}>
              Set Address
            </Button>
          </span>
        </AlertBanner>
      )}
      {!isDeliverable && (
        <AlertBanner variant="error" icon={<MapPinOff className="w-5 h-5 shrink-0" />}>
          {/* The real reason, not a guess -- see model/deliveryReason.ts */}
          {unavailableReason}
        </AlertBanner>
      )}
    </div>
  );

  const presets = useMotionPresets();
  return (
    <motion.div
      key="restaurant-detail" {...presets.slideInX}
      className="flex-1 flex flex-col"
    >
      <RestaurantHeader
        restaurant={selectedRestaurant}
        onBack={() => setSelectedRestaurant(null)}
        feeLabel={feeLabel}
        distanceLabel={`${formatKm(deliveryPricing?.distanceKm ?? selectedRestaurant.distance) ?? '—'} away`}
        notices={notices}
        rating={
          <RestaurantReviewButton outletId={outletId} expanded={showReviews}
            onToggle={() => setShowReviews((value) => !value)} />
        }
      >
        {brandOutlets.length > 1 && (
          <Button
            id="outlet-select" variant="outline" fullWidth
            onClick={() => setIsOutletSelectorOpen(true)}
            iconRight={<ChevronDown className="w-4 h-4" />}
          >
            Change outlet
          </Button>
        )}
      </RestaurantHeader>

      <div className="px-5 pb-5 space-y-4">
        {!isMenuLoading && menuError ? (
          <EmptyState title="Couldn't load menu" description="Check your connection and try again."
            icon={<AlertCircle className="w-12 h-12" />}
            action={onRetryMenu ? <Button onClick={onRetryMenu}>Try again</Button> : undefined} />
        ) : !isMenuLoading && views.length === 0 ? (
          <EmptyState title="Menu unavailable" description="This kitchen hasn't published any menu items yet."
            icon={<AlertCircle className="w-12 h-12" />} />
        ) : (
        <MenuList
          categoryNav
          views={views}
          loading={isMenuLoading}
          can={{ addToCart: true }}
          quantities={quantities}
          ratings={ratings}
          blockedReason={isDeliverable ? undefined : 'Unavailable here'}
          onAdd={addById}
          onIncrement={addById}
          onDecrement={(id) => removeFromCart(id, outletId)}
        />
        )}

        {showReviews && (
          <ReviewsPanel
            entityType="RESTAURANT" entityId={outletId} title="Reviews"
            emptyTitle="No reviews yet"
            emptyDescription="Order from here and you can be the first to leave one."
          />
        )}
      </div>
    </motion.div>
  );
};
