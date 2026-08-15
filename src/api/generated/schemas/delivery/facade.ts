import type { ZodiosOptions } from "@zodios/core";
import { createApiClient as create_internalDelivery } from './internal_delivery_controller';
import { createApiClient as create_adminDelivery } from './admin_delivery_controller';
import { createApiClient as create_deliveryTelemetry } from './delivery_telemetry_controller';
import { createApiClient as create_deliveryVerification } from './delivery_verification_controller';
import { createApiClient as create_deliveryExecutive } from './delivery_executive_controller';
import { createApiClient as create_logistics } from './logistics_controller';
import { createApiClient as create_deliveryOrder } from './delivery_order_controller';

export function createDeliveryFacade(baseUrl: string, options?: ZodiosOptions) {
  return {
  internalDelivery: create_internalDelivery(baseUrl, options),
  adminDelivery: create_adminDelivery(baseUrl, options),
  deliveryTelemetry: create_deliveryTelemetry(baseUrl, options),
  deliveryVerification: create_deliveryVerification(baseUrl, options),
  deliveryExecutive: create_deliveryExecutive(baseUrl, options),
  logistics: create_logistics(baseUrl, options),
  deliveryOrder: create_deliveryOrder(baseUrl, options),
  };
}
