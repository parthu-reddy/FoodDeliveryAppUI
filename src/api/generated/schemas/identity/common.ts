import { z } from "zod";

export const ApiResponseString = z
  .object({
    success: z.boolean(),
    message: z.string(),
    data: z.string(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
