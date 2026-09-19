import { useToast } from '@/contexts/ToastContext';
import { parseApiError } from '@/lib/parseApiError';
import { restaurantApi } from '@/lib/zodiosClients';
import type { MasterMenuItem } from '@/types';
import { Plus, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { z } from 'zod';
import { Button, FormField, Input, Select, Surface } from '@shared/ui';
import { CategoryTimingPanel, type CategoryTiming } from '../CategoryTimingPanel';
import { MenuCategoryGroup } from '../MenuCategoryGroup';
import { MenuItemRow } from '../MenuItemRow';
import { MasterItemForm } from '../MasterItemForm';
import {
  EMPTY_DRAFT,
  masterItemPayload,
  type MasterItemDraft,
} from '../../model/masterItemDraft';
import { viewFromMasterItem, type OutletOverrideView } from '../../model/menuItem';

const overrideSchema = z.object({
  overriddenPrice: z.number().min(0, 'Override price cannot be negative').nullable().optional(),
  overriddenPrepTimeMinutes: z.number().min(1, 'Prep time must be at least 1 min').nullable().optional(),
});

interface EditorCategory {
  id: string;
  name: string;
  description?: string;
  timings?: CategoryTiming[];
  brandTimings?: CategoryTiming[];
}

interface OverrideItem extends OutletOverrideView {
  id: string;
  masterMenuItemId?: string;
  outletId?: string;
}

const STATUS_OPTIONS = [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }];

interface OutletMenuEditorProps {
  restaurantId: string; // Outlet ID
  brandId: string; // Brand UUID from the backend
  onRefresh: () => void;
}

