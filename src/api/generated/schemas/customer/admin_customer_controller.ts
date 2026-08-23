import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { pageable } from "./common";
import { CustomerAddressDto } from "./common";
import { SortObject } from "./common";
import { PageableObject } from "./common";

const PageCustomerAddressDto = z
  .object({
    totalPages: z.number().int(),
    totalElements: z.number().int(),
    size: z.number().int(),
    content: z.array(CustomerAddressDto),
    number: z.number().int(),
    sort: z.array(SortObject),
    first: z.boolean(),
    pageable: PageableObject,
    numberOfElements: z.number().int(),
    last: z.boolean(),
    empty: z.boolean(),
  })
  .partial()
  .passthrough();
const ApiResponsePageCustomerAddressDto = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: PageCustomerAddressDto,
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();

export const schemas = {
  PageCustomerAddressDto,
  ApiResponsePageCustomerAddressDto,
};

const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/internal/admin/customers/addresses",
    alias: "getAllCustomerAddresses",
    requestFormat: "json",
    parameters: [
      {
        name: "pageable",
        type: "Query",
        schema: pageable,
      },
    ],
    response: ApiResponsePageCustomerAddressDto,
  },
]);

export const Admin_customer_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
