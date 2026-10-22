import React, { useState } from 'react';
import { Plus, FolderTree, Edit2, Trash2, Package } from 'lucide-react';
import { productService } from '../../services/productService';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import { useToast } from '../../store/StoreContext';

export default function AdminCategories() {
  const [categories, setCategories] = useState(productService.getCategories());
  const { addToast } = useToast();

  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | 'delete'
  const [activeCategory, setActiveCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: ''
  });

  const refreshCategories = () => {
    setCategories(productService.getCategories());
  };

  const handleOpenAdd = () => {
    setFormData({ name: '', slug: '', description: '' });
    setModalMode('add');
  };

  const handleOpenEdit = (cat) => {
    setActiveCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || ''
    });
    setModalMode('edit');
  };

  const handleSaveCategory = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addToast('Category name is required', 'error');
      return;
    }

    const slug = formData.slug.trim() || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    if (modalMode === 'add') {
      productService.addCategory({
        name: formData.name,
        slug: slug,
        description: formData.description,
        count: 0
      });
      addToast('Category added successfully', 'success');
    } else if (modalMode === 'edit') {
      productService.updateCategory(activeCategory.id, {
        name: formData.name,
        slug: slug,
        description: formData.description
      });
      addToast('Category updated successfully', 'success');
    }

    refreshCategories();
    setModalMode(null);
  };

  const handleDeleteCategory = (cat) => {
    if (window.confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
      productService.deleteCategory(cat.id);
      refreshCategories();
      addToast('Category deleted', 'info');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Categories Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize electronic departments and classify hardware catalog hierarchy.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={handleOpenAdd}>
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Add New Category</span>
        </Button>
      </div>

      {/* Categories Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Category Name</th>
                <th className="py-3 px-4">URL Slug</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-center">Hardware Count</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{cat.name}</td>
                  <td className="py-3.5 px-4 font-mono text-blue-600 font-semibold">{cat.slug}</td>
                  <td className="py-3.5 px-4 text-slate-500 max-w-sm truncate">{cat.description}</td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                    <span className="bg-slate-100 px-2.5 py-1 rounded-full text-xs font-mono">
                      {cat.count || 0}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(cat)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit category"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Category Modal */}
      {(modalMode === 'add' || modalMode === 'edit') && (
        <Modal
          isOpen={true}
          onClose={() => setModalMode(null)}
          title={modalMode === 'add' ? 'Add Category' : `Edit "${activeCategory?.name}"`}
        >
          <form onSubmit={handleSaveCategory} className="space-y-4">
            <Input
              label="Category Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Smart Wearables"
              required
            />

            <Input
              label="URL Slug (Optional)"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="e.g. smart-wearables"
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Description
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief category summary for storefront banner..."
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <Button variant="ghost" type="button" onClick={() => setModalMode(null)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {modalMode === 'add' ? 'Create Category' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
