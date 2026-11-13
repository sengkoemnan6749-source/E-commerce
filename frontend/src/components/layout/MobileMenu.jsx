import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Home,
  ShoppingBag,
  Heart,
  Truck,
  Sparkles,
  Headphones,
  Watch,
  Keyboard,
  Zap,
  LayoutDashboard,
  User,
  LogOut,
  Search,
  ChevronRight,
  X
} from 'lucide-react';
import { useAuth, useCart, useWishlist, useLanguage } from '../../store/StoreContext';
import { productService } from '../../services/productService';
import { formatUSD } from '../../utils/formatPrice';
import { translateCategory } from '../../utils/translations';
import LanguageSwitcher from '../common/LanguageSwitcher';

export function MobileMenu({ isOpen, onClose }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount } = useCart();
  const { wishlist } = useWishlist();
  const { t, language } = useLanguage();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const navigate = useNavigate();

  // Instant live search as user types
  React.useEffect(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      setSearchResults([]);
      return;
    }

    const all = productService.getProducts();
    const matched = all.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.categoryName?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.subcategory?.toLowerCase().includes(q) ||
      p.tagline?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    ).slice(0, 5);

    setSearchResults(matched);
  }, [search]);

  if (!isOpen) return null;

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    const q = search.trim();
    if (!q) return;
    onClose();
    navigate(`/shop?search=${encodeURIComponent(q)}`);
  };

  const CATEGORIES = [
    { to: '/shop?category=audio', name: 'Audio & Acoustics', icon: Headphones },
    { to: '/shop?category=wearables', name: 'Smart Wearables', icon: Watch },
    { to: '/shop?category=workspace', name: 'Workspace Peripherals', icon: Keyboard },
    { to: '/shop?category=power', name: 'Power & Mobile', icon: Zap }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden md:hidden animate-fadeIn">
      {/* Dimmed Frosted Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-sm w-full bg-white shadow-2xl flex flex-col z-50 animate-slideLeft border-l border-slate-200">
        
        {/* 1. Header Bar: Logo + Clean Language Pill + Close */}
        <div className="p-4 px-5 border-b border-slate-100 flex items-center justify-between bg-white">
          <Link to="/" onClick={onClose} className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              <img
                src="/images/logo/techtonic-crest.png"
                alt="TechTonic Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <img
              src="/images/logo/techtonic-script-orange.png"
              alt="TechTonic"
              className="h-5 w-auto object-contain"
            />
          </Link>

          <div className="flex items-center gap-2">
            {/* Clean compact language switcher */}
            <LanguageSwitcher variant="segmented" />

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Search */}
        <div className="p-3.5 border-b border-slate-100 bg-slate-50/50">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative flex-1">
              <button
                type="submit"
                className="w-4 h-4 text-slate-400 hover:text-blue-600 absolute left-3.5 top-1/2 -translate-y-1/2 cursor-pointer transition z-10 flex items-center justify-center"
                title="Search"
                aria-label="Submit search"
              >
                <Search className="w-4 h-4" />
              </button>
              <input
                type="text"
                placeholder={t('nav_search_placeholder', 'Search products...')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-9 py-2 text-xs bg-white rounded-xl border border-slate-200/90 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 z-10"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="submit"
              className="px-3 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shrink-0 shadow-xs"
            >
              {language === 'km' ? 'ស្វែងរក' : 'Search'}
            </button>
          </form>

          {/* Instant Search Results Dropdown as you type */}
          {search.trim().length > 0 && (
            <div className="mt-2.5 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden divide-y divide-slate-100 animate-fadeIn">
              {searchResults.length > 0 ? (
                <>
                  <div className="max-h-60 overflow-y-auto">
                    {searchResults.map((item) => {
                      const cleanImg = productService.getCleanProductImage(item);
                      return (
                        <Link
                          key={item.id}
                          to={`/product/${item.id}`}
                          onClick={() => {
                            setSearch('');
                            onClose();
                          }}
                          className="flex items-center gap-3 p-2.5 hover:bg-slate-50 transition"
                        >
                          <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200/80 p-1 shrink-0 flex items-center justify-center">
                            <img
                              src={cleanImg}
                              alt={item.name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-bold text-slate-900 block truncate">
                              {item.name}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {translateCategory(item.categoryName || item.category, language)}
                            </span>
                          </div>
                          <span className="text-xs font-extrabold text-blue-600 shrink-0">
                            {formatUSD(item.price)}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleSearch(e)}
                    className="w-full py-2 px-3 text-center text-xs font-bold text-blue-600 hover:bg-blue-50 transition block bg-slate-50/80"
                  >
                    {t('nav_view_all_results', 'View all results for')} "{search}" →
                  </button>
                </>
              ) : (
                <div className="p-4 text-center">
                  <p className="text-xs text-slate-500">
                    {t('nav_no_results', 'No hardware found for')} <span className="font-semibold text-slate-800">"{search}"</span>
                  </p>
                  <Link
                    to="/shop"
                    onClick={() => {
                      setSearch('');
                      onClose();
                    }}
                    className="text-xs font-bold text-blue-600 hover:underline mt-1.5 inline-block"
                  >
                    {t('nav_browse_catalog', 'Browse Entire Catalog')} →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. Navigation Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Main Navigation Links */}
          <div className="space-y-1">
            <Link
              to="/"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-800 hover:bg-slate-50 hover:text-blue-600 transition"
            >
              <Home className="w-4 h-4 text-slate-400" />
              <span>{t('nav_home', 'Home')}</span>
            </Link>

            <Link
              to="/shop"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-800 hover:bg-slate-50 hover:text-blue-600 transition"
            >
              <Sparkles className="w-4 h-4 text-slate-400" />
              <span>{t('nav_shop', 'Shop')}</span>
            </Link>

            <Link
              to="/wishlist"
              onClick={onClose}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-800 hover:bg-slate-50 hover:text-blue-600 transition"
            >
              <div className="flex items-center gap-3">
                <Heart className="w-4 h-4 text-slate-400" />
                <span>{t('mobile_saved_wishlist', 'Saved Wishlist')}</span>
              </div>
              {wishlist.length > 0 && (
                <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  {wishlist.length}
                </span>
              )}
            </Link>

            <Link
              to="/cart"
              onClick={onClose}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-800 hover:bg-slate-50 hover:text-blue-600 transition"
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-4 h-4 text-slate-400" />
                <span>{t('mobile_shopping_cart', 'Shopping Cart')}</span>
              </div>
              {cartCount > 0 && (
                <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  {cartCount}
                </span>
              )}
            </Link>

            <Link
              to="/track"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-800 hover:bg-slate-50 hover:text-blue-600 transition"
            >
              <Truck className="w-4 h-4 text-slate-400" />
              <span>{t('nav_track_order', 'Track Order')}</span>
            </Link>
          </div>

          {/* Categories */}
          <div className="pt-4 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 block mb-2">
              {t('nav_categories', 'Categories')}
            </span>
            <div className="space-y-0.5">
              {CATEGORIES.map((cat, i) => {
                const IconComponent = cat.icon;
                return (
                  <Link
                    key={i}
                    to={cat.to}
                    onClick={onClose}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <IconComponent className="w-3.5 h-3.5 text-slate-400" />
                      <span>{translateCategory(cat.name, language)}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Admin link only if user is admin */}
          {user?.role === 'admin' && (
            <div className="pt-4 border-t border-slate-100">
              <Link
                to="/TechTonicAdmin"
                onClick={onClose}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-purple-700 hover:bg-purple-50 transition"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>{t('nav_admin_console', 'Admin Console')}</span>
              </Link>
            </div>
          )}
        </div>

        {/* 4. Footer: Clean User Account Row */}
        <div className="p-4 px-5 border-t border-slate-100 bg-slate-50/70">
          {isAuthenticated ? (
            <div className="flex items-center justify-between gap-3">
              <Link
                to="/account"
                onClick={onClose}
                className="flex items-center gap-3 min-w-0 group"
              >
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                  {(user?.name || user?.fullName || 'S').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {user?.name || user?.fullName || 'Sara Meng'}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium group-hover:text-blue-600 transition flex items-center gap-0.5">
                    <span>{user?.role === 'admin' ? t('nav_admin_console', 'Admin Console') : t('mobile_my_account_orders', 'My Account & Orders')}</span>
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                  </p>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => {
                  logout();
                  onClose();
                  if (window.location.pathname.startsWith('/account') || window.location.pathname.startsWith('/admin')) {
                    navigate('/');
                  }
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                title={t('nav_sign_out', 'Sign Out')}
                aria-label={t('nav_sign_out', 'Sign Out')}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/login"
                onClick={onClose}
                className="py-2 text-center text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition"
              >
                {t('nav_sign_in', 'Sign In')}
              </Link>
              <Link
                to="/register"
                onClick={onClose}
                className="py-2 text-center text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition"
              >
                {t('mobile_register', 'Register')}
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default MobileMenu;
