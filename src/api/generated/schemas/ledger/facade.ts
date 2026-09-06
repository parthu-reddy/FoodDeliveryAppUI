import type { ZodiosOptions } from "@zodios/core";
import { createApiClient as create_ledger } from './ledger_controller';
import { createApiClient as create_cash } from './cash_controller';
import { createApiClient as create_payout } from './payout_controller';
import { createApiClient as create_ledger_statement } from './ledger_statement_controller';

export function createLedgerFacade(baseUrl: string, options?: ZodiosOptions) {
  return {
    ledger: create_ledger(baseUrl, options),
    cash: create_cash(baseUrl, options),
    payout: create_payout(baseUrl, options),
    statement: create_ledger_statement(baseUrl, options),
  };
}
