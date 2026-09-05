import type { ZodiosOptions } from "@zodios/core";
import { createApiClient as create_adminDlq } from './admin_dlq_controller';
import { createApiClient as create_wallet } from './wallet_controller';
import { createApiClient as create_wallet_topup } from './wallet_topup_controller';

export function createWalletFacade(baseUrl: string, options?: ZodiosOptions) {
  return {
  wallet: create_wallet(baseUrl, options),
  adminDlq: create_adminDlq(baseUrl, options),
  topup: create_wallet_topup(baseUrl, options),
  };
}
