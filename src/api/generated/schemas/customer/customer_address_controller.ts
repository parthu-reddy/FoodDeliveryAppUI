import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const AddressRequest = z
  .object({
    label: z.string(),
    addressLine1: z.string(),
    addressLine2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    latitude: z.number(),
    longitude: z.number(),
  })
  .passthrough();

export const schemas = {
  AddressRequest,
};

const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/customers/:customerId/addresses",
    alias: "getAddresses",
    requestFormat: "json",
    parameters: [
      {
        name: "customerId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/customers/:customerId/addresses",
    alias: "addAddress",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: AddressRequest,
      },
      {
        name: "customerId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
]);

export const Customer_address_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
