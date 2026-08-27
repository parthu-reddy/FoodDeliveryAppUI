import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { pageable } from "./common";
import { PageableObject } from "./common";
import { SortObject } from "./common";
import { CustomerAddressDto } from "./common";

const PageCustomerAddressDto = z
  .object({
    totalPages: z.number().int(),
    totalElements: z.number().int(),
    pageable: PageableObject.optional(),
    sort: z.array(SortObject).optional(),
    numberOfElements: z.number().int(),
    number: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
    size: z.number().int(),
    content: z.array(CustomerAddressDto),
    empty: z.boolean(),
  })
  .passthrough();
const ApiResponsePageCustomerAddressDto = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: PageCustomerAddressDto.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
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
