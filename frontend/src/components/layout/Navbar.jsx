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
import HamburgerButton from '../common/HamburgerButton';
import LanguageSwitcher from '../common/LanguageSwitcher';

const CATEGORIES = [
  {
    id: 'audio',
    name: 'Audio & Acoustics',
    slug: 'audio',
    description: 'Studio ANC headphones, wireless buds & lossless sound',
    icon: Headphones,
    color: 'bg-blue-50 text-blue-600',
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
    color: 'bg-emerald-50 text-emerald-600',
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
    color: 'bg-purple-50 text-purple-600',
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
    color: 'bg-amber-50 text-amber-600',
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
  const { user, isAuthenticated, logout, isAdmin, loginAsCustomer, loginAsAdmin } = useAuth();
  const { wishlist, openWishlistDrawer } = useWishlist();
  const { t } = useLanguage();
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

  const navItemClass = ({ isActive }) =>
    `relative text-sm font-semibold transition-all duration-150 px-3.5 py-1.5 rounded-full whitespace-nowrap ${
      isActive
        ? 'text-sky-400 font-bold after:content-[""] after:absolute after:-bottom-2.5 after:left-1/2 after:-translate-x-1/2 after:w-6 after:h-0.5 after:bg-sky-400 after:rounded-full after:shadow-[0_0_10px_#38bdf8]'
        : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
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
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-600 text-white shadow-xs">
                STORE
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 shrink-0">
            <NavLink to="/" className={navItemClass}>
              {t('nav_home', 'Home')}
            </NavLink>
            <NavLink to="/shop" className={navItemClass}>
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
                className={`flex items-center gap-1.5 text-sm font-semibold transition-all duration-150 px-3 py-1.5 rounded-full whitespace-nowrap ${
                  isCategoryOpen
                    ? 'text-sky-400 bg-slate-800/60 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
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
                    <div className="px-3 py-2 border-b border-slate-800 mb-1 flex items-center justify-between">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Product Categories & Subcategories
                      </p>
                      <span className="text-[10px] font-semibold text-sky-400 bg-sky-950/80 border border-sky-500/30 px-1.5 py-0.5 rounded">
                        4 Collections
                      </span>
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
                              <div className={`p-2 rounded-xl shrink-0 ${cat.color} group-hover:scale-105 transition-transform`}>
                                <IconComponent className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-bold text-slate-200 group-hover:text-sky-400 transition-colors">
                                    {cat.name}
                                  </span>
                                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all" />
                                </div>
                                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                                  {cat.description}
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
                                    {sub.name}
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
                        <span>Browse Entire Catalog</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <NavLink to="/account/orders" className={navItemClass}>
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
                  <span>Hardware Results</span>
                  <span className="text-sky-400">{searchResults.length} found</span>
                </div>
                {searchResults.length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-400">
                    No hardware found for "{searchQuery}".
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
                          <p className="text-xs text-slate-400 truncate">{p.categoryName || p.category}</p>
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
                      <span>View all results for "{searchQuery}"</span>
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

            {/* Wishlist Button - accessible on mobile via drawer */}
            <button
              type="button"
              onClick={openWishlistDrawer}
              className="hidden sm:flex relative p-2 text-slate-300 hover:text-rose-400 hover:bg-slate-800/60 rounded-xl transition shrink-0"
              title={`Wishlist (${wishlist.length} saved)`}
              aria-label="Wishlist"
            >
              <Heart className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${wishlist.length > 0 ? 'text-rose-500 fill-rose-500' : ''}`} />
              {wishlist.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] sm:min-w-[18px] h-4 sm:h-[18px] px-1 bg-rose-500 text-white text-[9px] sm:text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                  {wishlist.length}
                </span>
              )}
            </button>

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
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-700/80 shadow-2xs shrink-0">
                    <img
                      src={user?.avatar || '/images/avatars/sara.png'}
                      alt={userFirstName}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = '/images/avatars/sara.png'; }}
                    />
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
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {t('nav_signed_in', 'Signed In')}
                        </p>
                        {user.role === 'admin' ? (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase">
                            Admin
                          </span>
                        ) : (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40 uppercase">
                            Customer
                          </span>
                        )}
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
                        <span>Saved Delivery Hubs</span>
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
                            <span>TechTonicAdmin Console</span>
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-wider bg-purple-500/30 text-purple-200 border border-purple-400/40 px-1.5 py-0.5 rounded">
                            Role: Admin &rarr;
                          </span>
                        </Link>
                      )}
                    </div>

                    {/* Quick Role Switcher for testing */}
                    <div className="px-4 py-2 bg-slate-900/60">
                      <p className="text-[10px] text-slate-400 font-medium mb-1">
                        Switch Account View:
                      </p>
                      {user?.role === 'admin' ? (
                        <button
                          type="button"
                          onClick={() => {
                            loginAsCustomer();
                            setIsUserMenuOpen(false);
                            if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/TechTonicAdmin')) {
                              navigate('/account');
                            }
                          }}
                          className="w-full text-left flex items-center justify-between text-[11px] font-semibold text-sky-400 hover:text-sky-300 transition py-0.5 cursor-pointer"
                        >
                          <span>Switch to Customer (Sara)</span>
                          <span className="text-[10px]">&rarr;</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            loginAsAdmin();
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full text-left flex items-center justify-between text-[11px] font-semibold text-purple-400 hover:text-purple-300 transition py-0.5 cursor-pointer"
                        >
                          <span>Switch to Admin (Alex)</span>
                          <span className="text-[10px]">&rarr;</span>
                        </button>
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
