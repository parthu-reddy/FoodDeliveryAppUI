import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { CustomerAddressDto } from "./common";
import { ApiResponseVoid } from "./common";

const ApiResponseCustomerAddressDto = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: CustomerAddressDto.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
const ApiResponseListCustomerAddressDto = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: z.array(CustomerAddressDto).optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
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
  ApiResponseCustomerAddressDto,
  ApiResponseListCustomerAddressDto,
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
    response: ApiResponseListCustomerAddressDto,
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
    response: ApiResponseCustomerAddressDto,
  },
  {
    method: "delete",
    path: "/api/v1/customers/:customerId/addresses/:addressId",
    alias: "deleteAddress",
    requestFormat: "json",
    parameters: [
      {
        name: "customerId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "addressId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: ApiResponseVoid,
  },
]);

export const Customer_address_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
