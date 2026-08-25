import { z } from "zod";

export const ApiResponseString = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.string().optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
