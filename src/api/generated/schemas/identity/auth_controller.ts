import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

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
]);

export const Auth_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
