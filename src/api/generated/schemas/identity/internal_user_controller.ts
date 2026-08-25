import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { ApiResponseString } from "./common";

const UserDTO = z
  .object({
    id: z.string().uuid(),
    phoneNumber: z.string(),
    roles: z.array(z.enum(["CUSTOMER", "DELIVERY", "RESTAURANT", "ADMIN"])),
    active: z.boolean().optional(),
  })
  .passthrough();
const ApiResponseUserDTO = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: UserDTO.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
const SortObject = z
  .object({
    direction: z.string(),
    nullHandling: z.string(),
    ascending: z.boolean(),
    property: z.string(),
    ignoreCase: z.boolean(),
  })
  .partial()
  .passthrough();
const PageableObject = z
  .object({
    offset: z.number().int(),
    sort: z.array(SortObject),
    paged: z.boolean(),
    pageNumber: z.number().int(),
    pageSize: z.number().int(),
    unpaged: z.boolean(),
  })
  .partial()
  .passthrough();
const PageUserDTO = z
  .object({
    totalPages: z.number().int(),
    totalElements: z.number().int(),
    numberOfElements: z.number().int(),
    number: z.number().int(),
    size: z.number().int(),
    content: z.array(UserDTO),
    first: z.boolean(),
    last: z.boolean(),
    sort: z.array(SortObject),
    pageable: PageableObject,
    empty: z.boolean(),
  })
  .partial()
  .passthrough();
const ApiResponsePageUserDTO = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: PageUserDTO.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
const RoleRequestDTO = z
  .object({ roleName: z.enum(["CUSTOMER", "DELIVERY", "RESTAURANT", "ADMIN"]) })
  .passthrough();

export const schemas = {
  UserDTO,
  ApiResponseUserDTO,
  SortObject,
  PageableObject,
  PageUserDTO,
  ApiResponsePageUserDTO,
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
    response: ApiResponseString,
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
    response: ApiResponseString,
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
    response: ApiResponseUserDTO,
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
    response: ApiResponsePageUserDTO,
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
    response: ApiResponsePageUserDTO,
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
    response: ApiResponseString,
  },
]);

export const Internal_user_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
