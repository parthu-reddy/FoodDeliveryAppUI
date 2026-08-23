import type { ZodiosOptions } from "@zodios/core";
import { createApiClient as create_adminOtp } from './admin_otp_controller';
import { createApiClient as create_auth } from './auth_controller';
import { createApiClient as create_internalUser } from './internal_user_controller';
import { createApiClient as create_user } from './user_controller';

export function createIdentityFacade(baseUrl: string, options?: ZodiosOptions) {
  return {
  user: create_user(baseUrl, options),
  internalUser: create_internalUser(baseUrl, options),
  auth: create_auth(baseUrl, options),
  adminOtp: create_adminOtp(baseUrl, options),
  };
}
