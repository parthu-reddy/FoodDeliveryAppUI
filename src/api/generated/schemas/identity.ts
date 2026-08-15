import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const UpdateProfileRequest = z
  .object({
    name: z.string().min(0).max(100),
    email: z.string().min(0).max(255).optional(),
    phone: z
      .string()
      .min(0)
      .max(20)
      .regex(/^\+?[1-9]\d{1,14}$/)
      .optional(),
  })
  .passthrough();
const RoleRequestDTO = z
  .object({ roleName: z.enum(["CUSTOMER", "DELIVERY", "RESTAURANT", "ADMIN"]) })
  .passthrough();
const ApiResponseString = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.string(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
const ApiResponseVoid = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.object({}).partial().passthrough(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
const ApiResponseMapStringString = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.record(z.string()),
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
const UserDTO = z
  .object({
    id: z.string().uuid(),
    phoneNumber: z.string(),
    roles: z.array(z.enum(["CUSTOMER", "DELIVERY", "RESTAURANT", "ADMIN"])),
    active: z.boolean(),
  })
  .partial()
  .passthrough();
const ApiResponseUserDTO = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: UserDTO,
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
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
    size: z.number().int(),
    content: z.array(UserDTO),
    number: z.number().int(),
    sort: z.array(SortObject),
    pageable: PageableObject,
    last: z.boolean(),
    first: z.boolean(),
    numberOfElements: z.number().int(),
    empty: z.boolean(),
  })
  .partial()
  .passthrough();
const ApiResponsePageUserDTO = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: PageUserDTO,
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
const SessionInfo = z
  .object({
    sessionId: z.string(),
    deviceInfo: z.string(),
    os: z.string(),
    browser: z.string(),
    lastActive: z.number().int(),
    serviceName: z.string(),
  })
  .partial()
  .passthrough();
const ApiResponseListSessionInfo = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.array(SessionInfo),
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();

export const schemas = {
  UpdateProfileRequest,
  RoleRequestDTO,
  ApiResponseString,
  ApiResponseVoid,
  ApiResponseMapStringString,
  UserDTO,
  ApiResponseUserDTO,
  SortObject,
  PageableObject,
  PageUserDTO,
  ApiResponsePageUserDTO,
  SessionInfo,
  ApiResponseListSessionInfo,
};

const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/internal/auth/admin/otp",
    alias: "getOtp",
    requestFormat: "json",
    parameters: [
      {
        name: "phoneNumber",
        type: "Query",
        schema: z.string(),
      },
      {
        name: "serviceName",
        type: "Query",
        schema: z.string().optional().default("CUSTOMER"),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/internal/auth/initiate",
    alias: "initiateLogin",
    requestFormat: "json",
    parameters: [
      {
        name: "phoneNumber",
        type: "Query",
        schema: z.string(),
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
    method: "post",
    path: "/api/v1/internal/auth/logout",
    alias: "logout",
    requestFormat: "json",
    parameters: [
      {
        name: "Authorization",
        type: "Header",
        schema: z.string().optional(),
      },
      {
        name: "X-User-Id",
        type: "Header",
        schema: z.string().optional(),
      },
      {
        name: "X-Session-Id",
        type: "Header",
        schema: z.string().optional(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/internal/auth/sessions",
    alias: "getActiveSessions",
    requestFormat: "json",
    parameters: [
      {
        name: "X-User-Id",
        type: "Header",
        schema: z.string().optional(),
      },
    ],
    response: z.void(),
  },
  {
    method: "delete",
    path: "/api/v1/internal/auth/sessions",
    alias: "removeAllSessions",
    requestFormat: "json",
    parameters: [
      {
        name: "X-User-Id",
        type: "Header",
        schema: z.string().optional(),
      },
    ],
    response: z.void(),
  },
  {
    method: "delete",
    path: "/api/v1/internal/auth/sessions/:sessionId",
    alias: "removeSession",
    requestFormat: "json",
    parameters: [
      {
        name: "X-User-Id",
        type: "Header",
        schema: z.string().optional(),
      },
      {
        name: "sessionId",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/internal/auth/verify",
    alias: "verifyOtp",
    requestFormat: "json",
    parameters: [
      {
        name: "phoneNumber",
        type: "Query",
        schema: z.string(),
      },
      {
        name: "otp",
        type: "Query",
        schema: z.string(),
      },
      {
        name: "X-Calling-Service",
        type: "Header",
        schema: z.string(),
      },
      {
        name: "X-Device-Info",
        type: "Header",
        schema: z.string().optional(),
      },
      {
        name: "X-Device-OS",
        type: "Header",
        schema: z.string().optional(),
      },
      {
        name: "X-Device-Browser",
        type: "Header",
        schema: z.string().optional(),
      },
      {
        name: "removeSessionId",
        type: "Query",
        schema: z.string().optional(),
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
    path: "/api/v1/users/profile",
    alias: "getProfile",
    requestFormat: "json",
    parameters: [
      {
        name: "X-User-Id",
        type: "Header",
        schema: z.string(),
      },
    ],
    response: z.void(),
  },
  {
    method: "put",
    path: "/api/v1/users/profile",
    alias: "updateProfile",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateProfileRequest,
      },
      {
        name: "X-User-Id",
        type: "Header",
        schema: z.string(),
      },
    ],
    response: z.void(),
  },
]);

export const api = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
