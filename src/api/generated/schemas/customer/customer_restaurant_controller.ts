import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

export const PricingConfigDto = z
  .object({
    basePrice: z.number(),
    perKmRate: z.number(),
    restMaxContributionPercent: z.number(),
    fixedPlatformFee: z.number(),
    platformExcessCutPercent: z.number(),
    sgstPercent: z.number(),
    cgstPercent: z.number(),
  })
  .partial()
  .passthrough();
export const DeliveryPricingDto = z
  .object({ distanceKm: z.number(), config: PricingConfigDto })
  .partial()
  .passthrough();
export const ApiResponseDeliveryPricingDto = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: DeliveryPricingDto.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const SponsoredListingDTO = z
  .object({
    adId: z.string(),
    campaignId: z.string(),
    impressionUrl: z.string(),
    clickUrl: z.string(),
    adm: z.string(),
    creativeFormat: z.string(),
  })
  .partial()
  .passthrough();
export const RestaurantDto = z
  .object({
    id: z.string().uuid(),
    brandId: z.string().uuid(),
    name: z.string(),
    description: z.string(),
    lat: z.number(),
    lng: z.number(),
    address: z.string(),
    rating: z.number(),
    isActive: z.boolean(),
    defaultPrepTimeSeconds: z.number().int(),
    isOpen: z.boolean(),
    image: z.string(),
    logoUrl: z.string(),
    cuisine: z.string(),
    reviewsCount: z.number().int(),
    deliveryTime: z.number().int(),
    deliveryFee: z.number(),
    tags: z.array(z.string()),
    brandName: z.string(),
    distance: z.number(),
    isSponsored: z.boolean(),
    adData: SponsoredListingDTO,
  })
  .partial()
  .passthrough();
export const ApiResponseListRestaurantDto = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: z.array(RestaurantDto).optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const ApiResponseBoolean = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: z.boolean().optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();

export const schemas = {
  PricingConfigDto,
  DeliveryPricingDto,
  ApiResponseDeliveryPricingDto,
  SponsoredListingDTO,
  RestaurantDto,
  ApiResponseListRestaurantDto,
  ApiResponseBoolean,
};

export const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/restaurants/:id/delivery-pricing",
    alias: "getDeliveryPricing",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "addressId",
        type: "Query",
        schema: z.string().uuid(),
      },
    ],
    response: ApiResponseDeliveryPricingDto,
  },
  {
    method: "get",
    path: "/api/v1/restaurants/:id/delivery-availability",
    alias: "checkDeliveryAvailability",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ApiResponseBoolean,
  },
  {
    method: "get",
    path: "/api/v1/restaurants/nearby",
    alias: "getNearbyRestaurants",
    requestFormat: "json",
    parameters: [
      {
        name: "lat",
        type: "Query",
        schema: z.number(),
      },
      {
        name: "lng",
        type: "Query",
        schema: z.number(),
      },
      {
        name: "radius",
        type: "Query",
        schema: z.number().optional().default(5),
      },
    ],
    response: ApiResponseListRestaurantDto,
  },
  {
    method: "get",
    path: "/api/v1/restaurants/brands/:brandId/outlets",
    alias: "getBrandOutlets",
    requestFormat: "json",
    parameters: [
      {
        name: "brandId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "lat",
        type: "Query",
        schema: z.number(),
      },
      {
        name: "lng",
        type: "Query",
        schema: z.number(),
      },
      {
        name: "radius",
        type: "Query",
        schema: z.number().optional().default(5),
      },
    ],
    response: ApiResponseListRestaurantDto,
  },
]);

export const Customer_restaurant_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
