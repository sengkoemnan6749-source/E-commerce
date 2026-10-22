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
  ShieldCheck,
  CheckCircle2,
  Crown,
  X,
  ArrowRight,
  Globe
} from 'lucide-react';
import { useAuth, useCart, useWishlist, useLanguage } from '../../store/StoreContext';
import HamburgerButton from '../common/HamburgerButton';
import LanguageSwitcher from '../common/LanguageSwitcher';

export function MobileMenu({ isOpen, onClose }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount } = useCart();
  const { wishlist } = useWishlist();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSearch = (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    onClose();
    navigate(`/shop?search=${encodeURIComponent(search.trim())}`);
  };

  const CATEGORIES = [
    {
      to: '/shop?category=audio',
      name: 'Audio & Acoustics',
      tag: 'Studio ANC',
      icon: Headphones,
      color: 'text-blue-600',
      bg: 'bg-blue-50 border-blue-200/80'
    },
    {
      to: '/shop?category=wearables',
      name: 'Smart Wearables',
      tag: 'AMOLED & Biosensors',
      icon: Watch,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 border-emerald-200/80'
    },
    {
      to: '/shop?category=workspace',
      name: 'Workspace Peripherals',
      tag: 'CNC Mechanical',
      icon: Keyboard,
      color: 'text-purple-600',
      bg: 'bg-purple-50 border-purple-200/80'
    },
    {
      to: '/shop?category=power',
      name: 'Power & Mobile',
      tag: 'GaN III 100W',
      icon: Zap,
      color: 'text-amber-600',
      bg: 'bg-amber-50 border-amber-200/80'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden md:hidden animate-fadeIn">
      {/* Dimmed Frosted Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-sm w-full bg-white shadow-2xl flex flex-col z-50 animate-slideLeft border-l border-slate-200/80">
        
        {/* 1. TOP HEADER */}
        <div className="p-4 px-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 flex items-center justify-center shrink-0">
              <img
                src="/images/logo/techtonic-crest.png"
                alt="TechTonic Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <img
                src="/images/logo/techtonic-script-orange.png"
                alt="TechTonic"
                className="h-6 w-auto object-contain"
              />
              <span className="text-[10px] text-lime-400 font-semibold tracking-wide">
                Hardware Engineering
              </span>
            </div>
          </div>

          {/* Morphing Animated Hamburger Close Button */}
          <HamburgerButton
            isOpen={true}
            onClick={onClose}
            color="bg-white"
            activeColor="bg-cyan-400"
            hoverBg="hover:bg-white/10"
            ariaLabel="Close mobile menu"
          />
        </div>

        {/* 2. SEARCH BAR */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <form onSubmit={handleSearch} className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search headphones, keyboards, chargers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 text-xs bg-white rounded-xl border border-slate-200/90 shadow-2xs placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>
        </div>

        {/* 3. SCROLLABLE NAVIGATION CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* Section: Language Switcher */}
          <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 shrink-0">
              <Globe className="w-4 h-4 text-blue-600" />
              <span>{t('nav_language', 'Language')}</span>
            </div>
            <LanguageSwitcher variant="segmented" />
          </div>

          {/* Section: Core Store Navigation */}
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                Store Navigation
              </span>
            </div>
            
            <div className="space-y-1.5">
              <Link
                to="/"
                onClick={onClose}
                className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-bold text-xs transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Home className="w-4 h-4" />
                  </div>
                  <span>{t('nav_home', 'Home Storefront')}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                to="/shop"
                onClick={onClose}
                className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-bold text-xs transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span>{t('nav_shop', 'Shop')}</span>
                </div>
                <span className="text-[10px] font-extrabold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200">
                  All Gear
                </span>
              </Link>

              <Link
                to="/wishlist"
                onClick={onClose}
                className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-bold text-xs transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                  </div>
                  <span>Saved Wishlist</span>
                </div>
                {wishlist.length > 0 ? (
                  <span className="text-[10px] font-extrabold text-white bg-rose-500 px-2 py-0.5 rounded-full shadow-xs">
                    {wishlist.length} Items
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-400">Empty</span>
                )}
              </Link>

              <Link
                to="/cart"
                onClick={onClose}
                className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-bold text-xs transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <span>Shopping Cart</span>
                </div>
                {cartCount > 0 ? (
                  <span className="text-[10px] font-extrabold text-white bg-blue-600 px-2 py-0.5 rounded-full shadow-xs">
                    {cartCount} Items
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-400">0</span>
                )}
              </Link>

              <Link
                to="/account/orders"
                onClick={onClose}
                className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-bold text-xs transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Truck className="w-4 h-4" />
                  </div>
                  <span>Track My Order</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Live Dispatch
                </span>
              </Link>
            </div>
          </div>

          {/* Section: Hardware Categories */}
          <div>
            <div className="flex items-center justify-between mb-2.5 px-1">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                Hardware Categories
              </span>
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              {CATEGORIES.map((cat, i) => {
                const IconComponent = cat.icon;
                return (
                  <Link
                    key={i}
                    to={cat.to}
                    onClick={onClose}
                    className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200/80 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${cat.bg} ${cat.color} shrink-0 group-hover:scale-105 transition-transform`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block leading-tight">
                          {cat.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {cat.tag}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Section: Official Hardware Guarantee Pill */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/60 border border-blue-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black text-blue-950 block leading-tight">
                1-Year Official Warranty
              </span>
              <span className="text-[10px] text-blue-700 font-medium">
                Phnom Penh Flagship Service Center
              </span>
            </div>
          </div>

          {/* Section: Management Console */}
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                System Management
              </span>
            </div>
            <Link
              to="/admin"
              onClick={onClose}
              className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-md group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <LayoutDashboard className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-black block">Admin Management Console</span>
                  <span className="text-[10px] text-slate-400">Inventory, orders & analytics</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

        </div>

        {/* 4. FOOTER: VIP USER PROFILE BAR */}
        <div className="p-4 px-5 border-t border-slate-100 bg-slate-50/80">
          {isAuthenticated ? (
            <div className="flex items-center justify-between">
              <Link
                to="/account"
                onClick={onClose}
                className="flex items-center gap-3 group min-w-0"
              >
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-sm group-hover:scale-105 transition-transform">
                    {(user?.name || user?.fullName || 'S').charAt(0).toUpperCase()}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-black text-slate-900 truncate">
                      {user?.name || user?.fullName || 'Sara Meng'}
                    </p>
                    <span className={`inline-flex items-center text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                      user?.role === 'admin' 
                        ? 'text-purple-700 bg-purple-100 border border-purple-200' 
                        : 'text-amber-700 bg-amber-100/80 border border-amber-200'
                    }`}>
                      {user?.role === 'admin' ? 'ADMIN' : 'VIP'}
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-600 font-semibold truncate">
                    {user?.role === 'admin' ? 'Admin Console &rarr;' : 'My Account & Orders &rarr;'}
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
                className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                to="/login"
                onClick={onClose}
                className="py-2.5 text-center text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={onClose}
                className="py-2.5 text-center text-xs font-extrabold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl shadow-2xs transition-colors"
              >
                Register
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default MobileMenu;
