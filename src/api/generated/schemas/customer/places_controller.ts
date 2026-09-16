import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const PlaceGeocodeDto = z
  .object({
    formattedAddress: z.string(),
    placeId: z.string(),
    lat: z.number(),
    lng: z.number(),
  })
  .partial()
  .passthrough();
const ApiResponsePlaceGeocodeDto = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: PlaceGeocodeDto.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
const PlaceAutocompleteDto = z
  .object({ placeId: z.string(), description: z.string() })
  .partial()
  .passthrough();
const ApiResponseListPlaceAutocompleteDto = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: z.array(PlaceAutocompleteDto).optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();

export const schemas = {
  PlaceGeocodeDto,
  ApiResponsePlaceGeocodeDto,
  PlaceAutocompleteDto,
  ApiResponseListPlaceAutocompleteDto,
};

const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/places/reverse-geocode",
    alias: "reverseGeocode",
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
    ],
    response: ApiResponsePlaceGeocodeDto,
  },
  {
    method: "get",
    path: "/api/v1/places/autocomplete",
    alias: "autocomplete",
    requestFormat: "json",
    parameters: [
      {
        name: "input",
        type: "Query",
        schema: z.string(),
      },
    ],
    response: ApiResponseListPlaceAutocompleteDto,
  },
]);

export const Places_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
