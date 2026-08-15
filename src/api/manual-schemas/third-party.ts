import { z } from 'zod';

export const olaMapsGeocodeResponseSchema = z.object({
  status: z.string().optional(),
  results: z.array(z.object({
    formatted_address: z.string().optional(),
    geometry: z.object({
      location: z.object({
        lat: z.number().optional(),
        lng: z.number().optional(),
      }).optional(),
    }).optional(),
  }).passthrough()).optional(),
}).passthrough();

export type OlaMapsGeocodeResponse = z.infer<typeof olaMapsGeocodeResponseSchema>;

export const olaMapsAutocompleteResponseSchema = z.object({
  status: z.string().optional(),
  predictions: z.array(z.object({
    description: z.string().optional(),
    place_id: z.string().optional(),
  }).passthrough()).optional(),
}).passthrough();

export type OlaMapsAutocompleteResponse = z.infer<typeof olaMapsAutocompleteResponseSchema>;

export const olaMapsDirectionsResponseSchema = z.object({
  status: z.string().optional(),
  routes: z.array(z.object({
    overview_polyline: z.string().optional(),
    legs: z.array(z.object({
      distance: z.number().optional(),
      duration: z.number().optional(),
      readable_distance: z.string().optional(),
      readable_duration: z.string().optional(),
    }).passthrough()).optional(),
  }).passthrough()).optional(),
}).passthrough();

export type OlaMapsDirectionsResponse = z.infer<typeof olaMapsDirectionsResponseSchema>;
