import React, { useState } from 'react';
import { Tags, Plus, Pencil, X } from 'lucide-react';
import { apiPost, apiGet, apiPut } from '../../lib/apiClient';
import { useToast } from '../../context/ToastContext';
import { z } from 'zod';
import { usePolling } from '../../hooks/usePolling';
import { Button, Input, Textarea } from '../ui';

const categorySchema = z.object({
  name: z.string().min(2, "Category name is required").max(100, "Category name cannot exceed 100 characters"),
  description: z.string().max(500, "Description cannot exceed 500 characters").optional()
});

export default function AdminCategories() {
  const { showSuccess, showError } = useToast();
  const [editingCategory, setEditingCategory] = useState<any>(null);

  const { data: categories = [], refetch } = usePolling({
    fetchFn: async () => {
      const res = await apiGet('/api/v1/categories');
      return res.data?.data || res.data || [];
    },
    intervalMs: 30000,
    enabled: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const nameInput = form.elements.namedItem('categoryName') as HTMLInputElement;
    const descInput = form.elements.namedItem('categoryDesc') as HTMLInputElement;
    if (!nameInput.value) return;

    const validation = categorySchema.safeParse({ name: nameInput.value, description: descInput.value });
    if (!validation.success) {
      showError(validation.error.issues[0].message);
      return;
    }

    try {
      if (editingCategory) {
        await apiPut(`/api/v1/categories/${editingCategory.id}`, { name: nameInput.value, description: descInput.value });
        showSuccess('Category updated successfully');
        setEditingCategory(null);
      } else {
        await apiPost('/api/v1/categories', { name: nameInput.value, description: descInput.value });
        showSuccess('Category created successfully');
      }
      form.reset();
      refetch();
    } catch(e) {
      console.error(e);
      showError(editingCategory ? 'Failed to update category' : 'Failed to create category');
    }
  };

  const handleEditClick = (category: any) => {
      setEditingCategory(category);
  };

  const handleCancelEdit = () => {
      setEditingCategory(null);
  };

  return (
    <div className="flex-1 flex p-6 gap-6 h-full overflow-hidden">
        <div className="w-1/3 flex flex-col glass-panel p-4 shrink-0 overflow-y-auto">
            <h3 className="font-black text-xl mb-4 px-2">Existing Categories</h3>
            <div className="space-y-2">
                {categories.map((cat: any) => (
                    <div key={cat.id} className="glass-card p-4 flex justify-between items-center group">
                        <div>
                            <p className="font-bold text-slate-800 dark:text-[#f0ede6]">{cat.name}</p>
                            <p className="text-sm text-slate-500 truncate max-w-[200px]">{cat.description || 'No description'}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(cat)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Pencil className="w-4 h-4" />
                        </Button>
                    </div>
                ))}
                {categories.length === 0 && (
                    <p className="text-sm text-slate-500 p-4">No categories found.</p>
                )}
            </div>
        </div>

      <div className="flex-1 glass-panel p-8 overflow-y-auto">
        <div className="flex items-center gap-4 mb-8 border-b border-slate-200 dark:border-slate-700 pb-6">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Tags className="w-8 h-8" />
            </div>
            <div className="flex-1">
                <h2 className="text-3xl font-black mb-1">{editingCategory ? 'Edit Category' : 'Global Categories'}</h2>
                <p className="text-slate-500">Manage application-wide restaurant and menu categories.</p>
            </div>
            {editingCategory && (
                <Button variant="ghost" size="icon" onClick={handleCancelEdit}>
                    <X className="w-6 h-6 text-slate-500" />
                </Button>
            )}
        </div>
        
        <form onSubmit={handleSubmit} key={editingCategory?.id || 'new'} className="space-y-6 max-w-2xl">
            <div>
                <label className="block text-sm font-bold mb-2 text-slate-600 dark:text-slate-300">Category Name</label>
                <Input name="categoryName" defaultValue={editingCategory?.name || ''} placeholder="e.g. Italian, Vegan, Burgers" />
            </div>
            <div>
                <label className="block text-sm font-bold mb-2 text-slate-600 dark:text-slate-300">Description</label>
                <Textarea name="categoryDesc" defaultValue={editingCategory?.description || ''} placeholder="Brief description of the category..." className="min-h-[120px]" />
            </div>
            <Button type="submit" variant="primary" className="w-full !py-4" icon={<Plus className="w-5 h-5" />}>
                {editingCategory ? 'Update Category' : 'Create Category'}
            </Button>
        </form>
      </div>
    </div>
  );
}
