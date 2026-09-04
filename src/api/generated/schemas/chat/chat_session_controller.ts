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
const ChatSessionResponse = z
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
const ApiResponseChatSessionResponse = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: ChatSessionResponse.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
const SortObject = z
  .object({ empty: z.boolean(), sorted: z.boolean(), unsorted: z.boolean() })
  .passthrough();
const PageableObject = z
  .object({
    unpaged: z.boolean(),
    sort: SortObject.optional(),
    paged: z.boolean(),
    pageNumber: z.number().int(),
    pageSize: z.number().int(),
    offset: z.number().int(),
  })
  .passthrough();
const ChatMessageDto = z
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
const PageChatMessageDto = z
  .object({
    totalPages: z.number().int(),
    totalElements: z.number().int(),
    sort: SortObject.optional(),
    pageable: PageableObject.optional(),
    numberOfElements: z.number().int(),
    size: z.number().int(),
    content: z.array(ChatMessageDto),
    number: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
    empty: z.boolean(),
  })
  .passthrough();
const ApiResponsePageChatMessageDto = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: PageChatMessageDto.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();

export const schemas = {
  ParticipantDto,
  CreateSessionRequest,
  ChatSessionResponse,
  ApiResponseChatSessionResponse,
  SortObject,
  PageableObject,
  ChatMessageDto,
  PageChatMessageDto,
  ApiResponsePageChatMessageDto,
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
    response: ApiResponsePageChatMessageDto,
  },
]);

export const Chat_session_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
