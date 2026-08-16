import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const ResolveRequest = z
  .object({ approved: z.boolean(), notes: z.string(), faultType: z.string() })
  .partial()
  .passthrough();

export const schemas = {
  ResolveRequest,
};

const endpoints = makeApi([
  {
    method: "post",
    path: "/api/v1/admin/refunds/:ticketId/review",
    alias: "addReviewNotes",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ notes: z.string() }).partial().passthrough(),
      },
      {
        name: "ticketId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/admin/refunds/:ticketId/resolve",
    alias: "resolveTicket",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: ResolveRequest,
      },
      {
        name: "ticketId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "X-Admin-Id",
        type: "Header",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/admin/refunds",
    alias: "getTickets",
    requestFormat: "json",
    parameters: [
      {
        name: "page",
        type: "Query",
        schema: z.number().int().optional().default(0),
      },
      {
        name: "size",
        type: "Query",
        schema: z.number().int().optional().default(10),
      },
      {
        name: "status",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: z.void(),
  },
]);

export const Admin_refund_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
