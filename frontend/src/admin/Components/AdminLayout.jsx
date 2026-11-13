import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  Users,
  Store,
  Bell,
  Search,
  CheckCircle2,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { productService } from '../../services/productService';
import { orderService } from '../../services/orderService';
import { useLanguage } from '../../store/StoreContext';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';

export default function AdminLayout() {
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
      countClass: 'bg-amber-100 text-amber-700'
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
      countClass: 'bg-blue-100 text-blue-700'
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Clean Header Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          {/* Left: Brand Identity */}
          <Link to={adminBase} className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 rounded-lg bg-slate-900 p-1 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
              <img
                src="/images/logo/techtonic-crest.png"
                alt="TechTonic Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-slate-900 tracking-tight">TechTonic</span>
              <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-md">
                {language === 'km' ? 'អ្នកគ្រប់គ្រង' : 'Admin'}
              </span>
            </div>
          </Link>

          {/* Center: Clean Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
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

          {/* Right: Language Switcher, Alerts, Storefront, Profile */}
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
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
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

            {/* Storefront Link */}
            <Link
              to="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100/80 hover:bg-slate-200/70 border border-slate-200/80 transition-colors"
            >
              <Store className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">
                {language === 'km' ? 'ហាងទំនិញ' : 'Storefront'}
              </span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>

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
        </div>

        {/* Clean Horizontal 5-Tab Navigation Bar */}
        <nav
          aria-label={language === 'km' ? 'ការរុករកអ្នកគ្រប់គ្រង' : 'Admin Navigation'}
          className="bg-white border-t border-slate-100"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {adminNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `relative inline-flex items-center gap-2 px-3.5 py-3 text-xs sm:text-sm whitespace-nowrap border-b-2 transition-colors shrink-0 ${
                      isActive
                        ? 'border-blue-600 text-blue-600 font-bold bg-blue-50/40'
                        : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                      {item.count !== null && (
                        <span
                          title={item.countTitle}
                          className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full leading-none tabular-nums ${item.countClass}`}
                        >
                          {item.count}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <Outlet />
        </div>
      </main>

      {/* Minimal Status Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-3.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-[11px] text-slate-500">
          <span>
            {language === 'km'
              ? 'TechTonic អេឡិចត្រូនិច • រាជធានីភ្នំពេញ កម្ពុជា'
              : 'TechTonic Electronics • Phnom Penh, Cambodia'}
          </span>
          <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {language === 'km' ? 'កំពុងដំណើរការ' : 'Online'}
          </span>
        </div>
      </footer>
    </div>
  );
}
