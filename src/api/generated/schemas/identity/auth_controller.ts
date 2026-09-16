import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

import { ApiResponseString } from "./common";

const SessionInfo = z
  .object({
    sessionId: z.string(),
    deviceInfo: z.string(),
    os: z.string(),
    browser: z.string(),
    lastActive: z.number().int(),
    serviceName: z.string(),
  })
  .passthrough();
const ApiResponseListSessionInfo = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: z.array(SessionInfo).optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
const ApiResponseVoid = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: z.object({}).partial().passthrough().optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();

export const schemas = {
  SessionInfo,
  ApiResponseListSessionInfo,
  ApiResponseVoid,
};

const endpoints = makeApi([
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
    response: ApiResponseString,
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
    response: ApiResponseVoid,
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
    response: ApiResponseString,
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
      {
        name: "X-Calling-Service",
        type: "Header",
        schema: z.string().optional(),
      },
    ],
    response: ApiResponseListSessionInfo,
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
      {
        name: "X-Calling-Service",
        type: "Header",
        schema: z.string().optional(),
      },
    ],
    response: ApiResponseVoid,
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
        name: "X-Calling-Service",
        type: "Header",
        schema: z.string().optional(),
      },
      {
        name: "sessionId",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: ApiResponseVoid,
  },
]);

export const Auth_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
