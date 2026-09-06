import { RoleName } from './backend-enums';
export * from './backend-enums';
export { RoleName as UserRole };

export * from '../api/manual-schemas/streaming';
import { z } from 'zod';

import { components as restaurantComponents } from '../api/generated/restaurant';
import { components as customerComponents } from '../api/generated/customer';
import { components as deliveryComponents } from '../api/generated/delivery';

export type Brand = restaurantComponents['schemas']['Brand'];
export type Outlet = restaurantComponents['schemas']['Outlet'];
export type MasterMenuItem = restaurantComponents['schemas']['MasterMenuItem'];
export type MenuItem = restaurantComponents['schemas']['MenuItemDTO'];
export type OutletOverride = restaurantComponents['schemas']['MasterMenuItem']; // Fallback
export type NearbyRestaurant = restaurantComponents['schemas']['NearbyRestaurantDTO'];
export type Order = Omit<customerComponents['schemas']['OrderResponse'], 'status'> & {
    status: RoleName;
};
export type SupportTicket = customerComponents['schemas']['SupportTicketResponse'];
export type CustomerAddressDto = customerComponents['schemas']['CustomerAddressDto'];
export type RefundView = customerComponents['schemas']['RefundView'];
export type DriverLocationDTO = deliveryComponents['schemas']['DriverLocationDTO'];
