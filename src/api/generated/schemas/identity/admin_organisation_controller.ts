import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { OrganisationView } from "./common";
import { SliceOrganisationView } from "./common";
import { SortObject } from "./common";
import { PageableObject } from "./common";
import { SliceMemberView } from "./common";
import { MemberView } from "./common";

export const AdminOrganisationView = z
  .object({ organisation: OrganisationView, members: SliceMemberView })
  .partial()
  .passthrough();

export const schemas = {
  AdminOrganisationView,
};

export const endpoints = makeApi([
  {
    method: "post",
    path: "/api/v1/internal/admin/organisations/:organisationId/suspend",
    alias: "suspend",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ reason: z.string().min(10).max(500) }).passthrough(),
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
    method: "post",
    path: "/api/v1/internal/admin/organisations/:organisationId/reinstate",
    alias: "reinstate",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ reason: z.string().min(10).max(500) }).passthrough(),
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
    path: "/api/v1/internal/admin/organisations",
    alias: "list_1",
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
    method: "get",
    path: "/api/v1/internal/admin/organisations/:organisationId",
    alias: "get_1",
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
    response: AdminOrganisationView,
  },
  {
    method: "get",
    path: "/api/v1/internal/admin/organisations/:organisationId/members",
    alias: "members_2",
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
]);

export const Admin_organisation_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
