import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  Users,
  Store,
  X,
  Bell,
  Search,
  CheckCircle2,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { productService } from '../../services/productService';
import { orderService } from '../../services/orderService';
import { useLanguage } from '../../store/StoreContext';
import HamburgerButton from '../../components/common/HamburgerButton';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';

export default function AdminLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const notifRef = useRef(null);
  const navigate = useNavigate();
  const { language } = useLanguage();

  const location = useLocation();
  const isTechTonicAdminRoute = location.pathname.toLowerCase().startsWith('/techtonicadmin');
  const adminBase = isTechTonicAdminRoute ? '/TechTonicAdmin' : '/admin';

  const products = productService.getProducts();
  const orders = orderService.getOrders();
  const lowStockCount = products.filter((p) => p.stock <= 5).length;
  const pendingOrdersCount = orders.filter((o) => o.status === 'confirmed' || o.status === 'processing').length;

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
    {
      to: adminBase,
      label: language === 'km' ? 'ផ្ទាំងគ្រប់គ្រង' : 'Dashboard',
      icon: LayoutDashboard,
      end: true,
      count: null
    },
    {
      to: `${adminBase}/products`,
      label: language === 'km' ? 'ផលិតផល' : 'Products',
      icon: Package,
      count: lowStockCount > 0 ? lowStockCount : null,
      countTitle: language === 'km' ? `សល់តិច ${lowStockCount}` : `${lowStockCount} low stock`,
      countClass: 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
    },
    {
      to: `${adminBase}/categories`,
      label: language === 'km' ? 'ប្រភេទផលិតផល' : 'Categories',
      icon: FolderTree,
      count: null
    },
    {
      to: `${adminBase}/orders`,
      label: language === 'km' ? 'ការបញ្ជាទិញ' : 'Orders',
      icon: ShoppingBag,
      count: pendingOrdersCount > 0 ? pendingOrdersCount : null,
      countTitle: language === 'km' ? `ថ្មី ${pendingOrdersCount}` : `${pendingOrdersCount} pending`,
      countClass: 'bg-blue-500/25 text-blue-200 border border-blue-400/30'
    },
    {
      to: `${adminBase}/customers`,
      label: language === 'km' ? 'អតិថិជន' : 'Customers',
      icon: Users,
      count: null
    }
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`${adminBase}/products?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const renderNavLinks = (onItemClick) => (
    <nav className="px-3 space-y-1">
      {adminNav.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onItemClick}
            className={({ isActive }) =>
              `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] sm:text-sm transition-all ${
                isActive
                  ? 'bg-[#2563eb] text-white font-semibold shadow-sm shadow-blue-600/30'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white font-medium'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.count !== null && (
                  <span
                    title={item.countTitle}
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full leading-none tabular-nums shrink-0 ${
                      isActive ? 'bg-white/20 text-white' : item.countClass
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex font-sans selection:bg-blue-600 selection:text-white">
      {/* Desktop Dark Theme Left Sidebar Panel (per Design System Spec) */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 bg-[#0f172a] text-slate-300 border-r border-slate-800/90 sticky top-0 h-screen z-30">
        {/* Sidebar Brand Header */}
        <div className="h-14 px-5 flex items-center justify-between border-b border-slate-800/80 shrink-0">
          <Link to={adminBase} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 p-1 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
              <img
                src="/images/logo/techtonic-crest.png"
                alt="TechTonic Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white tracking-tight">TechTonic</span>
              <span className="text-[11px] font-medium text-slate-300 bg-slate-800 border border-slate-700/80 px-2 py-0.5 rounded-md">
                {language === 'km' ? 'អ្នកគ្រប់គ្រង' : 'Admin'}
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Section Label */}
        <div className="px-5 pt-5 pb-2 text-[11px] font-semibold text-slate-400">
          {language === 'km' ? 'ការគ្រប់គ្រងហាង' : 'Store Management'}
        </div>

        {/* 5 Clean Left Panel Tabs */}
        <div className="flex-1 overflow-y-auto py-1">
          {renderNavLinks()}
        </div>

        {/* Sidebar Bottom Utility */}
        <div className="p-3.5 border-t border-slate-800/80 space-y-2.5 shrink-0">
          <Link
            to="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-800 border border-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Store className="w-4 h-4 text-blue-400 shrink-0" />
              <span>{language === 'km' ? 'មើលហាងទំនិញផ្ទាល់' : 'View Live Store'}</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </Link>

          <div className="px-2 flex items-center justify-between text-[11px] text-slate-400">
            <span className="truncate">
              {language === 'km' ? 'ភ្នំពេញ កម្ពុជា' : 'Phnom Penh, KH'}
            </span>
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {language === 'km' ? 'ដំណើរការ' : 'Online'}
            </span>
          </div>
        </div>
      </aside>

      {/* Mobile Slide-Out Left Panel Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="relative w-64 max-w-[80vw] h-full bg-[#0f172a] text-slate-300 border-r border-slate-800 flex flex-col z-10 shadow-2xl">
            <div className="h-14 px-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <img
                  src="/images/logo/techtonic-crest.png"
                  alt="TechTonic Logo"
                  className="w-7 h-7 object-contain"
                />
                <span className="font-bold text-white text-sm">
                  {language === 'km' ? 'ម៉ឺនុយគ្រប់គ្រង' : 'Admin Menu'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 pt-4 pb-2 text-[11px] font-semibold text-slate-400">
              {language === 'km' ? 'ការគ្រប់គ្រងហាង' : 'Store Management'}
            </div>

            <div className="flex-1 overflow-y-auto py-1">
              {renderNavLinks(() => setMobileSidebarOpen(false))}
            </div>

            <div className="p-3.5 border-t border-slate-800">
              <Link
                to="/"
                target="_blank"
                rel="noreferrer"
                onClick={() => setMobileSidebarOpen(false)}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 border border-slate-800"
              >
                <div className="flex items-center gap-2.5">
                  <Store className="w-4 h-4 text-blue-400" />
                  <span>{language === 'km' ? 'មើលហាងទំនិញផ្ទាល់' : 'View Live Store'}</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              </Link>
            </div>
          </aside>
        </div>
      )}

      {/* Right Column: Top Clean Utility Header + Main Canvas */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 h-14 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Left: Mobile Menu Toggle + Page Context Search */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="md:hidden">
              <HamburgerButton
                isOpen={mobileSidebarOpen}
                onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                color="bg-slate-700"
                activeColor="bg-blue-600"
                hoverBg="hover:bg-slate-100"
                ariaLabel={language === 'km' ? 'បើក/បិទម៉ឺនុយរុករក' : 'Toggle Navigation'}
              />
            </div>

            <Link to={adminBase} className="md:hidden flex items-center gap-2 shrink-0">
              <span className="text-sm font-bold text-slate-900">TechTonic</span>
            </Link>

            {/* Clean Search Input */}
            <form onSubmit={handleSearchSubmit} className="hidden sm:block relative w-full max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder={language === 'km' ? 'ស្វែងរកផលិតផល ការបញ្ជាទិញ ឬអតិថិជន...' : 'Search products, orders, or customers...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-10 pr-3.5 rounded-xl bg-slate-100/80 border border-slate-200/80 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </form>
          </div>

          {/* Right: Language Switcher, Alerts, Profile */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <LanguageSwitcher variant="light" />

            {/* Notifications Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative h-9 w-9 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100/80 hover:bg-slate-200/70 border border-slate-200/80 flex items-center justify-center transition-colors cursor-pointer"
                aria-label={language === 'km' ? 'ការជូនដំណឹង' : 'Notifications'}
                title={language === 'km' ? 'ការជូនដំណឹង' : 'Notifications'}
              >
                <Bell className="w-4 h-4" />
                {(lowStockCount > 0 || pendingOrdersCount > 0) && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-slate-200 shadow-xl p-4 z-50">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                    <span className="text-xs font-bold text-slate-900">
                      {language === 'km' ? 'ការជូនដំណឹងប្រព័ន្ធ' : 'System Notifications'}
                    </span>
                    <span className="text-[11px] text-blue-600 font-semibold">
                      {language === 'km' ? 'ព័ត៌មានផ្ទាល់' : 'Live Feed'}
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    {lowStockCount > 0 && (
                      <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-amber-50 border border-amber-200/70 text-amber-900">
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block">
                            {language === 'km' ? 'ការព្រមានស្តុកទំនិញ' : 'Inventory Warning'}
                          </span>
                          <span className="text-[11px] text-amber-700">
                            {language === 'km'
                              ? `ឧបករណ៍ចំនួន ${lowStockCount} ត្រូវការបំពេញស្តុកបន្ថែម។`
                              : `${lowStockCount} hardware devices require replenishment.`}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-blue-50 border border-blue-200/70 text-blue-900">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">
                          {language === 'km' ? 'ច្រកទូទាត់បាគង NBC' : 'NBC Bakong Gateway'}
                        </span>
                        <span className="text-[11px] text-blue-700">
                          {language === 'km'
                            ? 'បណ្ដាញទូទាត់ KHQR ដំណើរការ 99.98% យ៉ាងរលូន។'
                            : 'KHQR payment network operating at 99.98% uptime.'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-800">
                      <ShoppingBag className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">
                          {language === 'km' ? 'សេវាដឹកជញ្ជូន GrabExpress' : 'GrabExpress Logistics'}
                        </span>
                        <span className="text-[11px] text-slate-500">
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

            {/* Admin Profile */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                AD
              </div>
              <div className="hidden lg:flex flex-col text-left leading-tight">
                <span className="text-xs font-bold text-slate-900">Alex Vance</span>
                <span className="text-[10px] text-emerald-600 font-semibold">
                  {language === 'km' ? 'អ្នកគ្រប់គ្រង' : 'TechTonicAdmin'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
