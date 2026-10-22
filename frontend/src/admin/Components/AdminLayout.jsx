import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
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
import { useToast } from '../../store/StoreContext';
import HamburgerButton from '../../components/common/HamburgerButton';

export default function AdminLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const notifRef = useRef(null);
  const navigate = useNavigate();
  const { addToast } = useToast();

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
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true, badge: null },
    { to: '/admin/products', label: 'Products', icon: Package, badge: lowStockCount > 0 ? `${lowStockCount} low` : null, badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30' },
    { to: '/admin/categories', label: 'Categories', icon: FolderTree, badge: null },
    { to: '/admin/orders', label: 'Orders', icon: ShoppingBag, badge: pendingOrdersCount > 0 ? `${pendingOrdersCount} new` : null, badgeColor: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
    { to: '/admin/customers', label: 'Customers', icon: Users, badge: null }
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
              ariaLabel="Toggle Navigation"
            />
          </div>

          <Link to="/admin" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
              <img
                src="/images/logo/techtonic-crest.png"
                alt="TechTonic Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <img
                  src="/images/logo/techtonic-script-orange.png"
                  alt="TechTonic"
                  className="h-7 w-auto object-contain group-hover:scale-105 transition-transform duration-200"
                />
                <span className="text-[10px] font-black uppercase text-lime-400 bg-lime-400/10 px-2 py-0.5 rounded-full border border-lime-400/20 font-mono">
                  Console v2.5
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Search & Operational Telemetry Pill */}
        <div className="hidden lg:flex items-center gap-6">
          <form onSubmit={handleSearchSubmit} className="relative w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search catalog, SKUs, or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
            />
          </form>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-[11px]">Toul Kork Central Hub • 100% Operational</span>
          </div>
        </div>

        {/* Right Action Icons & Profile */}
        <div className="flex items-center gap-3">
          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Notifications"
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
                    System Telemetry Alerts
                  </span>
                  <span className="text-[10px] text-blue-400 font-semibold">Live Feed</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  {lowStockCount > 0 && (
                    <div className="flex items-start gap-2.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">Inventory Warning</span>
                        <span className="text-[11px] text-amber-400/80">
                          {lowStockCount} hardware devices require replenishment.
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">NBC Bakong Gateway</span>
                      <span className="text-[11px] text-blue-400/80">
                        KHQR payment network operating at 99.98% uptime.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-300">
                    <ShoppingBag className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">GrabExpress Logistics</span>
                      <span className="text-[11px] text-slate-400">
                        Couriers active across Phnom Penh metropolitan district.
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
            <span className="hidden sm:inline">Storefront</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>

          {/* Admin Avatar */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-blue-600/30">
              AD
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-bold text-white leading-tight">Admin Executive</span>
              <span className="text-[10px] text-slate-400">Superuser</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800/80 p-4 gap-2 text-slate-400">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 py-2">
            Store Management
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

          {/* Quick Metrics Widget in Sidebar */}
          <div className="mt-8 p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-400 font-semibold">
              <span className="text-[10px] uppercase tracking-wider">Store Health</span>
              <span className="text-emerald-400 font-bold font-mono">99.8%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full w-[99%]" />
            </div>
            <p className="text-[10px] text-slate-500 leading-normal">
              Active Cambodian KHQR endpoints & GrabExpress courier webhooks synchronized.
            </p>
          </div>

          {/* Footer Info */}
          <div className="mt-auto pt-6 border-t border-slate-800 text-[11px] text-slate-500 px-3">
            <div className="flex items-center justify-between font-semibold text-slate-400">
              <span>TechTonic Engine</span>
              <span className="font-mono text-[10px]">v2.5.0</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">High-Performance E-Commerce SPA</p>
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
                <span className="font-bold text-white text-sm">Navigation Menu</span>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 py-1">
                Store Management
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
