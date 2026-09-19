import { useToast } from '@/contexts/ToastContext';
import { parseApiError } from '@/lib/parseApiError';
import { restaurantApi } from '@/lib/zodiosClients';
import type { MasterMenuItem } from '@/types';
import { Button, FormField, Input, Surface } from '@shared/ui';
import { Plus } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { z } from 'zod';
import { CategoryTimingPanel, type CategoryTiming } from '../CategoryTimingPanel';
import { MenuCategoryGroup } from '../MenuCategoryGroup';
import { MenuItemRow } from '../MenuItemRow';
import { MasterItemForm } from '../MasterItemForm';
import {
  EMPTY_DRAFT,
  draftFromMasterItem,
  masterItemPayload,
  type MasterItemDraft,
} from '../../model/masterItemDraft';
import { viewFromMasterItem } from '../../model/menuItem';

const categorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters').max(100, 'Category name cannot exceed 100 characters'),
  description: z.string().max(255, 'Description cannot exceed 255 characters').optional(),
});

interface Category {
  id: string;
  name: string;
  description?: string;
  timings?: CategoryTiming[];
}

interface BrandMasterMenuProps {
  brandId: string;
  onRefresh: () => void;
}

const BrandMasterMenu = React.memo(function BrandMasterMenu({ brandId, onRefresh }: BrandMasterMenuProps) {
  const { showError } = useToast();
  const [masterItems, setMasterItems] = useState<MasterMenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [draft, setDraft] = useState<MasterItemDraft>(EMPTY_DRAFT);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  useEffect(() => {
    if (brandId) {
      fetchCategories();
      fetchMasterItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId]);

  const fetchCategories = async () => {
    try {
      const data = await restaurantApi.category.get('/api/v1/brands/:brandId/categories', { params: { brandId } });
      if (!data.success || !data.data) return;
      setCategories(await Promise.all(
        (data.data as unknown as Category[]).map(async (cat) => {
          try {
            const tRes = await restaurantApi.category.get('/api/v1/brands/:brandId/categories/:categoryId/timings', { params: { brandId, categoryId: cat.id } });
            return { ...cat, timings: (tRes.success && tRes.data ? tRes.data : []) as CategoryTiming[] };
          } catch { return { ...cat, timings: [] }; }
        }),
      ));
    } catch (e: unknown) { console.error(e); }
  };

  const fetchMasterItems = async () => {
    if (!brandId || brandId === 'undefined') return;
    try {
      const response = await restaurantApi.catalog.get('/api/v1/brands/:brandId/master-menu', { params: { brandId } });
      setMasterItems((response.data as MasterMenuItem[]) || []);
    } catch (e: unknown) { console.error(e); }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = categorySchema.safeParse({ name: newCatName, description: newCatDesc });
    if (!validation.success) return showError(validation.error.issues[0].message);
    try {
      await restaurantApi.category.post('/api/v1/brands/:brandId/categories', { name: newCatName, description: newCatDesc }, { params: { brandId } });
      setIsAddingCategory(false);
      setNewCatName('');
      setNewCatDesc('');
      fetchCategories();
    } catch (e: unknown) {
      console.error(e);
      showError(parseApiError(e, 'Failed to create category').message);
    }
  };

  const saveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const { payload, error } = masterItemPayload(draft);
    if (!payload) return showError(error as string);
    try {
      if (editingItemId) {
        await restaurantApi.catalog.put('/api/v1/brands/:brandId/master-menu/:itemId', payload, { params: { brandId, itemId: editingItemId } });
      } else {
        await restaurantApi.catalog.post('/api/v1/brands/:brandId/master-menu', payload, { params: { brandId } });
      }
      setEditingItemId(null);
      setIsAddingItem(false);
      setDraft(EMPTY_DRAFT);
      fetchMasterItems();
      onRefresh();
    } catch (e: unknown) {
      console.error(e);
      showError(parseApiError(e, 'Failed to save menu item. Please try again.').message);
    }
  };

  const handleSaveTimings = async (catId: string, openingTime: string, closingTime: string) => {
    try {
      await restaurantApi.category.post('/api/v1/brands/:brandId/categories/timings', {
        packingCharge: 0,
        categoryId: catId,
        timings: [{ openingTime: `${openingTime}:00`, closingTime: `${closingTime}:00` }],
      }, { params: { brandId } });
      fetchCategories();
    } catch (e: unknown) {
      console.error(e);
      showError(parseApiError(e, 'Failed to save timings').message);
    }
  };

  const startEditing = (id: string) => {
    const item = masterItems.find((i) => i.id === id);
    if (!item) return;
    setIsAddingItem(false);
    setDraft(draftFromMasterItem(item));
    setEditingItemId(id);
  };

  const cancelForm = () => {
    setEditingItemId(null);
    setIsAddingItem(false);
    setDraft(EMPTY_DRAFT);
  };

  // Uncategorised items are a group like any other, so the whole block below is written once.
  // It used to be a second, near-identical copy of the category loop.
  const orphans = masterItems.filter((i) => !categories.some((c) => c.id === i.categoryId));
  const groups: (Category & { items: MasterMenuItem[]; timed: boolean })[] = [
    ...categories.map((c) => ({
      ...c, timed: true, items: masterItems.filter((i) => i.categoryId === c.id),
    })),
    ...(orphans.length
      ? [{ id: '', name: 'Uncategorized', timed: false, items: orphans }]
      : []),
  ];

  return (
    <div className="space-y-6 mt-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h5 className="font-extrabold text-xs uppercase tracking-wider" style={{ color: 'var(--color-ink)' }}>
            Brand Master Menu
          </h5>
          <p className="text-[10px] mt-1" style={{ color: 'var(--color-ink-2)' }}>
            Manage categories, menu items, and global availability hours.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="warning" icon={<Plus className="w-3 h-3" />}
                  onClick={() => { cancelForm(); setIsAddingItem(true); setIsAddingCategory(false); }}>
            Add Item
          </Button>
          <Button variant="primary" icon={<Plus className="w-3 h-3" />}
                  onClick={() => { setIsAddingCategory(true); setIsAddingItem(false); }}>
            Add Category
          </Button>
        </div>
      </div>

      {isAddingCategory && (
        <Surface radius="lg" elevation={2} className="p-4">
          <h6 className="font-bold text-sm mb-3" style={{ color: 'var(--color-ink)' }}>Create New Category</h6>
          <form onSubmit={handleCreateCategory} className="space-y-3">
            <FormField label="Category Name (e.g. Appetizers)" required>
              <Input required value={newCatName} onChange={(e) => setNewCatName(e.target.value)} />
            </FormField>
            <FormField label="Description (Optional)">
              <Input value={newCatDesc} onChange={(e) => setNewCatDesc(e.target.value)} />
            </FormField>
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setIsAddingCategory(false)}>Cancel</Button>
              <Button type="submit" variant="primary" className="flex-1">Save Category</Button>
            </div>
          </form>
        </Surface>
      )}

      {isAddingItem && (
        <MasterItemForm
          title="Create New Menu Item" submitLabel="Save Item" draft={draft} onChange={setDraft}
          onSubmit={saveItem} onCancel={cancelForm} categories={categories} folderId={brandId}
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
            emptyMessage="Click Add Item above to create items in this category."
            aside={group.timed && (
              <CategoryTimingPanel
                title="Active Windows"
                timings={group.timings}
                onSave={(open, close) => handleSaveTimings(group.id, open, close)}
              />
            )}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.items.map((item) => (
                <Surface key={item.id} radius="lg" elevation={1}
                         className={`p-3 ${editingItemId === item.id ? 'relative z-50' : ''}`}>
                  {editingItemId === item.id ? (
                    <MasterItemForm
                      title="Edit Item" submitLabel="Save" draft={draft} onChange={setDraft}
                      onSubmit={saveItem} onCancel={cancelForm} categories={categories} folderId={brandId}
                    />
                  ) : (
                    <MenuItemRow
                      view={viewFromMasterItem(item)}
                      can={{ edit: true }}
                      onEdit={startEditing}
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
});

export default BrandMasterMenu;
