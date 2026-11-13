import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  ShoppingBag,
  User,
  Menu,
  X,
  ArrowRight,
  Heart,
  LayoutDashboard,
  ChevronDown,
  Headphones,
  Watch,
  Keyboard,
  Zap,
  Package,
  LogOut,
  MapPin,
  ShieldCheck
} from 'lucide-react';
import { useCart, useAuth, useWishlist, useLanguage } from '../../store/StoreContext';
import { productService } from '../../services/productService';
import { formatUSD } from '../../utils/formatPrice';
import { translateCategory, translateSubcategory } from '../../utils/translations';
import HamburgerButton from '../common/HamburgerButton';
import LanguageSwitcher from '../common/LanguageSwitcher';
import { hasCustomAvatar } from '../../utils/imageUtils';

const CATEGORIES = [
  {
    id: 'audio',
    name: 'Audio & Acoustics',
    slug: 'audio',
    description: 'Studio ANC headphones, wireless buds & lossless sound',
    icon: Headphones,
    subcategories: [
      { name: 'Wireless Earbuds', slug: 'wireless-earbuds' },
      { name: 'Bluetooth Headphones', slug: 'bluetooth-headphones' },
      { name: 'Studio Headphones', slug: 'studio-headphones' },
      { name: 'USB Microphones', slug: 'usb-microphones' },
      { name: 'Soundbars', slug: 'soundbars' }
    ]
  },
  {
    id: 'wearables',
    name: 'Smart Wearables',
    slug: 'wearables',
    description: 'AMOLED fitness smartwatches & biometric rings',
    icon: Watch,
    subcategories: [
      { name: 'Smartwatches', slug: 'smartwatches' },
      { name: 'Fitness Trackers', slug: 'fitness-trackers' },
      { name: 'Smart Rings', slug: 'smart-rings' },
      { name: 'Sports Watches', slug: 'sports-watches' }
    ]
  },
  {
    id: 'workspace',
    name: 'Workspace Peripherals',
    slug: 'workspace',
    description: 'Mechanical tactile keyboards & precision desk gear',
    icon: Keyboard,
    subcategories: [
      { name: 'Mechanical Keyboards', slug: 'mechanical-keyboards' },
      { name: 'Gaming Mice', slug: 'gaming-mice' },
      { name: 'Webcams', slug: 'webcams' },
      { name: 'Laptop Stands', slug: 'laptop-stands' },
      { name: 'Mouse Pads', slug: 'mouse-pads' }
    ]
  },
  {
    id: 'power',
    name: 'Power & Mobile',
    slug: 'power',
    description: 'GaN III fast chargers, cables & magnetic power banks',
    icon: Zap,
    subcategories: [
      { name: 'GaN Chargers', slug: 'gan-chargers' },
      { name: 'Power Banks', slug: 'power-banks' },
      { name: 'Multi-Port Chargers', slug: 'multi-port-chargers' },
      { name: 'Charging Stations', slug: 'charging-stations' }
    ]
  }
];

