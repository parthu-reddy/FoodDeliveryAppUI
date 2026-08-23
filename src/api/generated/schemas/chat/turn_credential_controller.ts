import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const IceServer = z
  .object({ urls: z.string(), username: z.string(), credential: z.string() })
  .partial()
  .passthrough();
const TurnCredentialsResponse = z
  .object({ iceServers: z.array(IceServer) })
  .partial()
  .passthrough();

export const schemas = {
  IceServer,
  TurnCredentialsResponse,
};

const endpoints = makeApi([
  {
    method: "get",
    path: "/api/v1/chat/webrtc/ice-servers",
    alias: "getIceServers",
    requestFormat: "json",
    response: TurnCredentialsResponse,
  },
]);

export const Turn_credential_controllerApi = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
