import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const LocationPayload = z
  .object({
    latitude: z.number(),
    longitude: z.number(),
    speedKmh: z.number(),
    isMockLocation: z.boolean(),
    timestampMs: z.number().int(),
  })
  .partial()
  .passthrough();

export const schemas = {
  LocationPayload,
};

const endpoints = makeApi([
  {
    method: "post",
    path: "/api/v1/delivery/telemetry/sync",
    alias: "syncLocation",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: LocationPayload,
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/delivery/telemetry/batch",
    alias: "processBatchTelemetry",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.array(TelemetryEventRequest),
      },
    ],
    response: z.void(),
  },
]);

export const Delivery_telemetry_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
