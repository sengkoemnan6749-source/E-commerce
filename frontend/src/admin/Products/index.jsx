import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Package, Eye, Star } from 'lucide-react';
import { productService } from '../../services/productService';
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

  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');

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

  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addToast(
        language === 'km' ? 'សូមបញ្ចូលឈ្មោះផលិតផល' : 'Please enter a product name',
        'error'
      );
      return;
    }

    if (modalMode === 'add') {
      productService.addProduct({
        ...formData,
        price: Number(formData.price),
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : null,
        stock: Number(formData.stock),
        rating: 4.8,
        reviewsCount: 1,
        isFeatured: true
      });
      addToast(
        language === 'km'
          ? 'បានបន្ថែមផលិតផលទៅក្នុងកាតាឡុកដោយជោគជ័យ'
          : 'Product added to catalog successfully',
        'success'
      );
    } else if (modalMode === 'edit') {
      productService.updateProduct(activeProduct.id, {
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

    refreshProducts();
    setModalMode(null);
  };

  const handleDeleteConfirm = () => {
    if (activeProduct) {
      productService.deleteProduct(activeProduct.id);
      refreshProducts();
      addToast(
        language === 'km' ? 'បានលុបផលិតផលចេញពីកាតាឡុក' : 'Product removed from catalog',
        'info'
      );
      setModalMode(null);
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {language === 'km' ? 'ការគ្រប់គ្រងផលិតផល' : 'Products Management'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
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

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200/90 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={language === 'km' ? 'ស្វែងរកផលិតផលតាមឈ្មោះ ឬប្រភេទ...' : 'Search products by title or category...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
            {language === 'km' ? 'ប្រភេទ៖' : 'Category:'}
          </span>
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="All">
              {language === 'km' ? 'គ្រប់ប្រភេទទាំងអស់' : 'All Categories'}
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {translateCategory(c.name, language)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">{language === 'km' ? 'ផលិតផល' : 'Product'}</th>
                <th className="py-3 px-4">{language === 'km' ? 'ប្រភេទ' : 'Category'}</th>
                <th className="py-3 px-4">{language === 'km' ? 'តម្លៃ' : 'Price'}</th>
                <th className="py-3 px-4">{language === 'km' ? 'ស្ថានភាពស្តុក' : 'Stock Status'}</th>
                <th className="py-3 px-4">{language === 'km' ? 'ការវាយតម្លៃ' : 'Rating'}</th>
                <th className="py-3 px-4 text-right">{language === 'km' ? 'សកម្មភាព' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((prod) => (
                <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="w-10 h-10 rounded-xl object-cover bg-slate-50 border border-slate-200 flex-shrink-0"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block truncate max-w-xs sm:max-w-md">
                          {prod.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {language === 'km' ? `លេខសម្គាល់៖ #${prod.id}` : `ID: #${prod.id}`}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4 font-semibold text-slate-600">
                    {translateCategory(prod.category, language)}
                  </td>

                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {formatUSD(prod.price)}
                  </td>

                  <td className="py-3 px-4">
                    {prod.stock === 0 ? (
                      <Badge variant="neutral" size="sm">
                        {language === 'km' ? 'អស់ពីស្តុក' : 'Out of Stock'}
                      </Badge>
                    ) : prod.stock <= 5 ? (
                      <Badge variant="warning" size="sm">
                        {language === 'km' ? `នៅសល់តិច (${prod.stock})` : `Low (${prod.stock})`}
                      </Badge>
                    ) : (
                      <Badge variant="success" size="sm">
                        {language === 'km' ? `មានក្នុងស្តុក (${prod.stock})` : `In Stock (${prod.stock})`}
                      </Badge>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 font-semibold text-slate-700">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{prod.rating}</span>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(prod)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title={language === 'km' ? 'កែសម្រួលផលិតផល' : 'Edit hardware'}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenDelete(prod)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title={language === 'km' ? 'លុបផលិតផល' : 'Delete hardware'}
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
