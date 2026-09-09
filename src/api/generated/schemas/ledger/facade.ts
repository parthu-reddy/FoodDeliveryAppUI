import type { ZodiosOptions } from "@zodios/core";
import { createApiClient as create_payout } from './payout_controller';
import { createApiClient as create_adminLedgerRejection } from './admin_ledger_rejection_controller';
import { createApiClient as create_reconciliation } from './reconciliation_controller';
import { createApiClient as create_cash } from './cash_controller';
import { createApiClient as create_ledgerStatement } from './ledger_statement_controller';
import { createApiClient as create_payeePayout } from './payee_payout_controller';
import { createApiClient as create_ledger } from './ledger_controller';
import { createApiClient as create_payeeCash } from './payee_cash_controller';
import { createApiClient as create_internalPayout } from './internal_payout_controller';
import { createApiClient as create_internalCash } from './internal_cash_controller';
import { createApiClient as create_adminLedger } from './admin_ledger_controller';

export function createLedgerFacade(baseUrl: string, options?: ZodiosOptions) {
  return {
  payout: create_payout(baseUrl, options),
  adminLedgerRejection: create_adminLedgerRejection(baseUrl, options),
  reconciliation: create_reconciliation(baseUrl, options),
  cash: create_cash(baseUrl, options),
  ledgerStatement: create_ledgerStatement(baseUrl, options),
  payeePayout: create_payeePayout(baseUrl, options),
  ledger: create_ledger(baseUrl, options),
  payeeCash: create_payeeCash(baseUrl, options),
  internalPayout: create_internalPayout(baseUrl, options),
  internalCash: create_internalCash(baseUrl, options),
  adminLedger: create_adminLedger(baseUrl, options),
  };
}
