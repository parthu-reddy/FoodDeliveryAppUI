import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { SliceOrganisationView } from "./common";
import { OrganisationView } from "./common";
import { SortObject } from "./common";
import { PageableObject } from "./common";
import { SliceInvitationView } from "./common";
import { InvitationView } from "./common";
import { MemberView } from "./common";
import { SliceMemberView } from "./common";

export const Invite = z
  .object({
    phoneNumber: z.string().regex(/[0-9]{10}/),
    role: z.enum(["OWNER", "ADMIN", "MANAGER", "STAFF"]),
  })
  .passthrough();
export const ChangeRole = z
  .object({ role: z.enum(["OWNER", "ADMIN", "MANAGER", "STAFF"]) })
  .passthrough();

export const schemas = {
  Invite,
  ChangeRole,
};

export const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/organisations",
    alias: "list",
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
    response: SliceOrganisationView,
  },
  {
    method: "post",
    path: "/api/v1/organisations",
    alias: "create",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z
          .object({ displayName: z.string().min(0).max(120) })
          .passthrough(),
      },
    ],
    response: OrganisationView,
  },
  {
    method: "post",
    path: "/api/v1/organisations/:organisationId/ownership-transfer",
    alias: "transfer",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ userId: z.string().uuid() }).passthrough(),
      },
      {
        name: "organisationId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: OrganisationView,
  },
  {
    method: "get",
    path: "/api/v1/organisations/:organisationId/invitations",
    alias: "invitations",
    requestFormat: "json",
    parameters: [
      {
        name: "organisationId",
        type: "Path",
        schema: z.string().uuid(),
      },
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
  {
    method: "post",
    path: "/api/v1/organisations/:organisationId/invitations",
    alias: "invite",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: Invite,
      },
      {
        name: "organisationId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: InvitationView,
  },
  {
    method: "get",
    path: "/api/v1/organisations/:organisationId",
    alias: "get",
    requestFormat: "json",
    parameters: [
      {
        name: "organisationId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: OrganisationView,
  },
  {
    method: "patch",
    path: "/api/v1/organisations/:organisationId",
    alias: "rename",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z
          .object({ displayName: z.string().min(0).max(120) })
          .passthrough(),
      },
      {
        name: "organisationId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: OrganisationView,
  },
  {
    method: "delete",
    path: "/api/v1/organisations/:organisationId/members/:userId",
    alias: "remove",
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
    response: z.void(),
  },
  {
    method: "patch",
    path: "/api/v1/organisations/:organisationId/members/:userId",
    alias: "role",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: ChangeRole,
      },
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
    response: MemberView,
  },
  {
    method: "get",
    path: "/api/v1/organisations/:organisationId/members",
    alias: "members",
    requestFormat: "json",
    parameters: [
      {
        name: "organisationId",
        type: "Path",
        schema: z.string().uuid(),
      },
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
    response: SliceMemberView,
  },
  {
    method: "delete",
    path: "/api/v1/organisations/:organisationId/invitations/:invitationId",
    alias: "revoke",
    requestFormat: "json",
    parameters: [
      {
        name: "organisationId",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "invitationId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
]);

export const Organisation_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
