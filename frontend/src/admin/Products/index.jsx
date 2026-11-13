import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, Package, Eye, Star } from 'lucide-react';
import { productService } from '../../services/productService';
import { adminService } from '../../services/adminService';
import { formatUSD } from '../../utils/formatPrice';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import { useToast, useLanguage } from '../../store/StoreContext';
import { translateCategory } from '../../utils/translations';

export default function AdminProducts() {
  const [products, setProducts] = useState(productService.getProducts());
  const categories = productService.getCategories();
  const { addToast } = useToast();
  const { language } = useLanguage();

  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [filterCat, setFilterCat] = useState('All');

  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) setSearch(q);
  }, [searchParams]);

  // Modal State
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | 'delete'
  const [activeProduct, setActiveProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Audio & Acoustics',
    price: 99.00,
    originalPrice: 129.00,
    stock: 25,
    description: '',
    image: '/images/products/prod-001-main.png'
  });

  const refreshProducts = () => {
    setProducts(productService.getProducts());
  };

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      category: categories[0]?.name || 'Audio & Acoustics',
      price: 99.00,
      originalPrice: 129.00,
      stock: 25,
      description: 'Engineered hardware device for high-performance productivity and acoustics.',
      image: '/images/products/prod-001-main.png'
    });
    setModalMode('add');
  };

  const handleOpenEdit = (prod) => {
    setActiveProduct(prod);
    setFormData({
      name: prod.name,
      category: prod.category,
      price: prod.price,
      originalPrice: prod.originalPrice || '',
      stock: prod.stock,
      description: prod.description || '',
      image: prod.image
    });
    setModalMode('edit');
  };

  const handleOpenDelete = (prod) => {
    setActiveProduct(prod);
    setModalMode('delete');
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addToast(
        language === 'km' ? 'សូមបញ្ចូលឈ្មោះផលិតផល' : 'Please enter a product name',
        'error'
      );
      return;
    }

    try {
      if (modalMode === 'add') {
        await adminService.createProduct({
          ...formData,
          price: Number(formData.price),
          originalPrice: formData.originalPrice ? Number(formData.originalPrice) : null,
          stock: Number(formData.stock),
          isFeatured: true
        });
        addToast(
          language === 'km'
            ? 'បានបន្ថែមផលិតផលទៅក្នុងកាតាឡុកដោយជោគជ័យ'
            : 'Product added to catalog successfully',
          'success'
        );
      } else if (modalMode === 'edit') {
        await adminService.updateProduct(activeProduct.id, {
          ...formData,
          price: Number(formData.price),
          originalPrice: formData.originalPrice ? Number(formData.originalPrice) : null,
          stock: Number(formData.stock)
        });
        addToast(
          language === 'km' ? 'បានធ្វើបច្ចុប្បន្នភាពផលិតផលដោយជោគជ័យ' : 'Product updated successfully',
          'success'
        );
      }

      await productService.syncFromBackend();
      refreshProducts();
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('techtonic:admin-updated'));
      setModalMode(null);
    } catch (err) {
      addToast(err?.message || 'Failed to save product.', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!activeProduct) return;
    try {
      await adminService.deleteProduct(activeProduct.id);
      await productService.syncFromBackend();
      refreshProducts();
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('techtonic:admin-updated'));
      addToast(
        language === 'km' ? 'បានលុបផលិតផលចេញពីកាតាឡុក' : 'Product removed from catalog',
        'info'
      );
      setModalMode(null);
    } catch (err) {
      addToast(err?.message || 'Failed to delete product.', 'error');
    }
  };

  const filtered = products.filter((p) => {
    if (filterCat !== 'All' && p.category !== filterCat) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {language === 'km' ? 'ការគ្រប់គ្រងផលិតផល' : 'Products Management'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {language === 'km'
              ? 'បង្កើត កែសម្រួលតម្លៃ ត្រួតពិនិត្យស្តុក និងរៀបចំកាតាឡុកផលិតផល។'
              : 'Create, edit pricing, audit inventory stock, and curate hardware catalog.'}
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={handleOpenAdd}>
          <Plus className="w-4 h-4 mr-1.5" />
          <span>{language === 'km' ? 'បន្ថែមផលិតផលថ្មី' : 'Add New Product'}</span>
        </Button>
      </div>

      {/* Unified Table & Filter Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Quick Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
            <button
              type="button"
              onClick={() => setFilterCat('All')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                filterCat === 'All'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              {language === 'km' ? 'ទាំងអស់' : 'All'} ({products.length})
            </button>
            {categories.map((c) => {
              const active = filterCat === c.name;
              const count = products.filter((p) => p.category === c.name).length;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setFilterCat(c.name)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    active
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                  }`}
                >
                  {translateCategory(c.name, language)} ({count})
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:w-72 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={language === 'km' ? 'ស្វែងរកផលិតផល...' : 'Search products...'}
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
                <th className="py-3 px-4">{language === 'km' ? 'ផលិតផល' : 'Product'}</th>
                <th className="py-3 px-4">{language === 'km' ? 'ប្រភេទ' : 'Category'}</th>
                <th className="py-3 px-4">{language === 'km' ? 'តម្លៃ' : 'Price'}</th>
                <th className="py-3 px-4">{language === 'km' ? 'ស្ថានភាពស្តុក' : 'Stock Status'}</th>
                <th className="py-3 px-4">{language === 'km' ? 'ការវាយតម្លៃ' : 'Rating'}</th>
                <th className="py-3 px-4 text-right">{language === 'km' ? 'សកម្មភាព' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium text-slate-700">
                      {language === 'km' ? 'រកមិនឃើញផលិតផលឡើយ' : 'No products found'}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearch('');
                        setFilterCat('All');
                      }}
                      className="mt-2 text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                    >
                      {language === 'km' ? 'សម្អាតតម្រង' : 'Clear filters'}
                    </button>
                  </td>
                </tr>
              ) : (
                filtered.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-10 h-10 rounded-xl object-contain bg-slate-50 border border-slate-200/80 p-1 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-900 block truncate max-w-xs sm:max-w-sm">
                            {prod.name}
                          </span>
                          <span className="text-[11px] text-slate-400 tabular-nums">
                            #{prod.id}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-600 whitespace-nowrap">
                      {translateCategory(prod.category, language)}
                    </td>

                    <td className="py-3 px-4 tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                      {formatUSD(prod.price)}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {prod.stock === 0 ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          {language === 'km' ? 'អស់ពីស្តុក' : 'Out of Stock'}
                        </span>
                      ) : prod.stock <= 5 ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          {language === 'km' ? `នៅសល់តិច (${prod.stock})` : `Low (${prod.stock})`}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {language === 'km' ? `មានក្នុងស្តុក (${prod.stock})` : `In Stock (${prod.stock})`}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1 font-medium text-slate-700 tabular-nums">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{prod.rating}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(prod)}
                          className="p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title={language === 'km' ? 'កែសម្រួលផលិតផល' : 'Edit product'}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenDelete(prod)}
                          className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title={language === 'km' ? 'លុបផលិតផល' : 'Delete product'}
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

      {/* Add / Edit Modal */}
      {(modalMode === 'add' || modalMode === 'edit') && (
        <Modal
          isOpen={true}
          onClose={() => setModalMode(null)}
          title={
            modalMode === 'add'
              ? language === 'km'
                ? 'បន្ថែមផលិតផលថ្មី'
                : 'Add New Hardware Product'
              : language === 'km'
                ? `កែសម្រួល "${activeProduct?.name}"`
                : `Edit "${activeProduct?.name}"`
          }
        >
          <form onSubmit={handleSaveProduct} className="space-y-4">
            <Input
              label={language === 'km' ? 'ឈ្មោះផលិតផល *' : 'Product Title *'}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  {language === 'km' ? 'ប្រភេទ *' : 'Category *'}
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {translateCategory(c.name, language)}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label={language === 'km' ? 'ចំនួនស្តុក *' : 'Stock Quantity *'}
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label={language === 'km' ? 'តម្លៃលក់ ($) *' : 'Selling Price ($) *'}
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />

              <Input
                label={language === 'km' ? 'តម្លៃដើម ($)' : 'Original Price ($)'}
                type="number"
                step="0.01"
                value={formData.originalPrice}
                onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
              />
            </div>

            <Input
              label={language === 'km' ? 'តំណភ្ជាប់រូបភាព (URL)' : 'Image URL'}
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                {language === 'km' ? 'ការពិពណ៌នា' : 'Description'}
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                    ? 'បង្កើតផលិតផល'
                    : 'Create Product'
                  : language === 'km'
                    ? 'រក្សាទុកការផ្លាស់ប្តូរ'
                    : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {modalMode === 'delete' && (
        <Modal
          isOpen={true}
          onClose={() => setModalMode(null)}
          title={language === 'km' ? 'បញ្ជាក់ការលុបផលិតផល' : 'Delete Product Confirmation'}
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              {language === 'km' ? (
                <>
                  តើអ្នកប្រាកដថាចង់លុប <strong>"{activeProduct?.name}"</strong> ចេញពីកាតាឡុកហាងមែនទេ? សកម្មភាពនេះនឹងធ្វើបច្ចុប្បន្នភាពស្តុករបស់អ្នកភ្លាមៗ។
                </>
              ) : (
                <>
                  Are you sure you want to remove <strong>"{activeProduct?.name}"</strong> from the store catalog? This action will update your inventory in real-time.
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
