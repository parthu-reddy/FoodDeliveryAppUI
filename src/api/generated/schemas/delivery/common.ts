import { z } from "zod";

export const DeliveryExecutive = z
  .object({
    id: z.string().uuid(),
    fullName: z.string().optional(),
    phoneNumber: z.string(),
    vehicleNumber: z.string().optional(),
    photoUrl: z.string().optional(),
    email: z.string().optional(),
    status: z.enum(["OFFLINE", "ONLINE", "ON_DELIVERY"]),
    verificationStatus: z
      .enum([
        "PENDING",
        "APPROVED",
        "VERIFIED",
        "REJECTED",
        "MANUAL_REVIEW",
        "FAILED",
      ])
      .optional(),
    vehicleType: z
      .enum(["BICYCLE", "MCWG", "LMV", "EV_TWO_WHEELER"])
      .optional(),
    active: z.boolean().optional(),
    lastBiometricVerificationAt: z
      .string()
      .datetime({ offset: true })
      .optional(),
    cityId: z.string().optional(),
    version: z.number().int().optional(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .passthrough();
