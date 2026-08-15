import { z } from 'zod';
import { logger } from './logger';

export function handleZodValidationFailure(error: unknown, context: string) {
  if (error instanceof z.ZodError) {
    const issues = error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
    logger.error(`Zod Validation Failed [${context}]`, {
      issues,
      originalError: error
    });
    return issues;
  } else if (error && typeof error === 'object' && 'response' in error) {
      // Axios error from Zodios
      const axiosError = error;
      // @ts-expect-error Temporarily bypass for API mismatch/TS2589
      if (axiosError.response && axiosError.response.data && axiosError.response.data.issues) {
        // Validation error returned from the server (which may also be Zod formatted)
        // @ts-expect-error Temporarily bypass for API mismatch/TS2589
        const serverIssues = axiosError.response.data.issues;
        logger.error(`Server Validation Failed [${context}]`, {
          issues: serverIssues,
          originalError: error
        });
        return typeof serverIssues === 'string' ? serverIssues : JSON.stringify(serverIssues);
      }
  }
  logger.error(`Unknown Error [${context}]`, { originalError: error });
  return error instanceof Error ? error.message : 'An unknown error occurred';
}