export default function OutletMenuEditor({ restaurantId, brandId, onRefresh }: OutletMenuEditorProps) {
  const { showError } = useToast();
  const [selectedOutlet, setSelectedOutlet] = useState<string>(restaurantId);
  const [masterItems, setMasterItems] = useState<MasterMenuItem[]>([]);
  const [categories, setCategories] = useState<EditorCategory[]>([]);
  const [overrides, setOverrides] = useState<OverrideItem[]>([]);
  const [draft, setDraft] = useState<MasterItemDraft>(EMPTY_DRAFT);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingOverrideFor, setEditingOverrideFor] = useState<string | null>(null);
  const [oPrice, setOPrice] = useState('');
  const [oPrepTime, setOPrepTime] = useState('');
  const [oActive, setOActive] = useState(true);

  useEffect(() => {
    if (restaurantId && restaurantId !== selectedOutlet) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedOutlet(restaurantId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    fetchOverrides(selectedOutlet);
  }, [selectedOutlet]);

  useEffect(() => {
    if (brandId && selectedOutlet) {
      // eslint-disable-next-line react-hooks/immutability
      fetchCategories();
      // eslint-disable-next-line react-hooks/immutability
      fetchMasterItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId, selectedOutlet]);

  const timingsOf = async (url: '/api/v1/outlets/:outletId/categories/:categoryId/timings' | '/api/v1/brands/:brandId/categories/:categoryId/timings', params: Record<string, string>) => {
    try {
      const res = await restaurantApi.category.get(url, { params } as never);
      return (res.success && res.data ? res.data : []) as CategoryTiming[];
    } catch { return [] as CategoryTiming[]; }
  };

  const fetchCategories = async () => {
    try {
      const data = await restaurantApi.category.get('/api/v1/brands/:brandId/categories', { params: { brandId } });
      if (!data.success || !data.data) return;
      setCategories(await Promise.all(
        (data.data as unknown as EditorCategory[]).map(async (cat) => ({
          ...cat,
          timings: await timingsOf('/api/v1/outlets/:outletId/categories/:categoryId/timings', { outletId: selectedOutlet, categoryId: cat.id }),
          brandTimings: await timingsOf('/api/v1/brands/:brandId/categories/:categoryId/timings', { brandId, categoryId: cat.id }),
        })),
      ));
    } catch (e) { console.error(e); }
  };

  const fetchMasterItems = async () => {
    if (!brandId || brandId === 'undefined') return;
    try {
      const response = await restaurantApi.catalog.get('/api/v1/brands/:brandId/master-menu', { params: { brandId } });
      setMasterItems((response.data as MasterMenuItem[]) || []);
    } catch (e) { console.error(e); }
  };

  const fetchOverrides = async (targetOutlet: string) => {
    if (!targetOutlet) return;
    try {
      const response = await restaurantApi.catalog.get('/api/v1/outlets/:outletId/menu-overrides', { params: { outletId: targetOutlet } });
      setOverrides((response.data as OverrideItem[]) || []);
    } catch (e) { console.error(e); }
  };

  const handleSaveTimings = async (catId: string, openingTime: string, closingTime: string) => {
    try {
      await restaurantApi.category.post('/api/v1/outlets/:outletId/categories/timings', {
        categoryId: catId,
        timings: [{ openingTime: `${openingTime}:00`, closingTime: `${closingTime}:00` }],
      }, { params: { outletId: selectedOutlet } });
      fetchCategories();
    } catch (e) {
      console.error(e);
      showError(parseApiError(e, 'Failed to save timings').message);
    }
  };

  /** The override payload, or null with the message to show. */
  const overridePayload = () => {
    const payload = {
      overriddenPrice: oPrice ? parseFloat(oPrice) : undefined,
      isAvailable: oActive,
      overriddenPrepTimeMinutes: oPrepTime ? parseInt(oPrepTime) : undefined,
    };
    const parsed = overrideSchema.safeParse(payload);
    return parsed.success ? { payload, error: null } : { payload: null, error: parsed.error.issues[0].message };
  };

  const saveOverride = async (masterItemId: string) => {
    const { payload, error } = overridePayload();
    if (!payload) { showError(error as string); return false; }
    await restaurantApi.catalog.post('/api/v1/outlets/:outletId/menu-overrides/:masterMenuItemId', payload, { params: { outletId: selectedOutlet, masterMenuItemId: masterItemId } });
    return true;
  };

  const resetOverrideFields = () => { setOPrice(''); setOPrepTime(''); setOActive(true); };

  const handleEditOverride = async (e: React.FormEvent, masterItemId: string) => {
    e.preventDefault();
    if (!(await saveOverride(masterItemId))) return;
    setEditingOverrideFor(null);
    resetOverrideFields();
    fetchOverrides(selectedOutlet);
    onRefresh();
  };

  // Creating an item here writes the brand master item AND this outlet's override for it, so
  // the item exists everywhere and starts with the price this outlet chose.
  const handleCreateOutletItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const { payload, error } = masterItemPayload(draft);
    if (!payload) return showError(error as string);
    try {
      const newMaster = await restaurantApi.catalog.post('/api/v1/brands/:brandId/master-menu', payload, { params: { brandId } });
      if (!(await saveOverride(newMaster.data?.id ?? ''))) return;
      setIsAddingItem(false);
      setDraft(EMPTY_DRAFT);
      resetOverrideFields();
      fetchMasterItems();
      fetchOverrides(selectedOutlet);
      onRefresh();
    } catch (err) {
      console.error(err);
      showError(parseApiError(err, 'Failed to create menu item').message);
    }
  };

  const startEditingOverride = (masterItemId: string) => {
    const current = overrides.find((o) => o.masterMenuItemId === masterItemId);
    setOPrice(current?.overriddenPrice != null ? String(current.overriddenPrice) : '');
    setOPrepTime(current?.overriddenPrepTimeMinutes != null ? String(current.overriddenPrepTimeMinutes) : '');
    setOActive(current?.isAvailable !== false);
    setEditingOverrideFor(masterItemId);
  };

  const overrideFields = (
    <div className="grid grid-cols-3 gap-3">
      <FormField label="Price"><Input type="number" step="0.01" min="0" placeholder="Override" value={oPrice} onChange={(e) => setOPrice(e.target.value)} /></FormField>
      <FormField label="Prep"><Input type="number" min="1" placeholder="Override" value={oPrepTime} onChange={(e) => setOPrepTime(e.target.value)} /></FormField>
      <FormField label="Status"><Select selectSize="sm" aria-label="Item status" value={oActive ? 'true' : 'false'} onChange={(v) => setOActive(v === 'true')} options={STATUS_OPTIONS} /></FormField>
    </div>
  );

  // Uncategorised items are a group like any other, so the block below is written once. It
  // used to be a second, near-identical copy of the category loop that had already drifted:
  // it left the packing charge out of the price it displayed.
  const orphans = masterItems.filter((i) => !categories.some((c) => c.id === i.categoryId));
  const groups: (EditorCategory & { items: MasterMenuItem[]; timed: boolean })[] = [
    ...categories.map((c) => ({ ...c, timed: true, items: masterItems.filter((i) => i.categoryId === c.id) })),
    ...(orphans.length ? [{ id: '', name: 'Uncategorized', timed: false, items: orphans }] : []),
  ];

  return (
    <div className="space-y-6 mt-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h5 className="font-extrabold text-xs uppercase tracking-wider" style={{ color: 'var(--color-ink)' }}>
            Menu Catalog Editor
          </h5>
          <p className="text-[10px] mt-1" style={{ color: 'var(--color-ink-2)' }}>
            Manage outlet-specific overrides, items, and category availability.
          </p>
        </div>
        <Button variant="warning" icon={<Plus className="w-3 h-3" />}
                onClick={() => { setDraft(EMPTY_DRAFT); resetOverrideFields(); setIsAddingItem(true); }}>
          Add Item
        </Button>
      </div>

      {isAddingItem && (
        <MasterItemForm
          title="Create New Outlet Item" submitLabel="Save Item" draft={draft} onChange={setDraft}
          onSubmit={handleCreateOutletItem} onCancel={() => setIsAddingItem(false)}
          categories={categories} folderId={restaurantId} extra={overrideFields}
        />
      )}

      <div className="space-y-8">
        {groups.map((group) => (
          <MenuCategoryGroup
            key={group.id || 'uncategorized'}
            title={group.name}
            description={group.description}
            framed
            itemCount={group.items.length}
            emptyMessage="This category has no items. Add items from the Brand Master Menu."
            aside={group.timed && (
              <CategoryTimingPanel
                title="Outlet Override Timings"
                timings={group.timings}
                fallback={{ label: 'Fallback to Brand timings:', timings: group.brandTimings }}
                onSave={(open, close) => handleSaveTimings(group.id, open, close)}
              />
            )}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.items.map((item) => (
                <Surface key={item.id} radius="lg" elevation={1} className="p-4">
                  {editingOverrideFor === item.id ? (
                    <form onSubmit={(e) => handleEditOverride(e, item.id as string)} className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h6 className="font-bold text-sm" style={{ color: 'var(--color-ink)' }}>
                          Edit Override for {item.name}
                        </h6>
                        <Button type="button" variant="ghost" size="xs" aria-label="Cancel override"
                                onClick={() => setEditingOverrideFor(null)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      {overrideFields}
                      <div className="flex justify-end">
                        <Button type="submit" variant="primary" size="sm">Save Override</Button>
                      </div>
                    </form>
                  ) : (
                    <MenuItemRow
                      view={viewFromMasterItem(item, overrides.find((o) => o.masterMenuItemId === item.id))}
                      can={{ edit: true }}
                      onEdit={startEditingOverride}
                    />
                  )}
                </Surface>
              ))}
            </div>
          </MenuCategoryGroup>
        ))}
      </div>
    </div>
  );
}
