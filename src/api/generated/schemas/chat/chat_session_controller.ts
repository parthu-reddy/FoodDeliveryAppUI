import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

export const ParticipantDto = z
  .object({
    userId: z.string(),
    entityType: z.string(),
    displayName: z.string().optional(),
  })
  .passthrough();
export const CreateSessionRequest = z
  .object({ orderId: z.string(), participants: z.array(ParticipantDto) })
  .passthrough();
export const ChatSessionResponse = z
  .object({
    sessionId: z.string().uuid(),
    sessionType: z.string(),
    referenceId: z.string(),
    isActive: z.boolean(),
    createdAt: z.string().datetime({ offset: true }),
    participants: z.array(ParticipantDto),
  })
  .partial()
  .passthrough();
export const ApiResponseChatSessionResponse = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: ChatSessionResponse.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const ChatMessageDto = z
  .object({
    id: z.string().uuid(),
    sessionId: z.string().uuid(),
    senderId: z.string(),
    senderName: z.string(),
    senderType: z.string(),
    messageType: z.string(),
    content: z.string(),
    imageUrl: z.string(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
export const PageResponseDtoChatMessageDto = z
  .object({
    content: z.array(ChatMessageDto),
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
export const ApiResponsePageResponseDtoChatMessageDto = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: PageResponseDtoChatMessageDto.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();

export const schemas = {
  ParticipantDto,
  CreateSessionRequest,
  ChatSessionResponse,
  ApiResponseChatSessionResponse,
  ChatMessageDto,
  PageResponseDtoChatMessageDto,
  ApiResponsePageResponseDtoChatMessageDto,
};

export const endpoints = makeApi([
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
    response: ApiResponseChatSessionResponse,
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
    response: ApiResponseChatSessionResponse,
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
    response: ApiResponseChatSessionResponse,
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
    response: ApiResponsePageResponseDtoChatMessageDto,
  },
]);

export const Chat_session_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
