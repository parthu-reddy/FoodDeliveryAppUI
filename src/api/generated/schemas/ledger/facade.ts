import type { ZodiosOptions } from "@zodios/core";
import { createApiClient as create_ledger } from './ledger_controller';

export function createLedgerFacade(baseUrl: string, options?: ZodiosOptions) {
  return {
  ledger: create_ledger(baseUrl, options),
  };
}
