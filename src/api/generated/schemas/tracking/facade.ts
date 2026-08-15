import type { ZodiosOptions } from "@zodios/core";
import { createApiClient as create_tracking } from './tracking_controller';

export function createTrackingFacade(baseUrl: string, options?: ZodiosOptions) {
  return {
  tracking: create_tracking(baseUrl, options),
  };
}
