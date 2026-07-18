export type UserRole = 'customer' | 'restaurant' | 'delivery' | 'admin';

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
}

export interface CartItem {
  item: MenuItem;
  quantity: number;
}

export type OrderStatus =
  | 'placed' // Placed by customer
  | 'accepted' // Accepted by restaurant
  | 'preparing' // Being cooked
  | 'dispatched' // Ready & assigned, waiting for delivery pickup
  | 'picked_up' // Picked up by delivery partner
  | 'delivered' // Successfully completed
  | 'on_hold' // Held by restaurant due to delay
  | 'ready_for_pickup'
  | 'out_for_delivery'
  | 'created'
  | 'rejected'
  | 'cancelled';

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryLat?: number;
  deliveryLng?: number;
  restaurantId: string;
  restaurantName: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  otp: string; // 6-digit code to complete delivery
  pickupOtp?: string; // 6-digit code to pick up from restaurant
  riderId?: string;
  riderName?: string;
  riderPhone?: string;
  createdAt?: string;
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
  price?: number;
  active?: boolean;
}

