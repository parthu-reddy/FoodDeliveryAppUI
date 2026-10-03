import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

export const MembershipDto = z
  .object({
    organisationId: z.string().uuid(),
    organisationStatus: z.enum(["ACTIVE", "SUSPENDED", "CLOSED"]),
    userId: z.string().uuid(),
    role: z.enum(["OWNER", "ADMIN", "MANAGER", "STAFF"]),
    status: z.enum(["ACTIVE", "REMOVED"]),
  })
  .passthrough();

export const schemas = {
  MembershipDto,
};

export const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/internal/organisations/:organisationId/members",
    alias: "members_1",
    requestFormat: "json",
    parameters: [
      {
        name: "organisationId",
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
    path: "/api/v1/internal/organisations/:organisationId/members/:userId",
    alias: "membership",
    requestFormat: "json",
    parameters: [
      {
        name: "organisationId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "userId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: MembershipDto,
  },
]);

export const Internal_organisation_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
