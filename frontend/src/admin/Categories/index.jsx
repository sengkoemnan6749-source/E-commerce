import React, { useState } from 'react';
import { Plus, FolderTree, Edit2, Trash2, Search } from 'lucide-react';
import { productService } from '../../services/productService';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import { useToast, useLanguage } from '../../store/StoreContext';
import { translateCategory } from '../../utils/translations';

export default function AdminCategories() {
  const [categories, setCategories] = useState(productService.getCategories());
  const { addToast } = useToast();
  const { language, t } = useLanguage();

  const [search, setSearch] = useState('');
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

  const handleOpenDelete = (cat) => {
    setActiveCategory(cat);
    setModalMode('delete');
  };

  const handleSaveCategory = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addToast(
        language === 'km' ? 'ត្រូវការឈ្មោះប្រភេទផលិតផល' : 'Category name is required',
        'error'
      );
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
      addToast(
        language === 'km' ? 'បានបន្ថែមប្រភេទផលិតផលដោយជោគជ័យ' : 'Category added successfully',
        'success'
      );
    } else if (modalMode === 'edit') {
      productService.updateCategory(activeCategory.id, {
        name: formData.name,
        slug: slug,
        description: formData.description
      });
      addToast(
        language === 'km' ? 'បានធ្វើបច្ចុប្បន្នភាពប្រភេទផលិតផលដោយជោគជ័យ' : 'Category updated successfully',
        'success'
      );
    }

    refreshCategories();
    setModalMode(null);
  };

  const handleDeleteConfirm = () => {
    if (activeCategory) {
      productService.deleteCategory(activeCategory.id);
      refreshCategories();
      addToast(language === 'km' ? 'បានលុបប្រភេទផលិតផល' : 'Category deleted', 'info');
      setModalMode(null);
    }
  };

  const filtered = categories.filter((cat) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const translated = translateCategory(cat.name, language).toLowerCase();
    return (
      cat.name.toLowerCase().includes(q) ||
      translated.includes(q) ||
      (cat.slug || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {language === 'km' ? 'ការគ្រប់គ្រងប្រភេទផលិតផល' : 'Categories Management'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {language === 'km'
              ? 'រៀបចំផ្នែកផលិតផលអេឡិចត្រូនិច និងចាត់ថ្នាក់រចនាសម្ព័ន្ធកាតាឡុក។'
              : 'Organize electronic departments and classify hardware catalog hierarchy.'}
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={handleOpenAdd}>
          <Plus className="w-4 h-4 mr-1.5" />
          <span>{language === 'km' ? 'បន្ថែមប្រភេទថ្មី' : 'Add New Category'}</span>
        </Button>
      </div>

      {/* Unified Categories Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
            <FolderTree className="w-4 h-4 text-slate-400" />
            <span>
              {language === 'km'
                ? `ប្រភេទសរុប ${filtered.length}`
                : `${filtered.length} ${filtered.length === 1 ? 'category' : 'categories'}`}
            </span>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={language === 'km' ? 'ស្វែងរកប្រភេទផលិតផល...' : 'Search categories...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200/90 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/70 text-slate-500 font-semibold">
                <th className="py-3 px-4">{language === 'km' ? 'ឈ្មោះប្រភេទ' : 'Category Name'}</th>
                <th className="py-3 px-4">{language === 'km' ? 'URL Slug' : 'Slug'}</th>
                <th className="py-3 px-4">{language === 'km' ? 'ការពិពណ៌នា' : 'Description'}</th>
                <th className="py-3 px-4 text-center">{language === 'km' ? 'ចំនួនទំនិញ' : 'Items'}</th>
                <th className="py-3 px-4 text-right">{language === 'km' ? 'សកម្មភាព' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <FolderTree className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium text-slate-700">
                      {language === 'km' ? 'រកមិនឃើញប្រភេទផលិតផលឡើយ' : 'No categories found'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="mt-2 text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                    >
                      {language === 'km' ? 'សម្អាតតម្រង' : 'Clear search'}
                    </button>
                  </td>
                </tr>
              ) : (
                filtered.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {translateCategory(cat.name, language)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                      /{cat.slug}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-md truncate">
                      {language === 'km' && ['audio', 'wearables', 'workspace', 'power'].includes(cat.id)
                        ? t(`cat_desc_${cat.id}`, cat.description)
                        : cat.description}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-8 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold tabular-nums">
                        {cat.count || 0}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(cat)}
                          className="p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title={language === 'km' ? 'កែសម្រួលប្រភេទ' : 'Edit category'}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenDelete(cat)}
                          className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title={language === 'km' ? 'លុបប្រភេទ' : 'Delete category'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Category Modal */}
      {(modalMode === 'add' || modalMode === 'edit') && (
        <Modal
          isOpen={true}
          onClose={() => setModalMode(null)}
          title={
            modalMode === 'add'
              ? language === 'km'
                ? 'បន្ថែមប្រភេទផលិតផល'
                : 'Add Category'
              : language === 'km'
                ? `កែសម្រួល "${translateCategory(activeCategory?.name, language)}"`
                : `Edit "${activeCategory?.name}"`
          }
        >
          <form onSubmit={handleSaveCategory} className="space-y-4">
            <Input
              label={language === 'km' ? 'ឈ្មោះប្រភេទ *' : 'Category Name *'}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={language === 'km' ? 'ឧ. ឧបករណ៍ពាក់ឆ្លាតវៃ' : 'e.g. Smart Wearables'}
              required
            />

            <Input
              label={language === 'km' ? 'URL Slug (ស្រេចចិត្ត)' : 'URL Slug (Optional)'}
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder={language === 'km' ? 'ឧ. smart-wearables' : 'e.g. smart-wearables'}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {language === 'km' ? 'ការពិពណ៌នា' : 'Description'}
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={
                  language === 'km'
                    ? 'សេចក្ដីសង្ខេបប្រភេទផលិតផលសម្រាប់បង្ហាញលើហាង...'
                    : 'Brief category summary for storefront banner...'
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <Button variant="ghost" type="button" onClick={() => setModalMode(null)}>
                {language === 'km' ? 'បោះបង់' : 'Cancel'}
              </Button>
              <Button variant="primary" type="submit">
                {modalMode === 'add'
                  ? language === 'km'
                    ? 'បង្កើតប្រភេទ'
                    : 'Create Category'
                  : language === 'km'
                    ? 'រក្សាទុកការផ្លាស់ប្តូរ'
                    : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Category Confirmation Modal */}
      {modalMode === 'delete' && (
        <Modal
          isOpen={true}
          onClose={() => setModalMode(null)}
          title={language === 'km' ? 'បញ្ជាក់ការលុបប្រភេទផលិតផល' : 'Delete Category Confirmation'}
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              {language === 'km' ? (
                <>
                  តើអ្នកប្រាកដថាចង់លុបប្រភេទផលិតផល <strong>"{translateCategory(activeCategory?.name, language)}"</strong> មែនទេ?
                </>
              ) : (
                <>
                  Are you sure you want to delete the category <strong>"{activeCategory?.name}"</strong>?
                </>
              )}
            </p>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setModalMode(null)}>
                {language === 'km' ? 'បោះបង់' : 'Cancel'}
              </Button>
              <Button variant="danger" onClick={handleDeleteConfirm}>
                {language === 'km' ? 'បញ្ជាក់ការលុប' : 'Confirm Delete'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
