import { ZodiosError } from '@zodios/core';
import { isAxiosError } from 'axios';
import { z } from 'zod';
import { logger } from './logger';

const ErrorDataSchema = z.object({
  message: z.string().optional(),
  code: z.string().optional(),
  error: z.string().optional(),
  details: z.string().optional(),
  reason: z.string().optional(),
  errors: z.array(z.union([
    z.string(),
    z.object({
      message: z.string().optional(),
      defaultMessage: z.string().optional(),
    }).passthrough()
  ])).optional(),
  data: z.record(z.unknown()).optional(),
}).passthrough();

export interface ParsedApiError {
  message: string;
  statusCode?: number;
  originalError: unknown;
}

export function parseApiError(error: unknown, defaultMessage = 'An unexpected error occurred'): ParsedApiError {
  const extractMessageFromData = (data: unknown): string | undefined => {
    if (!data) return undefined;
    if (typeof data === 'string') return data;
    
    const parsed = ErrorDataSchema.safeParse(data);
    if (!parsed.success) return undefined;
    
    const obj = parsed.data;

    // Array of errors (e.g., validation errors)
    if (Array.isArray(obj.errors) && obj.errors.length > 0) {
      const firstErr = obj.errors[0];
      if (typeof firstErr === 'string') return firstErr;
      if (firstErr && typeof firstErr === 'object') {
        if (typeof firstErr.message === 'string') return firstErr.message;
        if (typeof firstErr.defaultMessage === 'string') return firstErr.defaultMessage;
      }
    }

    // Spring Boot standard error / Custom ApiResponse
    if (obj.message && typeof obj.message === 'string') {
      // Check if this is an ApiResponse with a data object containing field errors
      if (obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data) && Object.keys(obj.data).length > 0) {
        try {
          const detailedErrors = Object.entries(obj.data)
            .map(([field, err]) => `${field}: ${String(err)}`)
            .join(', ');
          return `${obj.message}: ${detailedErrors}`;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e: unknown) {
          // fallback to just the message
        }
      }
      return obj.message;
    }

    if (obj.error && typeof obj.error === 'string') return obj.error;
    if (obj.details && typeof obj.details === 'string') return obj.details;
    if (obj.reason && typeof obj.reason === 'string') return obj.reason;

    return undefined;
  };

  // If it's an Axios error (which Zodios uses under the hood for API errors)
  if (isAxiosError(error)) {
    logger.error('API Error (Axios)', error);

    const extractedMessage = extractMessageFromData(error.response?.data);

    if (extractedMessage) {
      return {
        message: extractedMessage,
        statusCode: error.response?.status,
        originalError: error,
      };
    }

    return {
      message: error.message || defaultMessage,
      statusCode: error.response?.status,
      originalError: error,
    };
  }

  // If it's a Zodios validation error
  if (error instanceof ZodiosError) {
    logger.error('API Validation Error (Zodios)', error);

    const extractedMessage = extractMessageFromData(error.data);

    if (extractedMessage) {
      return {
        message: extractedMessage,
        originalError: error,
      };
    }

    // Sometimes Zodios exposes the underlying axios error in .cause
    const causeSchema = z.object({ cause: z.unknown() }).passthrough();
    const parsedCause = causeSchema.safeParse(error);
    const causeError = parsedCause.success ? parsedCause.data.cause : undefined;
    
    const causeMsg = isAxiosError(causeError) ? extractMessageFromData(causeError.response?.data) : undefined;
    if (causeMsg) {
      return {
        message: causeMsg,
        originalError: error,
      };
    }

    return {
      message: error.message || defaultMessage,
      originalError: error,
    };
  }

  // Standard Error
  if (error instanceof Error) {
    logger.error('Application Error', error);
    return {
      message: error.message || defaultMessage,
      originalError: error,
    };
  }

  // Raw API response fallback if it's somehow an object
  if (typeof error === 'object' && error !== null) {
    const extractedMessage = extractMessageFromData(error);
    if (extractedMessage) {
      return {
        message: extractedMessage,
        originalError: error,
      };
    }
  }

  // String fallback
  if (typeof error === 'string') {
    return {
      message: error,
      originalError: error,
    };
  }

  logger.error('Unknown Error Type', error);
  return {
    message: defaultMessage,
    originalError: error,
  };
}
