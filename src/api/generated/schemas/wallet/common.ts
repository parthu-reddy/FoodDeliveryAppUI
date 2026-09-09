import { z } from "zod";

export const WalletDto = z
  .object({
    id: z.string().uuid(),
    entityId: z.string().uuid(),
    entityType: z.enum(["CUSTOMER", "ADVERTISER"]),
    balance: z.number(),
    currency: z.string(),
    status: z.enum(["ACTIVE", "SUSPENDED", "CLOSED"]),
  })
  .passthrough();
export const WalletTransactionDto = z
  .object({
    id: z.string().uuid(),
    walletId: z.string().uuid(),
    amount: z.number(),
    transactionType: z.enum(["CREDIT", "DEBIT"]),
    referenceId: z.string().optional(),
    description: z.string().optional(),
    createdAt: z.string().datetime({ offset: true }),
    metadata: z.string().optional(),
  })
  .passthrough();
export const PageResponseDtoWalletTransactionDto = z
  .object({
    content: z.array(WalletTransactionDto),
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
