export * from './types/backend-enums';
import { OrderStatus, DeliveryStatus, RoleName as UserRole } from './types/backend-enums';
export { UserRole, DeliveryStatus };
export interface Restaurant {
  id: string;
  name: string;
  image: string;
  cuisine: string;
  rating: number;
  reviewsCount: number;
  deliveryTime: number; // in mins
  deliveryFee: number;
  tags: string[];
  distance: number; // in km
  brandId?: string;
  brandName?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  image?: string;
  imageUrl?: string;
  category: string;
  rating: number;
  isVeg: boolean;
  isAvailable: boolean;
  prepTimeMinutes?: number;
}

export interface CartItem {
  item: MenuItem;
  quantity: number;
}

// OrderStatus is now imported from backend-enums

export interface Order {
  id: string;
  customerId?: string;
  customerName: string;
  deliveryAddress: string;
  deliveryLat?: number;
  deliveryLng?: number;
  restaurantId: string;
  restaurantName: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  totalAmount?: number;
  itemTotal?: number;
  sgst?: number;
  cgst?: number;
  paymentIntent?: string;
  status: OrderStatus;
  deliveryStatus?: DeliveryStatus;
  otp: string; // 6-digit code to complete delivery
  pickupOtp?: string; // 6-digit code to pick up from restaurant
  deliveryExecutiveId?: string;
  deliveryExecutiveName?: string;
  riderId?: string;
  riderName?: string;
  createdAt?: string;
  updatedAt?: string;
  timestamp?: string;
  estimatedCompletionTime?: number;
}

export interface EarningRecord {
  id: string;
  orderId: string;
  amount: number;
  type: 'payout' | 'tip';
  createdAt?: string;
  timestamp?: string;
}

export interface MasterMenuItem {
  id: string;
  brandId: string;
  name: string;
  basePrice: number;
  packingCharge?: number;
  defaultPrepTimeMinutes: number;
  imageUrl: string;
  category: string;
  description: string;
  isVeg: boolean;
}

export interface OutletOverride {
  id: string;
  outletId: string;
  masterMenuItemId: string;
  overriddenPrice?: number;
  isAvailable?: boolean;
  overriddenPrepTimeMinutes?: number;
}

