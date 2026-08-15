import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const endpoints = makeApi([
  {
    method: "post",
    path: "/api/v1/images/upload",
    alias: "uploadImage",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ file: z.instanceof(File) }).passthrough(),
      },
      {
        name: "folderId",
        type: "Query",
        schema: z.string(),
      },
      {
        name: "imageType",
        type: "Query",
        schema: z.string().optional().default("default"),
      },
    ],
    response: z.any(),
  },
]);

export const Image_upload_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
