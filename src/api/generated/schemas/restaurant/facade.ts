import type { ZodiosOptions } from "@zodios/core";
import { createApiClient as create_campaign } from './campaign_controller';
import { createApiClient as create_catalogAdmin } from './catalog_admin_controller';
import { createApiClient as create_catalog } from './catalog_controller';
import { createApiClient as create_category } from './category_controller';
import { createApiClient as create_fulfillment } from './fulfillment_controller';
import { createApiClient as create_imageUpload } from './image_upload_controller';
import { createApiClient as create_internalOrder } from './internal_order_controller';
import { createApiClient as create_internalRestaurant } from './internal_restaurant_controller';
import { createApiClient as create_restaurantKyc } from './restaurant_kyc_controller';
import { createApiClient as create_restaurantOnboarding } from './restaurant_onboarding_controller';
import { createApiClient as create_restaurantOutlet } from './restaurant_outlet_controller';
import { createApiClient as create_restaurantSse } from './restaurant_sse_controller';

export function createRestaurantFacade(baseUrl: string, options?: ZodiosOptions) {
  return {
  restaurantOutlet: create_restaurantOutlet(baseUrl, options),
  category: create_category(baseUrl, options),
  campaign: create_campaign(baseUrl, options),
  catalog: create_catalog(baseUrl, options),
  fulfillment: create_fulfillment(baseUrl, options),
  restaurantKyc: create_restaurantKyc(baseUrl, options),
  catalogAdmin: create_catalogAdmin(baseUrl, options),
  imageUpload: create_imageUpload(baseUrl, options),
  restaurantOnboarding: create_restaurantOnboarding(baseUrl, options),
  internalRestaurant: create_internalRestaurant(baseUrl, options),
  internalOrder: create_internalOrder(baseUrl, options),
  restaurantSse: create_restaurantSse(baseUrl, options),
  };
}
