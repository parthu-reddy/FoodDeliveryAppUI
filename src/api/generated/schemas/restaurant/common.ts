import { z } from "zod";

export const LocalTime = z
  .object({
    hour: z.number().int(),
    minute: z.number().int(),
    second: z.number().int(),
    nano: z.number().int(),
  })
  .partial()
  .passthrough();
