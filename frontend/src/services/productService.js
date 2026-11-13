import { api } from './api';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from './mockData';

const PRODUCTS_KEY = 'techtonic_products_v21';
const CATEGORIES_KEY = 'techtonic_categories_v21';

// Purge obsolete cached stores to ensure fresh 40-product multi-variant catalog
try {
  ['techtonic_products', 'techtonic_products_v1', 'techtonic_products_v2', 'techtonic_products_v3', 'techtonic_products_v4', 'techtonic_products_v5', 'techtonic_products_v6', 'techtonic_products_v7', 'techtonic_products_v8', 'techtonic_products_v9', 'techtonic_products_v10', 'techtonic_products_v11', 'techtonic_products_v12', 'techtonic_products_v13', 'techtonic_products_v14', 'techtonic_products_v15', 'techtonic_products_v16', 'techtonic_products_v17', 'techtonic_products_v18', 'techtonic_products_v19', 'techtonic_products_v20'].forEach(k => {
    localStorage.removeItem(k);
  });
  ['techtonic_categories', 'techtonic_categories_v1', 'techtonic_categories_v2', 'techtonic_categories_v3', 'techtonic_categories_v4', 'techtonic_categories_v5', 'techtonic_categories_v6', 'techtonic_categories_v7', 'techtonic_categories_v8', 'techtonic_categories_v9', 'techtonic_categories_v10', 'techtonic_categories_v11', 'techtonic_categories_v12', 'techtonic_categories_v13', 'techtonic_categories_v14', 'techtonic_categories_v15', 'techtonic_categories_v16', 'techtonic_categories_v17', 'techtonic_categories_v18', 'techtonic_categories_v19', 'techtonic_categories_v20'].forEach(k => {
    localStorage.removeItem(k);
  });
} catch {}

function toCleanPng(path) {
  if (!path || typeof path !== 'string') return '/images/products/prod-001-main.png';
  if (path.includes('unsplash.com')) return '/images/products/prod-001-main.png';
  return path.replace(/\.jpg$/i, '.png');
}

