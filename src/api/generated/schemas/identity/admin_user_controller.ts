import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { ApiResponseString } from "./common";

export const UserDTO = z
  .object({
    id: z.string().uuid(),
    phoneNumber: z.string(),
    roles: z.array(z.enum(["CUSTOMER", "DELIVERY", "RESTAURANT", "ADMIN"])),
    active: z.boolean().optional(),
  })
  .passthrough();
export const ApiResponseUserDTO = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: UserDTO.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const PageResponseDtoUserDTO = z
  .object({
    content: z.array(UserDTO),
    totalElements: z.number().int(),
    totalPages: z.number().int(),
    last: z.boolean(),
    size: z.number().int(),
    number: z.number().int(),
    first: z.boolean(),
    numberOfElements: z.number().int(),
    empty: z.boolean(),
  })
  .passthrough();
export const ApiResponsePageResponseDtoUserDTO = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: PageResponseDtoUserDTO.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const RoleRequestDTO = z
  .object({
    serviceName: z
      .string()
      .min(0)
      .max(50)
      .regex(/^[A-Za-z0-9_\-]+$/),
    roleName: z
      .string()
      .min(0)
      .max(50)
      .regex(/^[A-Za-z0-9_]+$/),
  })
  .passthrough();

export const schemas = {
  UserDTO,
  ApiResponseUserDTO,
  PageResponseDtoUserDTO,
  ApiResponsePageResponseDtoUserDTO,
  RoleRequestDTO,
};

export const endpoints = makeApi([
  {
    method: "put",
    path: "/api/v1/internal/admin/users/:userId/status",
    alias: "updateUserStatus",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ isActive: z.boolean() }).passthrough(),
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
    path: "/api/v1/internal/admin/users/:id/roles",
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
    path: "/api/v1/internal/admin/users/:id",
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
    path: "/api/v1/internal/admin/users/by-role",
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
    response: ApiResponsePageResponseDtoUserDTO,
  },
  {
    method: "get",
    path: "/api/v1/internal/admin/users/by-phone",
    alias: "getUserByPhone",
    requestFormat: "json",
    parameters: [
      {
        name: "phone",
        type: "Query",
        schema: z.string(),
      },
    ],
    response: ApiResponseUserDTO,
  },
  {
    method: "get",
    path: "/api/v1/internal/admin/users/all",
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
    response: ApiResponsePageResponseDtoUserDTO,
  },
  {
    method: "delete",
    path: "/api/v1/internal/admin/users/:id/roles/:roleName",
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

export const Admin_user_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
