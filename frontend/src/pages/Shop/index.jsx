import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Filter,
  SlidersHorizontal,
  X,
  Search,
  RotateCcw,
  Headphones,
  Watch,
  Keyboard,
  Zap,
  Sparkles,
  Check,
  Tag,
  Heart
} from 'lucide-react';
import ProductGrid from '../../components/product/ProductGrid';
import Pagination from '../../components/common/Pagination';
import Button from '../../components/common/Button';
import { productService } from '../../services/productService';
import { formatUSD } from '../../utils/formatPrice';
import { useWishlist, useLanguage } from '../../store/StoreContext';
import { translateCategory, translateSubcategory } from '../../utils/translations';

const ITEMS_PER_PAGE = 9;

const CATEGORY_ICONS = {
  'Audio & Acoustics': Headphones,
  'Smart Wearables': Watch,
  'Workspace Peripherals': Keyboard,
  'Power & Mobile': Zap
};

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { wishlist, isInWishlist } = useWishlist();
  const { t, language } = useLanguage();
  const allProducts = productService.getProducts();
  const categories = productService.getCategories();

  const isWishlistOnly = searchParams.get('filter') === 'wishlist';

  const resolveCategoryName = (catParam) => {
    if (!catParam || catParam.toLowerCase() === 'all') return 'All';
    const found = categories.find(
      (c) =>
        c.slug?.toLowerCase() === catParam.toLowerCase() ||
        c.id?.toLowerCase() === catParam.toLowerCase() ||
        c.name?.toLowerCase() === catParam.toLowerCase()
    );
    return found ? found.name : catParam;
  };

  const resolveSubcategoryName = (subParam) => {
    if (!subParam || subParam.toLowerCase() === 'all') return 'All';
    for (const cat of categories) {
      if (cat.subcategories) {
        const found = cat.subcategories.find(
          (s) =>
            s.slug?.toLowerCase() === subParam.toLowerCase() ||
            s.name?.toLowerCase() === subParam.toLowerCase()
        );
        if (found) return found.name;
      }
    }
    return subParam;
  };

  // URL query params synchronization
  const initialCategory = resolveCategoryName(searchParams.get('category'));
  const initialSubcategory = resolveSubcategoryName(searchParams.get('subcategory') || searchParams.get('sub'));
  const initialSearch = searchParams.get('search') || searchParams.get('q') || '';
  const initialSort = searchParams.get('sort') || 'featured';

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedSubcategory, setSelectedSubcategory] = useState(initialSubcategory);
  const [maxPrice, setMaxPrice] = useState(350);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState(initialSort);
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync state if URL query changes
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      setSelectedCategory(resolveCategoryName(cat));
    } else {
      setSelectedCategory('All');
    }

    const sub = searchParams.get('subcategory') || searchParams.get('sub');
    if (sub) {
      setSelectedSubcategory(resolveSubcategoryName(sub));
    } else {
      setSelectedSubcategory('All');
    }

    const q = searchParams.get('search') ?? searchParams.get('q');
    if (q !== null && q !== undefined) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  const handleSelectCategory = (catName) => {
    setSelectedCategory(catName);
    setSelectedSubcategory('All');
    setCurrentPage(1);
    const next = new URLSearchParams(searchParams);
    if (catName === 'All') {
      next.delete('category');
    } else {
      next.set('category', catName);
    }
    next.delete('subcategory');
    next.delete('sub');
    setSearchParams(next);
  };

  const handleSelectSubcategory = (subName, parentCat = null) => {
    setSelectedSubcategory(subName);
    setCurrentPage(1);
    const next = new URLSearchParams(searchParams);
    if (subName === 'All') {
      next.delete('subcategory');
      next.delete('sub');
    } else {
      next.set('subcategory', subName);
      if (parentCat && selectedCategory === 'All') {
        setSelectedCategory(parentCat);
        next.set('category', parentCat);
      }
    }
    setSearchParams(next);
  };

  // Subcategories available for active category
  const activeSubcategories = useMemo(() => {
    if (selectedCategory !== 'All') {
      const cat = categories.find((c) => c.name === selectedCategory || c.slug === selectedCategory);
      return cat?.subcategories || [];
    }
    // If 'All', return key top subcategories from all categories
    const allSubs = [];
    categories.forEach((cat) => {
      (cat.subcategories || []).forEach((s) => {
        allSubs.push({ ...s, parentCategory: cat.name });
      });
    });
    return allSubs;
  }, [categories, selectedCategory]);

  // Filtering & Sorting Logic
  const filteredProducts = useMemo(() => {
    return allProducts
      .filter((p) => {
        // Wishlist match
        if (isWishlistOnly && !isInWishlist(p.id)) {
          return false;
        }
        // Category match
        if (selectedCategory !== 'All') {
          const matchesCat =
            p.category?.toLowerCase() === selectedCategory.toLowerCase() ||
            p.categoryName?.toLowerCase() === selectedCategory.toLowerCase() ||
            p.slug?.toLowerCase() === selectedCategory.toLowerCase();
          if (!matchesCat) return false;
        }
        // Subcategory match
        if (selectedSubcategory !== 'All') {
          const subLower = selectedSubcategory.toLowerCase();
          const matchesSub =
            (p.subcategory || '').toLowerCase() === subLower ||
            (p.subcategorySlug || '').toLowerCase() === subLower ||
            (p.subcategory || '').toLowerCase().includes(subLower) ||
            subLower.includes((p.subcategory || '').toLowerCase());
          if (!matchesSub) return false;
        }
        // Search match
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = (p.name || '').toLowerCase().includes(q);
          const matchesBrand = (p.brand || '').toLowerCase().includes(q);
          const matchesCat = (p.category || '').toLowerCase().includes(q);
          const matchesSub = (p.subcategory || '').toLowerCase().includes(q);
          const matchesDesc = (p.description || '').toLowerCase().includes(q);
          const matchesTag = (p.tagline || '').toLowerCase().includes(q);
          if (!matchesName && !matchesBrand && !matchesCat && !matchesSub && !matchesDesc && !matchesTag) return false;
        }
        // Price match
        if (p.price > maxPrice) {
          return false;
        }
        // Stock match
        if (inStockOnly && p.stock === 0) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-low') return a.price - b.price;
        if (sortBy === 'price-high') return b.price - a.price;
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'newest') return b.id - a.id;
        // Default: featured
        return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
      });
  }, [allProducts, selectedCategory, selectedSubcategory, searchQuery, maxPrice, inStockOnly, sortBy, isWishlistOnly, isInWishlist]);

  // Pagination slice
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const handleResetFilters = () => {
    setSelectedCategory('All');
    setSelectedSubcategory('All');
    setSearchQuery('');
    setMaxPrice(350);
    setInStockOnly(false);
    setSortBy('featured');
    setCurrentPage(1);
    setSearchParams({});
  };

  const hasActiveFilters =
    isWishlistOnly ||
    selectedCategory !== 'All' ||
    selectedSubcategory !== 'All' ||
    searchQuery.trim() !== '' ||
    maxPrice < 350 ||
    inStockOnly;

  const FilterSidebar = () => (
    <div className="flex flex-col gap-6">
      {/* Category Filter */}
      <div>
        <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
          <span>{t('shop_categories')}</span>
          <span className="text-[10px] text-slate-400 font-bold">{t('shop_active_categories')}</span>
        </h4>
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => handleSelectCategory('All')}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all text-left ${selectedCategory === 'All'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 opacity-80" />
              <span>{t('shop_all_products')}</span>
            </div>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${selectedCategory === 'All' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}
            >
              {allProducts.length}
            </span>
          </button>

          {categories.map((c) => {
            const Icon = CATEGORY_ICONS[c.name] || Tag;
            const isSelected = selectedCategory === c.name;
            const count = allProducts.filter(
              (p) =>
                p.category === c.name ||
                p.categoryName === c.name ||
                p.category === c.slug
            ).length;

            return (
              <div key={c.id} className="flex flex-col">
                <button
                  type="button"
                  onClick={() => handleSelectCategory(c.name)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all text-left ${isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className="w-4 h-4 opacity-80 shrink-0" />
                    <span className="truncate">{translateCategory(c.name, language)}</span>
                  </div>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-bold shrink-0 ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                  >
                    {count}
                  </span>
                </button>

                {/* Subcategories dropdown when category is active */}
                {isSelected && c.subcategories && c.subcategories.length > 0 && (
                  <div className="mt-1.5 mb-2 ml-4 pl-3 border-l-2 border-blue-500/40 flex flex-col gap-1 animate-fadeIn">
                    <button
                      type="button"
                      onClick={() => handleSelectSubcategory('All')}
                      className={`text-left text-[11px] font-bold py-1 px-2 rounded-lg transition-colors flex items-center justify-between ${selectedSubcategory === 'All'
                          ? 'bg-blue-50 text-blue-700 font-extrabold'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                    >
                      <span>{t('shop_all_prefix')} {translateCategory(c.name, language)}</span>
                    </button>
                    {c.subcategories.map((sub) => {
                      const isSubActive =
                        selectedSubcategory.toLowerCase() === sub.name.toLowerCase() ||
                        selectedSubcategory.toLowerCase() === sub.slug.toLowerCase();
                      const subCount = allProducts.filter(
                        (p) =>
                          (p.subcategory || '').toLowerCase() === sub.name.toLowerCase() ||
                          (p.subcategorySlug || '').toLowerCase() === sub.slug.toLowerCase()
                      ).length;

                      return (
                        <button
                          key={sub.slug}
                          type="button"
                          onClick={() => handleSelectSubcategory(sub.name)}
                          className={`text-left text-[11px] font-bold py-1 px-2 rounded-lg transition-colors flex items-center justify-between ${isSubActive
                              ? 'bg-blue-50 text-blue-700 font-extrabold'
                              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                        >
                          <span className="truncate">{translateSubcategory(sub.name, language)}</span>
                          {subCount > 0 && (
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ml-1 ${isSubActive
                                  ? 'bg-blue-200 text-blue-800'
                                  : 'bg-slate-100 text-slate-500'
                                }`}
                            >
                              {subCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="pt-5 border-t border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            {t('shop_price_budget')}
          </h4>
          <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
            {t('shop_up_to')} {formatUSD(maxPrice)}
          </span>
        </div>
        <input
          type="range"
          min="15"
          max="350"
          step="5"
          value={maxPrice}
          onChange={(e) => {
            setMaxPrice(Number(e.target.value));
            setCurrentPage(1);
          }}
          className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
        />
        <div className="flex justify-between text-[11px] font-bold text-slate-400 mt-2">
          <span>$15</span>
          <span>$350+</span>
        </div>
      </div>

      {/* Stock Filter */}
      <div className="pt-5 border-t border-slate-100">
        <label className="flex items-center justify-between text-xs font-bold text-slate-700 cursor-pointer p-2 rounded-xl hover:bg-slate-50">
          <span>{t('shop_in_stock_only')}</span>
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => {
              setInStockOnly(e.target.checked);
              setCurrentPage(1);
            }}
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
          />
        </label>
      </div>

      {/* Wishlist Filter */}
      <div className="pt-4 border-t border-slate-100">
        <label className="flex items-center justify-between text-xs font-bold text-slate-700 cursor-pointer p-2 rounded-xl hover:bg-rose-50/50">
          <span className="flex items-center gap-2">
            <Heart className={`w-3.5 h-3.5 ${isWishlistOnly ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
            <span>{t('shop_wishlist_only')}</span>
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {wishlist.length}
            </span>
            <input
              type="checkbox"
              checked={isWishlistOnly}
              onChange={(e) => {
                const next = new URLSearchParams(searchParams);
                if (e.target.checked) {
                  next.set('filter', 'wishlist');
                } else {
                  next.delete('filter');
                }
                setSearchParams(next);
                setCurrentPage(1);
              }}
              className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
            />
          </div>
        </label>
      </div>

      {/* Reset Filter Button */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={handleResetFilters}
          className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 transition flex items-center justify-center gap-2 border border-slate-200"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t('shop_reset_filters')}</span>
        </button>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header Banner */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {t('shop_title', 'Engineered Hardware & Gear')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            {t('shop_subtitle', 'Reference audio, tactile mechanical peripherals, and fast GaN power accessories benchmarked for power users.')}
          </p>
        </div>
      </div>

      {/* Search & Sort Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 p-2 sm:p-2.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder={t('shop_search_placeholder', 'Search headphones, keyboards, chargers, smartwatches...')}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-8 py-2 text-xs sm:text-sm bg-transparent border-none focus:outline-none text-slate-900 placeholder:text-slate-400 font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-slate-100 pt-2 sm:pt-0 sm:pl-3">
          {/* Mobile Filter Toggle */}
          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{t('shop_filters', 'Filters')} ({hasActiveFilters ? (language === 'km' ? 'សកម្ម' : 'Active') : t('shop_all_prefix', 'All')})</span>
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">{t('shop_sort_label', 'Sort:')}</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
            >
              <option value="featured">{t('shop_sort_featured', 'Featured First')}</option>
              <option value="price-low">{t('shop_sort_price_low', 'Price: Low to High')}</option>
              <option value="price-high">{t('shop_sort_price_high', 'Price: High to Low')}</option>
              <option value="rating">{t('shop_sort_rating', 'Highest Rated')}</option>
              <option value="newest">{t('shop_sort_newest', 'Newest Releases')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-6 animate-fadeIn">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            {t('shop_active_filters', 'Active Filters:')}
          </span>
          {selectedCategory !== 'All' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <span>{translateCategory(selectedCategory, language)}</span>
              <button
                type="button"
                onClick={() => setSelectedCategory('All')}
                className="hover:text-blue-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {searchQuery && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <span>"{searchQuery}"</span>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="hover:text-blue-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {maxPrice < 350 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <span>{t('shop_under', 'Under')} {formatUSD(maxPrice)}</span>
              <button
                type="button"
                onClick={() => setMaxPrice(350)}
                className="hover:text-blue-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {inStockOnly && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span>{t('shop_in_stock_only', 'In Stock Only')}</span>
              <button
                type="button"
                onClick={() => setInStockOnly(false)}
                className="hover:text-emerald-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {isWishlistOnly && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
              <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
              <span>{t('shop_wishlist_only', 'Wishlist Only')} ({wishlist.length})</span>
              <button
                type="button"
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  next.delete('filter');
                  setSearchParams(next);
                }}
                className="hover:text-rose-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedSubcategory !== 'All' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <span>{t('shop_subcategory', 'Subcategory')}: {translateSubcategory(selectedSubcategory, language)}</span>
              <button
                type="button"
                onClick={() => handleSelectSubcategory('All')}
                className="hover:text-indigo-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline ml-2"
          >
            {t('shop_clear_all', 'Clear All')}
          </button>
        </div>
      )}

      {/* Main Grid & Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block lg:col-span-3">
          <div className="sticky top-28 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm">
            <div className="flex items-center justify-between font-bold text-slate-900 pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-extrabold">{t('shop_filter_title', 'Filter Hardware')}</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {filteredProducts.length} {t('shop_items', 'items')}
              </span>
            </div>
            <FilterSidebar />
          </div>
        </aside>

        {/* Product Catalog Grid */}
        <main className="lg:col-span-9 flex flex-col gap-6">
          {/* Wishlist Active Alert Banner */}
          {isWishlistOnly && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    {t('shop_wishlist_showing', 'Showing your saved wishlist items')} ({filteredProducts.length})
                  </p>
                  <p className="text-[11px] text-slate-600">
                    {t('shop_wishlist_desc', 'Filter active: displaying hardware saved to your personal wishlist.')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to="/wishlist"
                  className="text-xs font-bold text-rose-700 hover:text-rose-900 bg-white hover:bg-rose-100/50 border border-rose-200 px-3 py-1.5 rounded-lg transition-colors"
                >
                  {t('shop_wishlist_full_page', 'Full Wishlist Page')}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    const next = new URLSearchParams(searchParams);
                    next.delete('filter');
                    setSearchParams(next);
                  }}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>{t('shop_clear_filter', 'Clear Filter')}</span>
                </button>
              </div>
            </div>
          )}

          {/* Subcategory Scrollable Filter Chips Bar */}
          {activeSubcategories.length > 0 && (
            <div className="bg-white rounded-2xl p-2.5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
                <button
                  type="button"
                  onClick={() => handleSelectSubcategory('All')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${selectedSubcategory === 'All'
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                >
                  <span>
                    {selectedCategory === 'All'
                      ? t('shop_all_products', 'All Products')
                      : `${t('shop_all_prefix', 'All')} ${translateCategory(selectedCategory, language)}`}
                  </span>
                </button>
                {activeSubcategories.map((sub) => {
                  const isSubActive =
                    selectedSubcategory.toLowerCase() === sub.name.toLowerCase() ||
                    selectedSubcategory.toLowerCase() === sub.slug.toLowerCase();
                  const subCount = allProducts.filter(
                    (p) =>
                      (p.subcategory || '').toLowerCase() === sub.name.toLowerCase() ||
                      (p.subcategorySlug || '').toLowerCase() === sub.slug.toLowerCase()
                  ).length;

                  return (
                    <button
                      key={sub.slug}
                      type="button"
                      onClick={() => handleSelectSubcategory(sub.name, sub.parentCategory)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${isSubActive
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 ring-2 ring-blue-600/30'
                          : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                    >
                      <span>{translateSubcategory(sub.name, language)}</span>
                      {subCount > 0 && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isSubActive
                              ? 'bg-white/25 text-white'
                              : 'bg-slate-200/80 text-slate-600'
                            }`}
                        >
                          {subCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
            <span>
              {t('shop_showing', 'Showing')} <strong className="text-slate-900 font-bold">{filteredProducts.length}</strong> {t('shop_devices', 'devices')}
            </span>
            <div className="flex items-center gap-1.5 font-bold">
              {selectedCategory !== 'All' && (
                <span className="text-blue-600">{translateCategory(selectedCategory, language)}</span>
              )}
              {selectedCategory !== 'All' && selectedSubcategory !== 'All' && (
                <span className="text-slate-300">/</span>
              )}
              {selectedSubcategory !== 'All' && (
                <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                  {translateSubcategory(selectedSubcategory, language)}
                </span>
              )}
            </div>
          </div>

          <ProductGrid
            products={paginatedProducts}
            columns="grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
            emptyTitle={t('shop_empty_title', 'No products found')}
            emptyMessage={t('shop_empty_message', 'Try adjusting your filters or search keywords to find what you are looking for.')}
            onResetFilters={handleResetFilters}
          />

          {totalPages > 1 && (
            <div className="pt-8 border-t border-slate-200 mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filter Slide-out Modal */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden lg:hidden animate-fadeIn">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xs bg-white shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                  <div className="flex items-center gap-2 font-black text-slate-900">
                    <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                    <span>{t('shop_filter_title', 'Filter Hardware')}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileFilterOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <FilterSidebar />
              </div>

              <div className="pt-6 border-t border-slate-100 mt-6">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  onClick={() => setMobileFilterOpen(false)}
                >
                  {t('shop_show_results', 'Show {count} Results').replace('{count}', filteredProducts.length)}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
