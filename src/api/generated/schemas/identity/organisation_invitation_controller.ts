import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { InvitationView } from "./common";
import { SliceInvitationView } from "./common";
import { SortObject } from "./common";
import { PageableObject } from "./common";

export const endpoints = makeApi([
  {
    method: "post",
    path: "/api/v1/organisation-invitations/:invitationId/decline",
    alias: "decline",
    requestFormat: "json",
    parameters: [
      {
        name: "invitationId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: InvitationView,
  },
  {
    method: "post",
    path: "/api/v1/organisation-invitations/:invitationId/accept",
    alias: "accept",
    requestFormat: "json",
    parameters: [
      {
        name: "invitationId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: InvitationView,
  },
  {
    method: "get",
    path: "/api/v1/organisation-invitations",
    alias: "mine",
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
        schema: z.number().int().optional().default(20),
      },
    ],
    response: SliceInvitationView,
  },
]);

export const Organisation_invitation_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
