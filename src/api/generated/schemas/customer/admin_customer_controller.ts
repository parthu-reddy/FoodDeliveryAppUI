import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { pageable } from "./common";
import { CustomerAddressDto } from "./common";
import { PageableObject } from "./common";
import { SortObject } from "./common";

const PageCustomerAddressDto = z
  .object({
    totalElements: z.number().int(),
    totalPages: z.number().int(),
    numberOfElements: z.number().int(),
    size: z.number().int(),
    content: z.array(CustomerAddressDto),
    pageable: PageableObject.optional(),
    number: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
    sort: SortObject.optional(),
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
