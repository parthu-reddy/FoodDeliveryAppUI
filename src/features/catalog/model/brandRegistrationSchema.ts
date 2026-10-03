import { z } from 'zod';

export const brandSchema = z.object({
 name: z.string().min(1, 'Brand name is required.').max(100, 'Brand name cannot exceed 100 characters.'),
 gstin: z.string().length(15, 'GSTIN must be exactly 15 characters.'),
 pan: z.string().length(10, 'PAN must be exactly 10 characters.'),
 cin: z.string().length(21, 'CIN must be exactly 21 characters.'),
 bankAccount: z.string().min(1, 'Bank Account is required.').max(30, 'Bank Account number too long.'),
 ifsc: z.string().length(11, 'IFSC must be exactly 11 characters.'),
 logoUrl: z.string().url('Invalid Logo URL.').max(1000, 'Logo URL cannot exceed 1000 characters.').optional().or(z.literal(''))
});
