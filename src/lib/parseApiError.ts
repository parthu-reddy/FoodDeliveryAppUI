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
  // If it's an Axios error (which Zodios uses under the hood for API errors)
  if (isAxiosError(error)) {
    logger.error('API Error (Axios)', error);
    
    const dataParse = apiErrorSchema.safeParse(error.response?.data);
    
    if (dataParse.success && (dataParse.data.message || dataParse.data.error)) {
      return {
        message: dataParse.data.message || dataParse.data.error || defaultMessage,
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
    
    const dataParse = apiErrorSchema.safeParse(error.data);
    
    if (dataParse.success && (dataParse.data.message || dataParse.data.error)) {
      return {
        message: dataParse.data.message || dataParse.data.error || defaultMessage,
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
    const objParse = apiErrorSchema.safeParse(error);
    if (objParse.success && objParse.data.message) {
      return {
        message: objParse.data.message,
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
