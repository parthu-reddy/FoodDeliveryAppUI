import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { CustomerAddressDto } from "./common";

export const PageResponseDtoCustomerAddressDto = z
  .object({
    content: z.array(CustomerAddressDto),
    totalElements: z.number().int(),
    totalPages: z.number().int(),
    last: z.boolean(),
    size: z.number().int(),
    number: z.number().int(),
    first: z.boolean(),
    numberOfElements: z.number().int(),
    empty: z.boolean(),
  })
  .passthrough();
export const ApiResponsePageResponseDtoCustomerAddressDto = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: PageResponseDtoCustomerAddressDto.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();

export const schemas = {
  PageResponseDtoCustomerAddressDto,
  ApiResponsePageResponseDtoCustomerAddressDto,
};

export const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/internal/admin/customers/addresses",
    alias: "getAllCustomerAddresses",
    requestFormat: "json",
    parameters: [
      {
        name: "cityId",
        type: "Query",
        schema: z
          .string()
          .regex(/^[A-Z][A-Z0-9_-]{0,63}$/)
          .optional(),
      },
      {
        name: "page",
        type: "Query",
        schema: z.number().int().gte(0).optional().default(0),
      },
      {
        name: "size",
        type: "Query",
        schema: z.number().int().gte(1).lte(100).optional().default(100),
      },
    ],
    response: ApiResponsePageResponseDtoCustomerAddressDto,
  },
]);

export const Admin_customer_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
