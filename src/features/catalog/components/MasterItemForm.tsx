import React from 'react';
import ImageUploadField from '@features/kyc/components/ImageUploadField';
import { Button, FormField, Input, Select, Surface } from '@shared/ui';
import CategorySelector from './restaurant/CategorySelector';
import type { MasterItemDraft } from '../model/masterItemDraft';
import { VEG_LABEL } from '../model/menuItem';

/**
 * The create/edit form for a brand master menu item.
 *
 * It was written four times: once in `OutletMenuEditor` and three times in `BrandMasterMenu`
 * (create, edit-in-category, edit-in-uncategorised), each with its own copy of the same zod
 * schema. The schemas had already drifted — only one of them validated the prep time.
 *
 * The veg control is new. Both screens sent a hard-coded `isVeg: true` from a `useState(true)`
 * with no setter, so every item any restaurant ever created was recorded as vegetarian and
 * there was no way to say otherwise. The veg marker this phase centralises was reading that.
 */

const VEG_OPTIONS = [
  { value: '', label: VEG_LABEL.unknown },
  { value: 'true', label: VEG_LABEL.veg },
  { value: 'false', label: VEG_LABEL['non-veg'] },
];

interface MasterItemFormProps {
  title: string;
  submitLabel: string;
  draft: MasterItemDraft;
  onChange: (next: MasterItemDraft) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  categories: { id: string; name: string }[];
  /** Where uploaded images are filed — the brand or the outlet. */
  folderId: string;
  /** Outlet-level override controls. Only the outlet editor has any. */
  extra?: React.ReactNode;
}

export function MasterItemForm({
  title,
  submitLabel,
  draft,
  onChange,
  onSubmit,
  onCancel,
  categories,
  folderId,
  extra,
}: MasterItemFormProps) {
  const set = <K extends keyof MasterItemDraft>(key: K, value: MasterItemDraft[K]) =>
    onChange({ ...draft, [key]: value });

  return (
    <Surface radius="lg" elevation={2} className="p-4 relative z-50">
      <h6 className="font-bold text-sm mb-3" style={{ color: 'var(--color-ink)' }}>{title}</h6>
      <form onSubmit={onSubmit} className="space-y-3">
        <FormField label="Item Name" required>
          <Input required value={draft.name} onChange={(e) => set('name', e.target.value)} />
        </FormField>
        <div className="flex gap-2">
          <FormField label="Base Price" required className="flex-1">
            <Input required type="number" step="0.01" min="0" value={draft.basePrice}
                   onChange={(e) => set('basePrice', e.target.value)} />
          </FormField>
          <FormField label="Pack Chg" className="flex-1">
            <Input type="number" step="0.01" min="0" max="9.99" value={draft.packingCharge}
                   onChange={(e) => set('packingCharge', e.target.value)} />
          </FormField>
          <FormField label="Prep (mins)" required className="flex-1">
            <Input required type="number" min="1" value={draft.prepTimeMinutes}
                   onChange={(e) => set('prepTimeMinutes', e.target.value)} />
          </FormField>
        </div>
        <FormField label="Description" required>
          <Input required value={draft.description} onChange={(e) => set('description', e.target.value)} />
        </FormField>
        <FormField label="Vegetarian">
          <Select aria-label="Vegetarian" options={VEG_OPTIONS} value={draft.veg}
                  onChange={(v) => set('veg', v as MasterItemDraft['veg'])} />
        </FormField>
        <div className="z-[60] relative">
          <ImageUploadField value={draft.imageUrl} onChange={(v: string) => set('imageUrl', v)}
                            folderId={folderId} placeholder="Image URL (Optional)" imageType="menu" />
        </div>
        <div className="z-[60] relative">
          <CategorySelector categories={categories} value={draft.categoryId}
                            onChange={(v) => set('categoryId', v)} />
        </div>
        {extra}
        <div className="flex gap-2 pt-1">
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button type="submit" variant="primary" className="flex-1">{submitLabel}</Button>
        </div>
      </form>
    </Surface>
  );
}
