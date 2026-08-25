import { z } from 'zod';
import { logger } from './logger';

export class TypedStorage {
  /**
   * Retrieves an item from localStorage and validates it against the provided schema.
   * If parsing fails or the item doesn't exist, it returns the fallback value.
   */
  static get<T>(key: string, schema: z.ZodType<T>, fallback: T): T {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return fallback;

      // Handle raw string parsing manually if schema is string-based, 
      // otherwise assume it's JSON.
      const parsedItem = (schema instanceof z.ZodString) ? item : JSON.parse(item);
      
      const result = schema.safeParse(parsedItem);
      if (result.success) {
        return result.data;
      }
      
      logger.warn(`Storage item '${key}' failed validation, using fallback`, result.error);
      return fallback;
    } catch (e: unknown) {
      logger.error(`Error parsing storage item '${key}'`, e);
      return fallback;
    }
  }

  /**
   * Validates an item against the schema and stores it in localStorage.
   */
  static set<T>(key: string, value: T, schema: z.ZodType<T>): void {
    const result = schema.safeParse(value);
    if (!result.success) {
      logger.error(`Failed to set storage item '${key}' due to schema mismatch`, result.error);
      return;
    }
    
    try {
      const stringValue = typeof result.data === 'string' ? result.data : JSON.stringify(result.data);
      localStorage.setItem(key, stringValue);
    } catch (e: unknown) {
      logger.error(`Error stringifying storage item '${key}'`, e);
    }
  }

  /**
   * Removes an item from localStorage.
   */
  static remove(key: string): void {
    localStorage.removeItem(key);
  }

  /**
   * Clears all items from localStorage.
   */
  static clear(): void {
    localStorage.clear();
  }
}
