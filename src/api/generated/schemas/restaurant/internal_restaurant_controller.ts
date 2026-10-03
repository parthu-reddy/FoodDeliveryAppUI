import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

export const ApiResponseBoolean = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: z.boolean().optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const OutletOrganisationDto = z
  .object({
    outletId: z.string().uuid(),
    brandId: z.string().uuid(),
    organisationId: z.string().uuid(),
  })
  .partial()
  .passthrough();

export const schemas = {
  ApiResponseBoolean,
  OutletOrganisationDto,
};

export const endpoints = makeApi([
  {
    method: "post",
    path: "/api/v1/internal/restaurants/outlets/summaries",
    alias: "getOutletSummaries",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.array(z.string().uuid()),
      },
    ],
    response: z.array(z.record(z.string())),
  },
  {
    method: "get",
    path: "/api/v1/internal/restaurants/users/:userId/outlets",
    alias: "getUserOutlets",
    requestFormat: "json",
    parameters: [
      {
        name: "userId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "permission",
        type: "Query",
        schema: z.enum([
          "ORG_VIEW",
          "ORG_MANAGE",
          "MEMBERS_MANAGE",
          "BUSINESS_APPLY",
          "OUTLET_MANAGE",
          "MENU_MANAGE",
          "STOCK_TOGGLE",
          "ORDERS_OPERATE",
          "EARNINGS_VIEW",
          "PAYOUTS_MANAGE",
          "ADS_VIEW",
          "ADS_MANAGE",
          "WALLET_VIEW",
          "WALLET_TOPUP",
        ]),
      },
    ],
    response: z.array(z.string().uuid()),
  },
  {
    method: "get",
    path: "/api/v1/internal/restaurants/products/:productId/exists",
    alias: "productExists",
    requestFormat: "json",
    parameters: [
      {
        name: "productId",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: ApiResponseBoolean,
  },
  {
    method: "get",
    path: "/api/v1/internal/restaurants/outlets/:outletId/summary",
    alias: "getOutletSummary",
    requestFormat: "json",
    parameters: [
      {
        name: "outletId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.record(z.string()),
  },
  {
    method: "get",
    path: "/api/v1/internal/restaurants/outlets/:outletId/organisation",
    alias: "getOutletOrganisation",
    requestFormat: "json",
    parameters: [
      {
        name: "outletId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: OutletOrganisationDto,
  },
  {
    method: "get",
    path: "/api/v1/internal/restaurants/outlets/:outletId/invoice-details",
    alias: "getInvoiceDetails",
    requestFormat: "json",
    parameters: [
      {
        name: "outletId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.record(z.object({}).partial().passthrough()),
  },
  {
    method: "get",
    path: "/api/v1/internal/restaurants/outlets/:outletId/exists",
    alias: "outletExists",
    requestFormat: "json",
    parameters: [
      {
        name: "outletId",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: ApiResponseBoolean,
  },
]);

export const Internal_restaurant_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
