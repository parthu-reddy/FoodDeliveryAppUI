import type { ZodiosOptions } from "@zodios/core";
import { createApiClient as create_integration } from './integration_controller';

export function createMapsFacade(baseUrl: string, options?: ZodiosOptions) {
  return {
  integration: create_integration(baseUrl, options),
  };
}
