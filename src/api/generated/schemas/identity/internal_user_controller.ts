import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const RoleRequestDTO = z
  .object({ roleName: z.enum(["CUSTOMER", "DELIVERY", "RESTAURANT", "ADMIN"]) })
  .passthrough();

export const schemas = {
  RoleRequestDTO,
};

const endpoints = makeApi([
  {
    method: "put",
    path: "/api/v1/internal/users/admin/:userId/status",
    alias: "updateUserStatus",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.record(z.boolean()),
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
    method: "post",
    path: "/api/v1/internal/users/:id/roles",
    alias: "addRole",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: RoleRequestDTO,
      },
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "X-Calling-Service",
        type: "Header",
        schema: z.string(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/internal/users/:id",
    alias: "getUser",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "X-Calling-Service",
        type: "Header",
        schema: z.string(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/internal/users/by-role",
    alias: "getUsersByRole",
    requestFormat: "json",
    parameters: [
      {
        name: "role",
        type: "Query",
        schema: z.enum(["CUSTOMER", "DELIVERY", "RESTAURANT", "ADMIN"]),
      },
      {
        name: "page",
        type: "Query",
        schema: z.number().int().optional().default(0),
      },
      {
        name: "size",
        type: "Query",
        schema: z.number().int().optional().default(50),
      },
      {
        name: "X-Calling-Service",
        type: "Header",
        schema: z.string(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/internal/users/admin/all",
    alias: "getAllUsers",
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
        schema: z.number().int().optional().default(50),
      },
    ],
    response: z.void(),
  },
  {
    method: "delete",
    path: "/api/v1/internal/users/:id/roles/:roleName",
    alias: "removeRole",
    requestFormat: "json",
    parameters: [
      {
        name: "id",
        type: "Path",
        schema: z.string().uuid(),
      },
      {
        name: "roleName",
        type: "Path",
        schema: z.enum(["CUSTOMER", "DELIVERY", "RESTAURANT", "ADMIN"]),
      },
      {
        name: "X-Calling-Service",
        type: "Header",
        schema: z.string(),
      },
    ],
    response: z.void(),
  },
]);

export const Internal_user_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
