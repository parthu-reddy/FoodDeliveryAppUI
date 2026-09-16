import { RoleName, OrderStatus, DeliveryStatus } from './backend-enums';
export * from './backend-enums';
export { RoleName as UserRole };

export * from '../api/manual-schemas/streaming';


import { components as restaurantComponents } from '../api/generated/restaurant';
import { components as customerComponents } from '../api/generated/customer';
import { components as deliveryComponents } from '../api/generated/delivery';

export type Brand = restaurantComponents['schemas']['Brand'];
export type Outlet = restaurantComponents['schemas']['OutletDto'];
export type MasterMenuItem = restaurantComponents['schemas']['MasterMenuItem'];
export type MenuItem = restaurantComponents['schemas']['MenuItemDTO'] & {
    category?: string;
    image?: string;
    isVeg?: boolean;
};
export type OutletOverride = restaurantComponents['schemas']['MasterMenuItem']; // Fallback
export type NearbyRestaurant = restaurantComponents['schemas']['NearbyRestaurantDTO'];
/**
 * How an order is paid for.
 *
 * Derived from the generated schema, not re-spelled here. `Order` used to declare
 * `paymentMethod` as a hand-written override, which let the UI drift from the backend contract.
 */
export type PaymentMethodChoice = NonNullable<customerComponents['schemas']['OrderResponse']['paymentMethod']>;

export type Order = Omit<customerComponents['schemas']['OrderResponse'], 'status' | 'deliveryStatus'> & {
    status: OrderStatus;
    deliveryStatus?: DeliveryStatus;
    earnings?: {
        netPayout: number;
        customerContribution: number;
        restaurantContribution: number;
    };
};
export type SupportTicket = customerComponents['schemas']['SupportTicket'];
export type CustomerAddressDto = customerComponents['schemas']['CustomerAddressDto'];
export type RefundView = customerComponents['schemas']['RefundView'];
export type DriverLocationDTO = deliveryComponents['schemas']['DriverLocationDTO'];

export type Restaurant = NearbyRestaurant & {
    adData?: { impressionUrl?: string; clickUrl?: string; description?: string };
    cuisine?: string;
    deliveryTime?: number;
    minDeliveryTime?: number;
    isSponsored?: boolean;
    brandName?: string;
    brandId?: string;
};
export type CartItem = { item: MenuItem; quantity: number; };
export type OrderItem = {
    id?: string;
    name?: string;
    price?: number;
    quantity: number;
    item?: MenuItem;
};
export type Address = CustomerAddressDto;