export function Navbar({ onOpenMobileMenu, onToggleMobileMenu, isMobileMenuOpen = false }) {
  const { cartCount, setIsCartDrawerOpen } = useCart();
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const { wishlist } = useWishlist();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const searchRef = useRef(null);
  const categoryMenuRef = useRef(null);
  const categoryTimeoutRef = useRef(null);
  const userMenuRef = useRef(null);

  const handleCategoryMouseEnter = () => {
    if (categoryTimeoutRef.current) {
      clearTimeout(categoryTimeoutRef.current);
      categoryTimeoutRef.current = null;
    }
    setIsCategoryOpen(true);
  };

  const handleCategoryMouseLeave = () => {
    if (categoryTimeoutRef.current) {
      clearTimeout(categoryTimeoutRef.current);
    }
    categoryTimeoutRef.current = setTimeout(() => {
      setIsCategoryOpen(false);
    }, 180);
  };

  // Clean up category hover timer on unmount
  useEffect(() => {
    return () => {
      if (categoryTimeoutRef.current) {
        clearTimeout(categoryTimeoutRef.current);
      }
    };
  }, []);

  // Scroll detection for compact pinned glass navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Live search debouncing
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setSearchResults([]);
      return;
    }

    const all = productService.getProducts();
    const matched = all.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.categoryName?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.tagline?.toLowerCase().includes(q)
    ).slice(0, 4);

    setSearchResults(matched);
  }, [searchQuery]);

  // Click outside and escape listeners for dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(e.target)) {
        setIsCategoryOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsCategoryOpen(false);
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Close open dropdowns upon navigation
  useEffect(() => {
    setIsSearchOpen(false);
    setIsCategoryOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname, location.search]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearchOpen(false);
    navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const navContainerRef = useRef(null);
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, opacity: 0 });

  const syncPillToActive = () => {
    if (!navContainerRef.current) return;
    const activeEl = navContainerRef.current.querySelector('a.active, button.is-active');
    if (activeEl) {
      const containerRect = navContainerRef.current.getBoundingClientRect();
      const elRect = activeEl.getBoundingClientRect();
      setPillStyle({
        left: elRect.left - containerRect.left,
        width: elRect.width,
        opacity: 1
      });
    } else {
      setPillStyle(prev => ({ ...prev, opacity: 0 }));
    }
  };

  useEffect(() => {
    const timer = setTimeout(syncPillToActive, 50);
    const handleResize = () => syncPillToActive();
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [location.pathname]);

  const handleNavMouseEnter = (e) => {
    if (!navContainerRef.current) return;
    const containerRect = navContainerRef.current.getBoundingClientRect();
    const elRect = e.currentTarget.getBoundingClientRect();
    setPillStyle({
      left: elRect.left - containerRect.left,
      width: elRect.width,
      opacity: 1
    });
  };

  const handleNavMouseLeave = () => {
    syncPillToActive();
  };

  const navItemClass = ({ isActive }) =>
    `relative z-10 text-sm font-medium transition-colors duration-150 px-3.5 py-1.5 rounded-full whitespace-nowrap ${
      isActive
        ? 'text-white font-semibold'
        : 'text-slate-300 hover:text-white'
    }`;

  // Get user display first name or Sara
  const userFirstName = user?.fullName ? user.fullName.split(' ')[0] : 'Sara';

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        isScrolled
          ? 'bg-[#060b18]/95 backdrop-blur-xl shadow-lg shadow-black/40 border-b border-slate-800/80 py-2.5'
          : 'bg-[#060b18] border-b border-slate-800/80 py-3.5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Brand Logo with STORE Pill */}
          <Link to="/" className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 group">
            <div className="w-8 h-8 sm:w-11 sm:h-11 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
              <img
                src="/images/logo/techtonic-crest.png"
                alt="TechTonic Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <img
                src="/images/logo/techtonic-script-orange.png"
                alt="TechTonic"
                className="h-6 sm:h-9 w-auto object-contain group-hover:scale-105 transition-transform duration-200"
              />
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#cafc05] text-slate-950 shadow-sm">
                STORE
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links with Gliding Hover Animation */}
          <nav
            ref={navContainerRef}
            onMouseLeave={handleNavMouseLeave}
            className="hidden md:flex items-center gap-1 shrink-0 relative"
          >
            {/* Smooth Gliding Hover & Active Pill */}
            <div
              className="absolute top-1/2 -translate-y-1/2 h-8 rounded-full bg-slate-800/80 border border-slate-700/60 pointer-events-none transition-all duration-200 ease-out shadow-xs"
              style={{
                left: `${pillStyle.left}px`,
                width: `${pillStyle.width}px`,
                opacity: pillStyle.opacity,
              }}
            />

            <NavLink to="/" end className={navItemClass} onMouseEnter={handleNavMouseEnter}>
              {t('nav_home', 'Home')}
            </NavLink>
            <NavLink to="/shop" className={navItemClass} onMouseEnter={handleNavMouseEnter}>
              {t('nav_shop', 'Shop')}
            </NavLink>

            {/* Categories Dropdown */}
            <div
              className="relative"
              ref={categoryMenuRef}
              onMouseEnter={handleCategoryMouseEnter}
              onMouseLeave={handleCategoryMouseLeave}
            >
              <button
                type="button"
                onClick={() => setIsCategoryOpen(prev => !prev)}
                onMouseEnter={handleNavMouseEnter}
                className={`relative z-10 flex items-center gap-1.5 text-sm font-medium transition-colors duration-150 px-3.5 py-1.5 rounded-full whitespace-nowrap ${
                  isCategoryOpen
                    ? 'text-white font-semibold is-active'
                    : 'text-slate-300 hover:text-white'
                }`}
                aria-expanded={isCategoryOpen}
                aria-haspopup="true"
              >
                <span>{t('nav_categories', 'Categories')}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isCategoryOpen ? 'rotate-180 text-sky-400' : 'text-slate-400'
                  }`}
                />
              </button>

              {isCategoryOpen && (
                <div
                  className="absolute left-0 top-full pt-1.5 w-96 z-50 animate-fadeIn"
                  onMouseEnter={handleCategoryMouseEnter}
                  onMouseLeave={handleCategoryMouseLeave}
                >
                  <div className="bg-[#091124] rounded-2xl shadow-2xl border border-slate-700/80 p-2 text-white backdrop-blur-xl">
                    <div className="px-3 py-2 border-b border-slate-800 mb-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {t('nav_product_categories', 'Product Categories')}
                      </p>
                    </div>
                    <div className="space-y-1">
                      {CATEGORIES.map((cat) => {
                        const IconComponent = cat.icon;
                        return (
                          <div
                            key={cat.id}
                            className="p-2 rounded-xl hover:bg-slate-800/70 transition group border border-transparent hover:border-slate-700/60"
                          >
                            <Link
                              to={`/shop?category=${cat.id}`}
                              onClick={() => setIsCategoryOpen(false)}
                              className="flex items-start gap-3"
                            >
                              <IconComponent className="w-4 h-4 mt-0.5 shrink-0 text-slate-400 group-hover:text-sky-400 transition-colors" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-bold text-slate-200 group-hover:text-sky-400 transition-colors">
                                    {translateCategory(cat.name, language)}
                                  </span>
                                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all" />
                                </div>
                                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                                  {t(`nav_cat_desc_${cat.id}`, cat.description)}
                                </p>
                              </div>
                            </Link>

                            {/* Subcategories quick chips */}
                            {cat.subcategories && (
                              <div className="flex flex-wrap gap-1 mt-2 pl-11">
                                {cat.subcategories.map((sub) => (
                                  <Link
                                    key={sub.slug}
                                    to={`/shop?category=${cat.id}&subcategory=${encodeURIComponent(sub.name)}`}
                                    onClick={() => setIsCategoryOpen(false)}
                                    className="text-[10px] font-bold text-slate-400 hover:text-sky-300 hover:bg-slate-700/70 bg-slate-800/80 px-2 py-0.5 rounded-md transition-colors"
                                  >
                                    {translateSubcategory(sub.name, language)}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-800">
                      <Link
                        to="/shop"
                        onClick={() => setIsCategoryOpen(false)}
                        className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-sky-400 hover:bg-slate-800/80 transition"
                      >
                        <span>{t('nav_browse_catalog', 'Browse Entire Catalog')}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <NavLink to="/track" className={navItemClass} onMouseEnter={handleNavMouseEnter}>
              {t('nav_track_order', 'Track Order')}
            </NavLink>
          </nav>

          {/* Search Bar + Autocomplete */}
          <div className="hidden lg:block relative flex-1 max-w-xs xl:max-w-sm" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder={t('nav_search_placeholder', 'Search headphones, keyboards, chargers...')}
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-[#0c1527] hover:bg-[#101b33] focus:bg-[#0c1527] border border-slate-700/70 focus:border-sky-400 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-400/20 transition duration-150 text-slate-200 placeholder:text-slate-400"
              />
            </form>

            {/* Live Autocomplete Dropdown */}
            {isSearchOpen && searchQuery.trim() && (
              <div className="absolute left-0 right-0 mt-2 bg-[#091124] rounded-2xl shadow-2xl border border-slate-700/80 overflow-hidden z-50 animate-fadeIn divide-y divide-slate-800">
                <div className="p-3 bg-slate-900/80 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider flex justify-between">
                  <span>{t('nav_search_results', 'Hardware Results')}</span>
                  <span className="text-sky-400">
                    {language === 'km' ? `${t('nav_found', 'រកឃើញ')} ${searchResults.length}` : `${searchResults.length} found`}
                  </span>
                </div>
                {searchResults.length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-400">
                    {t('nav_no_results', 'No hardware found for')} "{searchQuery}".
                  </div>
                ) : (
                  <div>
                    {searchResults.map(p => (
                      <Link
                        key={p.id}
                        to={`/product/${p.id}`}
                        onClick={() => {
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="flex items-center gap-3 p-3 hover:bg-slate-800/80 transition"
                      >
                        <img
                          src={p.images[0]}
                          alt={p.name}
                          className="w-10 h-10 object-cover rounded-lg bg-slate-800 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-200 truncate">{p.name}</p>
                          <p className="text-xs text-slate-400 truncate">
                            {translateCategory(p.categoryName || p.category, language)}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-sky-400 shrink-0">
                          {formatUSD(p.price)}
                        </span>
                      </Link>
                    ))}
                    <div
                      onClick={handleSearchSubmit}
                      className="p-2.5 text-center text-xs font-semibold text-sky-400 hover:bg-slate-800/60 cursor-pointer transition flex items-center justify-center gap-1 border-t border-slate-800"
                    >
                      <span>{t('nav_view_all_results', 'View all results for')} "{searchQuery}"</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2.5 shrink-0">
            
            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Wishlist Link - goes directly to full Wishlist page */}
            <Link
              to="/wishlist"
              className="hidden sm:flex relative p-2 text-slate-300 hover:text-rose-400 hover:bg-slate-800/60 rounded-xl transition shrink-0"
              title={`${t('nav_wishlist', 'Wishlist')} (${wishlist.length})`}
              aria-label={t('nav_wishlist', 'Wishlist')}
            >
              <Heart className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${wishlist.length > 0 ? 'text-rose-500 fill-rose-500' : ''}`} />
              {wishlist.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] sm:min-w-[18px] h-4 sm:h-[18px] px-1 bg-rose-500 text-white text-[9px] sm:text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Account: User Profile / Sara - accessible on mobile via drawer */}
            {isAuthenticated && user ? (
              /* Logged In State: [ Sara ▾ ] */
              <div className="hidden sm:block relative shrink-0" ref={userMenuRef}>
                <button
                  type="button"
                  id="navbar-user-menu-btn"
                  onClick={() => setIsUserMenuOpen(prev => !prev)}
                  className="flex items-center gap-2 p-1 hover:bg-slate-800/60 rounded-full transition group cursor-pointer"
                  aria-label="User Account Menu"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-700/80 shadow-2xs shrink-0 bg-blue-600 text-white flex items-center justify-center text-xs font-black">
                    {hasCustomAvatar(user) ? (
                      <img
                        src={user.avatar}
                        alt={userFirstName}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = '/images/avatars/sara.png'; }}
                      />
                    ) : (
                      <span>{userFirstName.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <span className="hidden sm:inline text-xs sm:text-sm font-semibold text-slate-200">
                    {userFirstName}
                  </span>
                  <ChevronDown
                    className={`hidden sm:inline w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-transform duration-200 ${
                      isUserMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-[#091124] rounded-2xl shadow-2xl border border-slate-700/80 py-2 z-50 animate-fadeIn text-white divide-y divide-slate-800">
                    <div className="px-4 py-2.5">
                      <div className="mb-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {t('nav_signed_in', 'Signed In')}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-white truncate">
                        {user.fullName || 'Customer'}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {user.email || 'customer@techtonic.store'}
                      </p>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/account"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-sky-400 transition"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        <span>{t('nav_my_account', 'My Account Overview')}</span>
                      </Link>

                      <Link
                        to="/account/orders"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-sky-400 transition"
                      >
                        <Package className="w-4 h-4 text-slate-400" />
                        <span>{t('nav_order_history', 'Order History & Tracking')}</span>
                      </Link>

                      <Link
                        to="/account/addresses"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-sky-400 transition"
                      >
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span>{t('nav_saved_addresses', 'Saved Delivery Hubs')}</span>
                      </Link>

                      {/* Admin Console - ONLY shown to admin role */}
                      {user?.role === 'admin' && (
                        <Link
                          to="/TechTonicAdmin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-purple-300 hover:bg-purple-950/40 border-t border-slate-800/80 transition"
                        >
                          <div className="flex items-center gap-2.5">
                            <LayoutDashboard className="w-4 h-4 text-purple-400" />
                            <span>{t('nav_admin_console', 'Admin Console')}</span>
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-wider bg-purple-500/30 text-purple-200 border border-purple-400/40 px-1.5 py-0.5 rounded">
                            Admin &rarr;
                          </span>
                        </Link>
                      )}
                    </div>

                    <div className="pt-1">
                      <button
                        type="button"
                        id="navbar-sign-out-btn"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
                          if (location.pathname.startsWith('/account') || location.pathname.startsWith('/admin') || location.pathname.startsWith('/TechTonicAdmin')) {
                            navigate('/');
                          }
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{t('nav_sign_out', 'Sign Out')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Guest State: Real [ Sign In ] button */
              <Link
                to="/login"
                id="navbar-sign-in-btn"
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-800/80 hover:bg-sky-500/20 text-slate-200 hover:text-sky-300 border border-slate-700/80 hover:border-sky-400/50 transition group shrink-0 shadow-xs cursor-pointer active:scale-95"
                aria-label={t('nav_sign_in', 'Sign In')}
                title={t('nav_sign_in', 'Sign In')}
              >
                <div className="w-6 h-6 rounded-full bg-sky-500/15 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs sm:text-sm font-semibold">
                  {t('nav_sign_in', 'Sign In')}
                </span>
              </Link>
            )}

            {/* Shopping Cart Button */}
            <button
              onClick={() => setIsCartDrawerOpen(true)}
              className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-2xl transition group shrink-0 shadow-md shadow-blue-500/30"
              aria-label="View Shopping Cart"
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-105 transition-transform text-white" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] sm:min-w-[20px] h-4.5 sm:h-5 px-1 flex items-center justify-center bg-white text-blue-600 font-extrabold text-[10px] sm:text-[11px] rounded-full shadow-xs animate-scaleIn">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Hamburger with Morphing Animation */}
            <div className="md:hidden flex items-center">
              <HamburgerButton
                isOpen={isMobileMenuOpen}
                onClick={onToggleMobileMenu || onOpenMobileMenu}
                color="bg-white"
                hoverBg="hover:bg-slate-800"
                ariaLabel={isMobileMenuOpen ? 'Close mobile menu' : 'Open mobile menu'}
              />
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}

export default Navbar;
