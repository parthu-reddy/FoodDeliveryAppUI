import type { ZodiosOptions } from "@zodios/core";
import { createApiClient as create_internalWallet } from './internal_wallet_controller';
import { createApiClient as create_walletTopup } from './wallet_topup_controller';
import { createApiClient as create_adminDlq } from './admin_dlq_controller';
import { createApiClient as create_payeeWallet } from './payee_wallet_controller';

export function createWalletFacade(baseUrl: string, options?: ZodiosOptions) {
  return {
  internalWallet: create_internalWallet(baseUrl, options),
  walletTopup: create_walletTopup(baseUrl, options),
  adminDlq: create_adminDlq(baseUrl, options),
  payeeWallet: create_payeeWallet(baseUrl, options),
  };
}
