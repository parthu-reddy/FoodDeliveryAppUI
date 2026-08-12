import { describe, it, expect } from 'vitest';
import { phoneSchema, otpSchema } from '../src/lib/zod-schemas';

describe('Auto-generated Zod Schemas from OpenAPI', () => {
  
  describe('phoneSchema', () => {
    it('should validate correct phone numbers', () => {
      expect(phoneSchema.safeParse('12345678').success).toBe(true);
      expect(phoneSchema.safeParse('12345678901234567890').success).toBe(true);
    });

    it('should reject numbers shorter than 8 digits', () => {
      expect(phoneSchema.safeParse('1234567').success).toBe(false);
    });

    it('should reject numbers longer than 20 digits', () => {
      expect(phoneSchema.safeParse('123456789012345678901').success).toBe(false);
    });

    it('should reject non-numeric strings', () => {
      expect(phoneSchema.safeParse('1234abcd').success).toBe(false);
    });
  });

  describe('otpSchema', () => {
    it('should validate correct 6-digit OTP', () => {
      expect(otpSchema.safeParse('123456').success).toBe(true);
    });

    it('should reject OTPs shorter than 6 digits', () => {
      expect(otpSchema.safeParse('12345').success).toBe(false);
    });

    it('should reject OTPs longer than 6 digits', () => {
      expect(otpSchema.safeParse('1234567').success).toBe(false);
    });

    it('should reject non-numeric OTPs', () => {
      expect(otpSchema.safeParse('123abc').success).toBe(false);
    });
  });
});
