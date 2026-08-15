import type { ZodiosOptions } from "@zodios/core";
import { createApiClient as create_webhook } from './webhook_controller';
import { createApiClient as create_payment } from './payment_controller';
import { createApiClient as create_adminDlq } from './admin_dlq_controller';

export function createPaymentFacade(baseUrl: string, options?: ZodiosOptions) {
  return {
  webhook: create_webhook(baseUrl, options),
  payment: create_payment(baseUrl, options),
  adminDlq: create_adminDlq(baseUrl, options),
  };
}
