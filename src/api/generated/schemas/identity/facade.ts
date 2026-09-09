import type { ZodiosOptions } from "@zodios/core";
import { createApiClient as create_user } from './user_controller';
import { createApiClient as create_adminUser } from './admin_user_controller';
import { createApiClient as create_auth } from './auth_controller';
import { createApiClient as create_adminOtp } from './admin_otp_controller';

export function createIdentityFacade(baseUrl: string, options?: ZodiosOptions) {
  return {
  user: create_user(baseUrl, options),
  adminUser: create_adminUser(baseUrl, options),
  auth: create_auth(baseUrl, options),
  adminOtp: create_adminOtp(baseUrl, options),
  };
}
