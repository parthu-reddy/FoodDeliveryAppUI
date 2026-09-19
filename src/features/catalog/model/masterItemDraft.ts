import { z } from 'zod';
import type { MasterMenuItem } from '@/types';
import { vegChoiceOf, vegFromChoice, type VegChoice } from './menuItem';

/**
 * The editable shape of a brand master menu item, and the one place it is validated.
 *
 * `OutletMenuEditor` and `BrandMasterMenu` each carried their own copy of this zod schema and
 * their own payload assembly — four call sites in total. The copies had already drifted: only
 * one of them validated the prep time, and neither validated the packing charge the backend
 * constrains to under ₹10.
 */

export interface MasterItemDraft {
  name: string;
  basePrice: string;
  packingCharge: string;
  prepTimeMinutes: string;
  description: string;
  imageUrl: string;
  categoryId: string;
  /** Tri-state, because unclassified is not the same as non-vegetarian. See `VegChoice`. */
  veg: VegChoice;
}

export const EMPTY_DRAFT: MasterItemDraft = {
  name: '',
  basePrice: '',
  packingCharge: '0',
  prepTimeMinutes: '15',
  description: '',
  imageUrl: '',
  categoryId: '',
  veg: '',
};

const schema = z.object({
  name: z.string().min(1, 'Item name is required').max(100, 'Item name cannot exceed 100 characters'),
  basePrice: z.number().min(0, 'Base price cannot be negative'),
  // The backend schema is `gte(0).lt(10)`; saying so here beats a 400 with no field attached.
  packingCharge: z.number().min(0, 'Packing charge cannot be negative').lt(10, 'Packing charge must be under ₹10'),
  defaultPrepTimeMinutes: z.number().min(1, 'Prep time must be at least 1 minute'),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  imageUrl: z.string().url('Invalid Image URL').max(1000, 'URL too long').optional().or(z.literal('')),
});

/** The draft for an existing item, for the edit form. */
export function draftFromMasterItem(item: MasterMenuItem): MasterItemDraft {
  return {
    name: item.name,
    basePrice: String(item.basePrice),
    packingCharge: String(item.packingCharge ?? 0),
    prepTimeMinutes: String(item.defaultPrepTimeMinutes ?? 15),
    description: item.description || '',
    imageUrl: item.imageUrl || '',
    categoryId: item.categoryId || '',
    veg: vegChoiceOf(item),
  };
}

/** The API payload for a draft — `payload: null` with a message when the draft is invalid. */
export function masterItemPayload(draft: MasterItemDraft) {
  const payload = {
    name: draft.name,
    basePrice: parseFloat(draft.basePrice) || 0,
    packingCharge: parseFloat(draft.packingCharge) || 0,
    description: draft.description,
    categoryId: draft.categoryId || undefined,
    imageUrl: draft.imageUrl,
    isVeg: vegFromChoice(draft.veg),
    defaultPrepTimeMinutes: parseInt(draft.prepTimeMinutes) || 15,
  };
  const parsed = schema.safeParse(payload);
  return parsed.success
    ? { payload, error: null as string | null }
    : { payload: null, error: parsed.error.issues[0].message };
}
