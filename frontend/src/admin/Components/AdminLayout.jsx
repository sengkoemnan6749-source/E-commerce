import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  Users,
  Store,
  Menu,
  X,
  Bell,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ExternalLink,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { productService } from '../../services/productService';
import { orderService } from '../../services/orderService';
import { useToast, useLanguage } from '../../store/StoreContext';
import HamburgerButton from '../../components/common/HamburgerButton';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';

export default function AdminLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const notifRef = useRef(null);
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { language } = useLanguage();

  const location = useLocation();
  const isTechTonicAdminRoute = location.pathname.toLowerCase().startsWith('/techtonicadmin');
  const adminBase = isTechTonicAdminRoute ? '/TechTonicAdmin' : '/admin';

  const products = productService.getProducts();
  const orders = orderService.getOrders();
  const lowStockCount = products.filter((p) => p.stock <= 5).length;
  const pendingOrdersCount = orders.filter((o) => o.status === 'confirmed' || o.status === 'processing').length;

  // Close notifications on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const adminNav = [
    { to: adminBase, label: language === 'km' ? 'ផ្ទាំងគ្រប់គ្រង' : 'Dashboard', icon: LayoutDashboard, end: true, badge: null },
    { to: `${adminBase}/products`, label: language === 'km' ? 'ផលិតផល' : 'Products', icon: Package, badge: lowStockCount > 0 ? (language === 'km' ? `សល់តិច ${lowStockCount}` : `${lowStockCount} low`) : null, badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30' },
    { to: `${adminBase}/categories`, label: language === 'km' ? 'ប្រភេទផលិតផល' : 'Categories', icon: FolderTree, badge: null },
    { to: `${adminBase}/orders`, label: language === 'km' ? 'ការបញ្ជាទិញ' : 'Orders', icon: ShoppingBag, badge: pendingOrdersCount > 0 ? (language === 'km' ? `ថ្មី ${pendingOrdersCount}` : `${pendingOrdersCount} new`) : null, badgeColor: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
    { to: `${adminBase}/customers`, label: language === 'km' ? 'អតិថិជន' : 'Customers', icon: Users, badge: null }
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/admin/products?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Admin Executive Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="md:hidden">
            <HamburgerButton
              isOpen={mobileSidebarOpen}
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              color="bg-slate-300"
              activeColor="bg-cyan-400"
              hoverBg="hover:bg-slate-800"
              ariaLabel={language === 'km' ? 'បើក/បិទម៉ឺនុយរុករក' : 'Toggle Navigation'}
            />
          </div>

          <Link to={adminBase} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
              <img
                src="/images/logo/techtonic-crest.png"
                alt="TechTonic Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-black text-white tracking-tight">TechTonic</span>
              <span className="text-xs font-semibold text-slate-400">
                {language === 'km' ? 'អ្នកគ្រប់គ្រង' : 'Admin'}
              </span>
            </div>
          </Link>
        </div>

        {/* Global Search Bar */}
        <div className="hidden lg:flex items-center">
          <form onSubmit={handleSearchSubmit} className="relative w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={language === 'km' ? 'ស្វែងរកផលិតផល ការបញ្ជាទិញ ឬអតិថិជន...' : 'Search products, orders, or customers...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
            />
          </form>
        </div>

        {/* Right Action Icons & Profile */}
        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label={language === 'km' ? 'ការជូនដំណឹង' : 'Notifications'}
            >
              <Bell className="w-4 h-4" />
              {(lowStockCount > 0 || pendingOrdersCount > 0) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-slate-900" />
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    {language === 'km' ? 'ការជូនដំណឹងប្រព័ន្ធ' : 'System Notifications'}
                  </span>
                  <span className="text-[10px] text-blue-400 font-semibold">
                    {language === 'km' ? 'ព័ត៌មានផ្ទាល់' : 'Live Feed'}
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  {lowStockCount > 0 && (
                    <div className="flex items-start gap-2.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">
                          {language === 'km' ? 'ការព្រមានស្តុកទំនិញ' : 'Inventory Warning'}
                        </span>
                        <span className="text-[11px] text-amber-400/80">
                          {language === 'km'
                            ? `ឧបករណ៍ចំនួន ${lowStockCount} ត្រូវការបំពេញស្តុកបន្ថែម។`
                            : `${lowStockCount} hardware devices require replenishment.`}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">
                        {language === 'km' ? 'ច្រកទូទាត់បាគង NBC' : 'NBC Bakong Gateway'}
                      </span>
                      <span className="text-[11px] text-blue-400/80">
                        {language === 'km'
                          ? 'បណ្ដាញទូទាត់ KHQR ដំណើរការ 99.98% យ៉ាងរលូន។'
                          : 'KHQR payment network operating at 99.98% uptime.'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-300">
                    <ShoppingBag className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">
                        {language === 'km' ? 'សេវាដឹកជញ្ជូន GrabExpress' : 'GrabExpress Logistics'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {language === 'km'
                          ? 'អ្នកដឹកជញ្ជូនកំពុងសកម្មទូទាំងរាជធានីភ្នំពេញ។'
                          : 'Couriers active across Phnom Penh metropolitan district.'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Storefront Link */}
          <Link
            to="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 transition-colors"
          >
            <Store className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">
              {language === 'km' ? 'ហាងទំនិញ' : 'Storefront'}
            </span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>

          {/* Admin Avatar */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-blue-600/30">
              AD
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-bold text-white leading-tight">Alex Vance</span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">
                {language === 'km' ? 'តួនាទី៖ TechTonicAdmin' : 'Role: TechTonicAdmin'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800/80 p-4 gap-2 text-slate-400">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 py-2">
            {language === 'km' ? 'ការគ្រប់គ្រងហាង' : 'Store Management'}
          </div>

          <nav className="space-y-1">
            {adminNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold'
                        : 'hover:bg-slate-800/80 hover:text-slate-100 text-slate-400'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Sidebar Bottom Utilities */}
          <div className="mt-auto pt-4 border-t border-slate-800 space-y-2">
            <Link
              to="/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Store className="w-4 h-4 text-blue-400" />
                <span>{language === 'km' ? 'មើលហាងទំនិញផ្ទាល់' : 'View Live Store'}</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            </Link>

            <div className="px-3 py-2 text-[11px] text-slate-500">
              <div className="flex items-center justify-between font-medium text-slate-400">
                <span>{language === 'km' ? 'TechTonic អេឡិចត្រូនិច' : 'TechTonic Electronics'}</span>
                <span className="text-[10px] text-emerald-400 font-medium">
                  {language === 'km' ? 'កំពុងដំណើរការ' : 'Online'}
                </span>
              </div>
              <p className="text-[10px] text-slate-600 mt-0.5">
                {language === 'km' ? 'រាជធានីភ្នំពេញ កម្ពុជា' : 'Phnom Penh, Cambodia'}
              </p>
            </div>
          </div>
        </aside>

        {/* Mobile Slide-out Drawer */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="relative w-64 h-full bg-slate-900 p-4 flex flex-col gap-2 z-50 border-r border-slate-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-2">
                <span className="font-bold text-white text-sm">
                  {language === 'km' ? 'ម៉ឺនុយរុករក' : 'Navigation Menu'}
                </span>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 py-1">
                {language === 'km' ? 'ការគ្រប់គ្រងហាង' : 'Store Management'}
              </div>

              {adminNav.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                        isActive
                          ? 'bg-blue-600 text-white font-bold'
                          : 'hover:bg-slate-800 text-slate-400'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Admin Content View (Clean High-Contrast Slate Canvas) */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden bg-slate-100 min-h-screen text-slate-900">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
