import { z } from "zod";

export const UploadResponseDto = z
  .object({ url: z.string(), messageId: z.string() })
  .partial()
  .passthrough();
export const ApiResponseUploadResponseDto = z
  .object({
    success: z.boolean(),
    message: z.string(),
    errorCode: z.string().optional(),
    data: UploadResponseDto.optional(),
    timestamp: z.string().datetime({ offset: true }),
  })
  .passthrough();
