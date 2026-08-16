import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const ParticipantDto = z
  .object({
    userId: z.string(),
    entityType: z.string(),
    displayName: z.string().optional(),
  })
  .passthrough();
const CreateSessionRequest = z
  .object({ orderId: z.string(), participants: z.array(ParticipantDto) })
  .passthrough();

export const schemas = {
  ParticipantDto,
  CreateSessionRequest,
};

const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/chat/sessions",
    alias: "getSessionByOrderId",
    requestFormat: "json",
    parameters: [
      {
        name: "orderId",
        type: "Query",
        schema: z.string(),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/chat/sessions",
    alias: "createOrGetSession",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateSessionRequest,
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/api/v1/chat/sessions/:sessionId/participants",
    alias: "addParticipant",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: ParticipantDto,
      },
      {
        name: "sessionId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/api/v1/chat/sessions/:sessionId/messages",
    alias: "getMessages",
    requestFormat: "json",
    parameters: [
      {
        name: "sessionId",
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
        schema: z.number().int().optional().default(50),
      },
    ],
    response: z.void(),
  },
]);

export const Chat_session_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
