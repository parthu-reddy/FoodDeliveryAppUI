import { z } from "zod";

// Schemas shared across tag files. openapi-zod-client's tag-file grouping emits a shared
// schema into neither file; this restores them. Generated -- do not edit by hand.

export const PayoutDto = z
  .object({
    id: z.string().uuid(),
    payeeType: z.string(),
    payeeId: z.string().uuid(),
    payeeDisplayName: z.string(),
    periodFrom: z.string().datetime({ offset: true }),
    periodTo: z.string().datetime({ offset: true }),
    amount: z.number(),
    currency: z.string(),
    status: z.string(),
    beneficiarySnapshot: z.string(),
    bankReference: z.string(),
    failureReason: z.string(),
    createdBy: z.string().uuid(),
    approvedBy: z.string().uuid(),
    paidBy: z.string().uuid(),
    idempotencyKey: z.string(),
    ledgerTransactionId: z.string().uuid(),
    settledTransactionId: z.string().uuid(),
    createdAt: z.string().datetime({ offset: true }),
    approvedAt: z.string().datetime({ offset: true }),
    paidAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
export const PageResponseDtoPayoutDto = z
  .object({
    content: z.array(PayoutDto),
    totalElements: z.number().int(),
    totalPages: z.number().int(),
    last: z.boolean(),
    size: z.number().int(),
    number: z.number().int(),
    first: z.boolean(),
    numberOfElements: z.number().int(),
    empty: z.boolean(),
  })
  .passthrough();
export const CreatePayoutRequest = z
  .object({
    payeeType: z.string(),
    payeeId: z.string().uuid(),
    periodTo: z.string().datetime({ offset: true }),
    force: z.boolean(),
  })
  .partial()
  .passthrough();
export const Payout = z
  .object({
    id: z.string().uuid(),
    payeeType: z.string(),
    payeeId: z.string().uuid(),
    payeeDisplayName: z.string(),
    periodFrom: z.string().datetime({ offset: true }),
    periodTo: z.string().datetime({ offset: true }),
    amount: z.number(),
    currency: z.string(),
    status: z.enum(["DRAFT", "APPROVED", "PAID", "FAILED", "CANCELLED"]),
    beneficiarySnapshot: z.string(),
    bankReference: z.string(),
    failureReason: z.string(),
    createdBy: z.string().uuid(),
    approvedBy: z.string().uuid(),
    paidBy: z.string().uuid(),
    idempotencyKey: z.string(),
    ledgerTransactionId: z.string().uuid(),
    settledTransactionId: z.string().uuid(),
    createdAt: z.string().datetime({ offset: true }),
    approvedAt: z.string().datetime({ offset: true }),
    paidAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
export const ResolveRequest = z.object({ note: z.string() }).partial().passthrough();
export const LedgerRejectionDto = z
  .object({
    id: z.string().uuid(),
    eventId: z.string(),
    producer: z.string(),
    reason: z.string(),
    payload: z.string(),
    createdAt: z.string().datetime({ offset: true }),
    resolvedAt: z.string().datetime({ offset: true }),
    resolvedBy: z.string(),
    resolutionNote: z.string(),
    ageMinutes: z.number().int(),
  })
  .partial()
  .passthrough();
export const ResolveBreakRequest = z
  .object({ resolvedBy: z.string().uuid(), note: z.string() })
  .partial()
  .passthrough();
export const ReconciliationRun = z
  .object({
    id: z.string().uuid(),
    startedAt: z.string().datetime({ offset: true }),
    finishedAt: z.string().datetime({ offset: true }),
    status: z.string(),
    summary: z.string(),
  })
  .partial()
  .passthrough();
export const CashRemittanceRequest = z
  .object({
    driverId: z.string().uuid(),
    amount: z.number(),
    reference: z.string(),
  })
  .partial()
  .passthrough();
export const CashRemittance = z
  .object({
    id: z.string().uuid(),
    driverId: z.string().uuid(),
    amount: z.number(),
    reference: z.string(),
    recordedBy: z.string().uuid(),
    ledgerTransactionId: z.string().uuid(),
    createdAt: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
export const LedgerStatementLineDto = z
  .object({
    transactionId: z.string().uuid(),
    referenceId: z.string().uuid(),
    accountId: z.string().uuid(),
    ownerId: z.string().uuid(),
    ownerType: z.enum([
      "GATEWAY_RECEIVABLE",
      "CASH_RECEIVABLE",
      "BANK",
      "PLATFORM_CLEARING",
      "PLATFORM_REVENUE",
      "TAX_PAYABLE",
      "PAYOUT_IN_TRANSIT",
      "RESTAURANT_PAYABLE",
      "DRIVER_PAYABLE",
      "CUSTOMER_CREDIT",
      "ADVERTISER_PREPAID",
    ]),
    category: z.enum([
      "DELIVERY_FEE",
      "PLATFORM_FIXED_FEE",
      "PLATFORM_BONUS",
      "FOOD_COST",
      "SGST",
      "CGST",
      "REFUND",
      "ORDER_TOTAL",
      "AD_IMPRESSION",
      "AD_CLICK",
      "AD_CONVERSION",
      "AD_WALLET_TOPUP",
      "CLAWBACK",
      "PAYOUT_TRANSFER",
      "CASH_COLLECTED",
      "CASH_REMITTED",
      "STORE_CREDIT",
    ]),
    amount: z.number(),
    direction: z.enum(["CREDIT", "DEBIT"]),
    createdAt: z.string().datetime({ offset: true }),
    description: z.string(),
    payoutId: z.string().uuid(),
    payoutStatus: z.string(),
    settled: z.boolean(),
  })
  .partial()
  .passthrough();
export const SortObject = z
  .object({ empty: z.boolean(), sorted: z.boolean(), unsorted: z.boolean() })
  .passthrough();
export const PageableObject = z
  .object({
    offset: z.number().int(),
    pageSize: z.number().int(),
    paged: z.boolean(),
    pageNumber: z.number().int(),
    sort: SortObject.optional(),
    unpaged: z.boolean(),
  })
  .passthrough();
export const PageLedgerStatementLineDto = z
  .object({
    totalElements: z.number().int(),
    totalPages: z.number().int(),
    numberOfElements: z.number().int(),
    number: z.number().int(),
    size: z.number().int(),
    content: z.array(LedgerStatementLineDto),
    first: z.boolean(),
    last: z.boolean(),
    pageable: PageableObject.optional(),
    sort: SortObject.optional(),
    empty: z.boolean(),
  })
  .passthrough();
export const PayoutLineDto = z
  .object({
    id: z.string().uuid(),
    payoutId: z.string().uuid(),
    ledgerEntryId: z.string().uuid(),
    referenceId: z.string().uuid(),
    category: z.enum([
      "DELIVERY_FEE",
      "PLATFORM_FIXED_FEE",
      "PLATFORM_BONUS",
      "FOOD_COST",
      "SGST",
      "CGST",
      "REFUND",
      "ORDER_TOTAL",
      "AD_IMPRESSION",
      "AD_CLICK",
      "AD_CONVERSION",
      "AD_WALLET_TOPUP",
      "CLAWBACK",
      "PAYOUT_TRANSFER",
      "CASH_COLLECTED",
      "CASH_REMITTED",
      "STORE_CREDIT",
    ]),
    direction: z.enum(["CREDIT", "DEBIT"]),
    amount: z.number(),
    entryCreatedAt: z.string().datetime({ offset: true }),
    active: z.boolean(),
  })
  .partial()
  .passthrough();
export const PayoutDetailDto = z
  .object({ payout: PayoutDto, lines: z.array(PayoutLineDto) })
  .partial()
  .passthrough();
export const CashRemittanceDto = z
  .object({
    id: z.string().uuid(),
    driverId: z.string().uuid(),
    amount: z.number(),
    reference: z.string(),
    recordedBy: z.string().uuid(),
    ledgerTransactionId: z.string().uuid(),
    createdAt: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
export const PageResponseDtoCashRemittanceDto = z
  .object({
    content: z.array(CashRemittanceDto),
    totalElements: z.number().int(),
    totalPages: z.number().int(),
    last: z.boolean(),
    size: z.number().int(),
    number: z.number().int(),
    first: z.boolean(),
    numberOfElements: z.number().int(),
    empty: z.boolean(),
  })
  .passthrough();
export const CashSummaryDto = z
  .object({
    driverId: z.string().uuid(),
    cashCollected: z.number(),
    cashRemitted: z.number(),
    cashInHand: z.number(),
  })
  .partial()
  .passthrough();
export const LedgerAccount = z
  .object({
    id: z.string().uuid(),
    ownerType: z.enum([
      "GATEWAY_RECEIVABLE",
      "CASH_RECEIVABLE",
      "BANK",
      "PLATFORM_CLEARING",
      "PLATFORM_REVENUE",
      "TAX_PAYABLE",
      "PAYOUT_IN_TRANSIT",
      "RESTAURANT_PAYABLE",
      "DRIVER_PAYABLE",
      "CUSTOMER_CREDIT",
      "ADVERTISER_PREPAID",
    ]),
    ownerId: z.string().uuid(),
    kind: z.enum(["EXTERNAL", "INTERNAL", "PAYABLE", "PREPAID"]).optional(),
    balance: z.number(),
    currency: z.string().optional(),
    lockVersion: z.number().int(),
    createdAt: z.string().datetime({ offset: true }).optional(),
  })
  .passthrough();
export const BeneficiaryResponse = z
  .object({
    accountNumberMasked: z.string(),
    ifsc: z.string(),
    beneficiaryName: z.string(),
    verified: z.boolean(),
    source: z.string(),
  })
  .partial()
  .passthrough();
export const PayeeMoneySummaryDto = z
  .object({
    payeeType: z.string(),
    payeeId: z.string().uuid(),
    unsettledAmount: z.number(),
    pendingPayoutAmount: z.number(),
    lastPayout: PayoutDto,
    beneficiary: BeneficiaryResponse,
  })
  .partial()
  .passthrough();
export const PayoutDetailResponse = z
  .object({
    id: z.string().uuid(),
    payeeType: z.string(),
    payeeId: z.string().uuid(),
    payeeDisplayName: z.string(),
    periodFrom: z.string().datetime({ offset: true }),
    periodTo: z.string().datetime({ offset: true }),
    amount: z.number(),
    currency: z.string(),
    status: z.enum(["DRAFT", "APPROVED", "PAID", "FAILED", "CANCELLED"]),
    beneficiary: BeneficiaryResponse,
    beneficiarySnapshot: z.string(),
    bankReference: z.string(),
    failureReason: z.string(),
    createdBy: z.string().uuid(),
    approvedBy: z.string().uuid(),
    paidBy: z.string().uuid(),
    ledgerTransactionId: z.string().uuid(),
    settledTransactionId: z.string().uuid(),
    createdAt: z.string().datetime({ offset: true }),
    approvedAt: z.string().datetime({ offset: true }),
    paidAt: z.string().datetime({ offset: true }),
    lines: z.array(PayoutLineDto),
  })
  .partial()
  .passthrough();
export const PendingPayoutResponse = z
  .object({
    payeeType: z.string(),
    payeeId: z.string().uuid(),
    displayName: z.string(),
    nameResolved: z.boolean(),
    unsettledAmount: z.number(),
    unsettledSince: z.string().datetime({ offset: true }),
    lineCount: z.number().int(),
    lastPayout: Payout,
    beneficiaryStatus: BeneficiaryResponse,
  })
  .partial()
  .passthrough();
export const LedgerTransactionDto = z
  .object({
    transactionId: z.string().uuid(),
    category: z.enum([
      "DELIVERY_FEE",
      "PLATFORM_FIXED_FEE",
      "PLATFORM_BONUS",
      "FOOD_COST",
      "SGST",
      "CGST",
      "REFUND",
      "ORDER_TOTAL",
      "AD_IMPRESSION",
      "AD_CLICK",
      "AD_CONVERSION",
      "AD_WALLET_TOPUP",
      "CLAWBACK",
      "PAYOUT_TRANSFER",
      "CASH_COLLECTED",
      "CASH_REMITTED",
      "STORE_CREDIT",
    ]),
    fromAccountId: z.string().uuid(),
    toAccountId: z.string().uuid(),
    amount: z.number(),
    date: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const PageResponseDtoLedgerTransactionDto = z
  .object({
    content: z.array(LedgerTransactionDto),
    totalElements: z.number().int(),
    totalPages: z.number().int(),
    last: z.boolean(),
    size: z.number().int(),
    number: z.number().int(),
    first: z.boolean(),
    numberOfElements: z.number().int(),
    empty: z.boolean(),
  })
  .passthrough();
export const ApiResponsePageResponseDtoLedgerTransactionDto = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: PageResponseDtoLedgerTransactionDto.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const PageResponseDtoLedgerRejectionDto = z
  .object({
    content: z.array(LedgerRejectionDto),
    totalElements: z.number().int(),
    totalPages: z.number().int(),
    last: z.boolean(),
    size: z.number().int(),
    number: z.number().int(),
    first: z.boolean(),
    numberOfElements: z.number().int(),
    empty: z.boolean(),
  })
  .passthrough();
export const pageable = z
  .object({
    page: z.number().int().gte(0),
    size: z.number().int().gte(1),
    sort: SortObject,
  })
  .partial()
  .passthrough();
export const PageReconciliationRun = z
  .object({
    totalElements: z.number().int(),
    totalPages: z.number().int(),
    numberOfElements: z.number().int(),
    number: z.number().int(),
    size: z.number().int(),
    content: z.array(ReconciliationRun),
    first: z.boolean(),
    last: z.boolean(),
    pageable: PageableObject.optional(),
    sort: SortObject.optional(),
    empty: z.boolean(),
  })
  .passthrough();
export const ReconciliationBreak = z
  .object({
    id: z.string().uuid(),
    runId: z.string().uuid(),
    kind: z.enum([
      "GATEWAY_VS_LEDGER",
      "ORDERS_VS_CLEARING",
      "WALLET_VS_LEDGER",
      "PAYABLE_VS_ORDERS",
      "DOUBLE_ENTRY",
      "STUCK",
    ]),
    subjectType: z.string(),
    subjectId: z.string().uuid(),
    expected: z.number(),
    actual: z.number(),
    detail: z.string(),
    resolvedAt: z.string().datetime({ offset: true }),
    resolvedBy: z.string().uuid(),
    note: z.string(),
  })
  .partial()
  .passthrough();
export const PageReconciliationBreak = z
  .object({
    totalElements: z.number().int(),
    totalPages: z.number().int(),
    numberOfElements: z.number().int(),
    number: z.number().int(),
    size: z.number().int(),
    content: z.array(ReconciliationBreak),
    first: z.boolean(),
    last: z.boolean(),
    pageable: PageableObject.optional(),
    sort: SortObject.optional(),
    empty: z.boolean(),
  })
  .passthrough();
export const LedgerEntry = z
  .object({
    id: z.string().uuid(),
    transactionId: z.string().uuid(),
    referenceId: z.string().uuid().optional(),
    accountId: z.string().uuid(),
    direction: z.enum(["CREDIT", "DEBIT"]),
    category: z.enum([
      "DELIVERY_FEE",
      "PLATFORM_FIXED_FEE",
      "PLATFORM_BONUS",
      "FOOD_COST",
      "SGST",
      "CGST",
      "REFUND",
      "ORDER_TOTAL",
      "AD_IMPRESSION",
      "AD_CLICK",
      "AD_CONVERSION",
      "AD_WALLET_TOPUP",
      "CLAWBACK",
      "PAYOUT_TRANSFER",
      "CASH_COLLECTED",
      "CASH_REMITTED",
      "STORE_CREDIT",
    ]),
    amount: z.number(),
    producer: z.string().optional(),
    description: z.string().optional(),
    authorizedBy: z.string().optional(),
    createdAt: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const PageResponseDtoLedgerEntry = z
  .object({
    content: z.array(LedgerEntry),
    totalElements: z.number().int(),
    totalPages: z.number().int(),
    last: z.boolean(),
    size: z.number().int(),
    number: z.number().int(),
    first: z.boolean(),
    numberOfElements: z.number().int(),
    empty: z.boolean(),
  })
  .passthrough();
export const ApiResponsePageResponseDtoLedgerEntry = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: PageResponseDtoLedgerEntry.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
export const PageCashRemittance = z
  .object({
    totalElements: z.number().int(),
    totalPages: z.number().int(),
    numberOfElements: z.number().int(),
    number: z.number().int(),
    size: z.number().int(),
    content: z.array(CashRemittance),
    first: z.boolean(),
    last: z.boolean(),
    pageable: PageableObject.optional(),
    sort: SortObject.optional(),
    empty: z.boolean(),
  })
  .passthrough();
export const Pageable = z
  .object({
    page: z.number().int().gte(0),
    size: z.number().int().gte(1),
    sort: SortObject,
  })
  .partial()
  .passthrough();
