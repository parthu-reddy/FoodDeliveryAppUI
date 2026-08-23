import type { ZodiosOptions } from "@zodios/core";
import { createApiClient as create_brandVerification } from './brand_verification_controller';
import { createApiClient as create_verification } from './verification_controller';

export function createGovernmentIdFacade(baseUrl: string, options?: ZodiosOptions) {
  return {
  verification: create_verification(baseUrl, options),
  brandVerification: create_brandVerification(baseUrl, options),
  };
}
