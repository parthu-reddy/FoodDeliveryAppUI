import type { MenuItem } from '@/types';

/** The outlet's override if one has been set this session, else the dish's own flag. */
export function isDishAvailable(stockStatus: Record<string, boolean>, outletId: string, dish: MenuItem): boolean {
  const key = `${outletId}_${dish.id}`;
  return stockStatus[key] !== undefined ? stockStatus[key] : dish.isAvailable !== false;
}
