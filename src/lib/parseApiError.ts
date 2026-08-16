import { z } from 'zod';
import { ZodiosError } from '@zodios/core';
import { isAxiosError } from 'axios';
import { logger } from './logger';

// Schema for backend error response format (e.g., { message: "...", code: "..." })
const apiErrorSchema = z.object({
  message: z.string().optional(),
  code: z.string().optional(),
  error: z.string().optional(),
}).passthrough();

export interface ParsedApiError {
  message: string;
  statusCode?: number;
  originalError: unknown;
}

export function parseApiError(error: unknown, defaultMessage = 'An unexpected error occurred'): ParsedApiError {
  const extractMessageFromData = (data: any): string | undefined => {
    if (!data) return undefined;
    if (typeof data === 'string') return data;
    
    // Array of errors (e.g., validation errors)
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      if (typeof data.errors[0] === 'string') return data.errors[0];
      if (data.errors[0].message) return data.errors[0].message;
      if (data.errors[0].defaultMessage) return data.errors[0].defaultMessage;
    }

    // Spring Boot standard error / Custom ApiResponse
    if (data.message && typeof data.message === 'string') {
      // Check if this is an ApiResponse with a data object containing field errors
      if (data.data && typeof data.data === 'object' && !Array.isArray(data.data) && Object.keys(data.data).length > 0) {
        try {
          const detailedErrors = Object.entries(data.data)
            .map(([field, err]) => `${field}: ${err}`)
            .join(', ');
          return `${data.message}: ${detailedErrors}`;
        } catch (e) {
          // fallback to just the message
        }
      }
      return data.message;
    }

    if (data.error && typeof data.error === 'string') return data.error;
    if (data.details && typeof data.details === 'string') return data.details;
    if (data.reason && typeof data.reason === 'string') return data.reason;
    
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
    if (error.cause && isAxiosError(error.cause)) {
      const causeMsg = extractMessageFromData(error.cause.response?.data);
      if (causeMsg) {
        return {
          message: causeMsg,
          originalError: error,
        };
      }
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
