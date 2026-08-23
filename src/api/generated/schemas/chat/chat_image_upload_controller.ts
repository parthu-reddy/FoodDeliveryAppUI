import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const endpoints = makeApi([
  {
    method: "post",
    path: "/api/v1/chat/sessions/:sessionId/upload-image",
    alias: "uploadImage",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ file: z.instanceof(File) }).passthrough(),
      },
      {
        name: "sessionId",
        type: "Path",
        schema: z.string().uuid(),
      },
    ],
    response: z.record(z.object({}).partial().passthrough()),
  },
]);

export const Chat_image_upload_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
