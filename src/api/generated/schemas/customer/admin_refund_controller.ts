import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { SupportTicket } from "./common";
import { PageSupportTicket } from "./common";
import { PageableObject } from "./common";
import { SortObject } from "./common";

const ResolveRequest = z
  .object({
    approved: z.boolean(),
    notes: z.string().optional(),
    faultType: z.string().optional(),
  })
  .passthrough();

export const schemas = {
  ResolveRequest,
};

const endpoints = makeApi([
  {
    method: "post",
    path: "/api/v1/internal/admin/refunds/:ticketId/review",
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
    response: SupportTicket,
  },
  {
    method: "post",
    path: "/api/v1/internal/admin/refunds/:ticketId/resolve",
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
    response: SupportTicket,
  },
  {
    method: "get",
    path: "/api/v1/internal/admin/refunds",
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
    response: PageSupportTicket,
  },
]);

export const Admin_refund_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