function getStored(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setStored(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to save to ${key}:`, e);
  }
}

function normalizeProduct(p) {
  if (!p) return null;
  const mockMatch = INITIAL_PRODUCTS.find(m => m.id === p.id);
  
  let primaryImg = toCleanPng(
    (mockMatch?.images?.[0]) || p.image || (p.images && p.images[0]) || '/images/products/prod-001-main.png'
  );

  const allImages = (mockMatch?.images || p.gallery || p.images || [primaryImg]).map(toCleanPng);

  const variants = (mockMatch?.variants || p.variants || []).map((v, idx) => {
    const mockVariant = mockMatch?.variants?.[idx] || v;
    let hex = mockVariant?.colorHex || v.colorHex;
    if (!hex) {
      const name = (v.name || '').toLowerCase();
      if (name.includes('black') || name.includes('obsidian') || name.includes('matte black') || name.includes('charcoal')) hex = '#18181b';
      else if (name.includes('white') || name.includes('polar') || name.includes('pearl') || name.includes('arctic')) hex = '#f8fafc';
      else if (name.includes('silver') || name.includes('slate') || name.includes('titanium') || name.includes('grey') || name.includes('gray')) hex = '#cbd5e1';
      else if (name.includes('champagne') || name.includes('gold')) hex = '#d4af37';
      else if (name.includes('sage') || name.includes('green')) hex = '#65a30d';
      else if (name.includes('red') || name.includes('linear')) hex = '#ef4444';
      else if (name.includes('brown') || name.includes('tactile')) hex = '#92400e';
      else if (name.includes('cream')) hex = '#fef08a';
      else hex = ['#2563eb', '#64748b', '#0f172a', '#10b981', '#f59e0b'][idx % 5];
    }
    const rawVariantImg = (v.image && !v.image.includes('unsplash.com')) ? v.image : (mockVariant?.image || allImages[idx] || primaryImg);
    const variantImg = toCleanPng(rawVariantImg);
    return {
      ...v,
      colorHex: hex,
      image: variantImg,
      inStock: v.inStock !== false
    };
  });

  const variantImages = variants.map(v => v.image).filter(Boolean);
  const combinedGallery = Array.from(new Set([...allImages, ...variantImages]));
  const secondaryImg = toCleanPng(allImages[1] || mockMatch?.images?.[1] || combinedGallery[1] || primaryImg);

  return {
    ...p,
    image: primaryImg,
    secondaryImage: secondaryImg,
    images: combinedGallery,
    gallery: combinedGallery,
    variants: variants,
    category: p.categoryName || p.category || 'Audio & Acoustics',
    categoryId: p.categoryId || mockMatch?.category || p.category || 'audio',
    subcategory: p.subcategory || mockMatch?.subcategory || null,
    subcategorySlug: p.subcategorySlug || mockMatch?.subcategorySlug || null,
    specs: p.specs || {
      'Connectivity': 'Bluetooth 5.3 + 2.4GHz Wireless + USB-C',
      'Battery Life': 'Up to 60 Hours continuous playback',
      'Charging Time': 'Full charge in 45 minutes via Fast GaN',
      'Materials': 'Aerospace Grade CNC Aluminum + Memory Foam',
      'Warranty': '12-Month Official TechTonic Replacement'
    },
    inBox: p.inBox || [
      'TechTonic Hardware Unit',
      'Braided 100W USB-C to USB-C Cable (1.8m)',
      'Hardshell Travel Case with Magnetic Latch',
      'Warranty Authentication Card & Manual'
    ]
  };
}

export const productService = {
  getProducts() {
    const list = getStored(PRODUCTS_KEY, INITIAL_PRODUCTS);
    return list.map(normalizeProduct);
  },

  getProductById(id) {
    const products = this.getProducts();
    return products.find(p => String(p.id) === String(id) || p.slug === id) || null;
  },

  getCleanProductImage(itemOrProduct, variantName = null) {
    if (!itemOrProduct) return '/images/products/prod-001-main.png';

    const productId = itemOrProduct.id || itemOrProduct.productId;
    const product = this.getProductById(productId);

    const targetVariant = variantName || itemOrProduct.selectedVariant || itemOrProduct.variant;

    if (product) {
      if (targetVariant && product.variants?.length > 0) {
        const v = product.variants.find(
          varItem => (varItem.name || '').toLowerCase() === (targetVariant || '').toLowerCase()
        );
        if (v?.image && !v.image.includes('unsplash.com')) {
          return v.image;
        }
      }
      if (product.image && !product.image.includes('unsplash.com')) {
        return product.image;
      }
      if (product.images?.[0] && !product.images[0].includes('unsplash.com')) {
        return product.images[0];
      }
    }

    const raw = itemOrProduct.image || (itemOrProduct.images && itemOrProduct.images[0]);
    if (raw && !raw.includes('unsplash.com') && !raw.includes('images.unsplash')) {
      return raw;
    }

    return '/images/products/prod-001-main.png';
  },

  getCategories() {
    return getStored(CATEGORIES_KEY, INITIAL_CATEGORIES);
  },

  getCategoryBySlug(slug) {
    const categories = this.getCategories();
    return categories.find(c => c.slug === slug || c.id === slug || c.name === slug) || null;
  },

  saveProduct(productData) {
    const products = getStored(PRODUCTS_KEY, INITIAL_PRODUCTS);
    if (productData.id) {
      const idx = products.findIndex(p => String(p.id) === String(productData.id));
      if (idx !== -1) {
        products[idx] = { ...products[idx], ...productData };
      } else {
        products.unshift(productData);
      }
      if (api.getAuthToken()) {
        api.put(`/admin/products/${encodeURIComponent(productData.id)}`, productData).catch(() => {});
      }
    } else {
      const newProduct = {
        ...productData,
        id: `prod-${Date.now()}`,
        rating: 5.0,
        reviewsCount: 1,
        images: productData.image ? [productData.image] : ['/images/products/prod-001-main.png'],
      };
      products.unshift(newProduct);
      if (api.getAuthToken()) {
        api.post('/admin/products', newProduct).catch(() => {});
      }
    }
    setStored(PRODUCTS_KEY, products);
    return this.getProducts();
  },

  addProduct(productData) {
    return this.saveProduct(productData);
  },

  updateProduct(id, productData) {
    return this.saveProduct({ ...productData, id });
  },

  deleteProduct(id) {
    const products = getStored(PRODUCTS_KEY, INITIAL_PRODUCTS).filter(p => String(p.id) !== String(id));
    setStored(PRODUCTS_KEY, products);
    if (api.getAuthToken()) {
      api.delete(`/admin/products/${encodeURIComponent(id)}`).catch(() => {});
    }
    return this.getProducts();
  },

  saveCategory(catData) {
    const categories = this.getCategories();
    if (catData.id) {
      const idx = categories.findIndex(c => String(c.id) === String(catData.id));
      if (idx !== -1) categories[idx] = { ...categories[idx], ...catData };
      if (api.getAuthToken()) {
        api.put(`/admin/categories/${encodeURIComponent(catData.id)}`, catData).catch(() => {});
      }
    } else {
      const created = {
        ...catData,
        id: catData.slug || `cat-${Date.now()}`,
        count: catData.count || 0,
      };
      categories.push(created);
      if (api.getAuthToken()) {
        api.post('/admin/categories', created).catch(() => {});
      }
    }
    setStored(CATEGORIES_KEY, categories);
    return categories;
  },

  addCategory(catData) {
    return this.saveCategory(catData);
  },

  updateCategory(id, catData) {
    return this.saveCategory({ ...catData, id });
  },

  deleteCategory(id) {
    const categories = this.getCategories().filter(c => String(c.id) !== String(id));
    setStored(CATEGORIES_KEY, categories);
    if (api.getAuthToken()) {
      api.delete(`/admin/categories/${encodeURIComponent(id)}`).catch(() => {});
    }
    return categories;
  },

  async syncFromBackend() {
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/products?limit=100'),
        api.get('/categories')
      ]);

      if (Array.isArray(prodRes?.data) && prodRes.data.length > 0) {
        setStored(PRODUCTS_KEY, prodRes.data);
      }
      if (Array.isArray(catRes?.data) && catRes.data.length > 0) {
        setStored(CATEGORIES_KEY, catRes.data);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('techtonic:catalog-updated'));
      }
      return { synced: true };
    } catch {
      return { synced: false };
    }
  },

  async fetchProductDetail(id) {
    try {
      const res = await api.get(`/products/${encodeURIComponent(id)}`);
      return res?.data ? normalizeProduct(res.data) : this.getProductById(id);
    } catch {
      return this.getProductById(id);
    }
  },

  async addReviewRemote(productId, reviewPayload) {
    const res = await api.post(`/products/${encodeURIComponent(productId)}/reviews`, reviewPayload);
    await this.syncFromBackend();
    return res;
  },

  resetDefaults() {
    setStored(PRODUCTS_KEY, INITIAL_PRODUCTS);
    setStored(CATEGORIES_KEY, INITIAL_CATEGORIES);
  }
};
