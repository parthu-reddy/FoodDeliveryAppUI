import type { ZodiosOptions } from "@zodios/core";
import { createApiClient as create_customerProfile } from './customer_profile_controller';
import { createApiClient as create_order } from './order_controller';
import { createApiClient as create_internalOrderRefund } from './internal_order_refund_controller';
import { createApiClient as create_adminRefund } from './admin_refund_controller';
import { createApiClient as create_adminRefundCommand } from './admin_refund_command_controller';
import { createApiClient as create_adminOrder } from './admin_order_controller';
import { createApiClient as create_adminOrderManual } from './admin_order_manual_controller';
import { createApiClient as create_adminDlq } from './admin_dlq_controller';
import { createApiClient as create_customerAddress } from './customer_address_controller';
import { createApiClient as create_customerOrder } from './customer_order_controller';
import { createApiClient as create_customerRestaurant } from './customer_restaurant_controller';
import { createApiClient as create_places } from './places_controller';
import { createApiClient as create_customerTracking } from './customer_tracking_controller';
import { createApiClient as create_restaurantMoney } from './restaurant_money_controller';
import { createApiClient as create_driverMoney } from './driver_money_controller';
import { createApiClient as create_customerMoney } from './customer_money_controller';
import { createApiClient as create_internalOrder } from './internal_order_controller';
import { createApiClient as create_internalMoney } from './internal_money_controller';
import { createApiClient as create_adminMoney } from './admin_money_controller';
import { createApiClient as create_adminCustomer } from './admin_customer_controller';

export function createCustomerFacade(baseUrl: string, options?: ZodiosOptions) {
  return {
  customerProfile: create_customerProfile(baseUrl, options),
  order: create_order(baseUrl, options),
  internalOrderRefund: create_internalOrderRefund(baseUrl, options),
  adminRefund: create_adminRefund(baseUrl, options),
  adminRefundCommand: create_adminRefundCommand(baseUrl, options),
  adminOrder: create_adminOrder(baseUrl, options),
  adminOrderManual: create_adminOrderManual(baseUrl, options),
  adminDlq: create_adminDlq(baseUrl, options),
  customerAddress: create_customerAddress(baseUrl, options),
  customerOrder: create_customerOrder(baseUrl, options),
  customerRestaurant: create_customerRestaurant(baseUrl, options),
  places: create_places(baseUrl, options),
  customerTracking: create_customerTracking(baseUrl, options),
  restaurantMoney: create_restaurantMoney(baseUrl, options),
  driverMoney: create_driverMoney(baseUrl, options),
  customerMoney: create_customerMoney(baseUrl, options),
  internalOrder: create_internalOrder(baseUrl, options),
  internalMoney: create_internalMoney(baseUrl, options),
  adminMoney: create_adminMoney(baseUrl, options),
  adminCustomer: create_adminCustomer(baseUrl, options),
  };
}
