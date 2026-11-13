import React from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import {
  User,
  Package,
  MapPin,
  FileText,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Crown,
  Headphones,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { useAuth, useToast, useLanguage } from '../../store/StoreContext';
import { orderService } from '../../services/orderService';

export default function AccountLayout() {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const orders = orderService.getOrders();

  const handleLogout = () => {
    logout();
    addToast(language === 'km' ? 'អ្នកបានចាកចេញពីគណនីដោយជោគជ័យ' : 'You have been signed out successfully', 'info');
    navigate('/login');
  };

  const navItems = [
    { to: '/account', label: t('account_overview', 'Dashboard Overview'), icon: LayoutDashboard, end: true },
    { to: '/account/orders', label: t('account_orders', 'My Orders'), icon: Package, badge: orders.length },
    { to: '/account/profile', label: t('account_profile', 'Profile Details'), icon: User },
    { to: '/account/addresses', label: t('account_addresses', 'Saved Addresses'), icon: MapPin, badge: user?.addresses?.length || 1 },
    { to: '/account/invoices', label: t('account_invoices', 'Invoices & Receipts'), icon: FileText }
  ];

  const userName = user?.name || user?.fullName || 'Sara Meng';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Top Customer Member Banner */}
      <div className="relative bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-800 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          {/* User Profile Info */}
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl sm:text-3xl font-black shadow-md border border-white/10">
                {userInitial}
              </div>
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-1">
                {userName}
              </h1>

              <p className="text-xs text-slate-400 font-medium">
                {user?.email || 'sara.student@techtonic.com'}
              </p>

              <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                <span>
                  {language === 'km' ? 'សមាជិកតាំងពី៖' : 'Member Since:'}{' '}
                  <strong className="text-slate-200 font-medium">{language === 'km' ? 'មករា ២០២៥' : 'January 2025'}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-3 self-start md:self-center shrink-0">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-sm transition-all"
            >
              <span>{t('nav_browse_catalog', 'Browse Store')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              id="account-sign-out-btn"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t('nav_sign_out', 'Sign Out')}</span>
            </button>
          </div>

        </div>
      </div>

      {/* 2-Column Layout: Navigation Sidebar & Sub-page Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Navigation Sidebar (3 Cols) */}
        <aside className="lg:col-span-3 space-y-5">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-3 shadow-sm">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge !== undefined && (
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Customer Support Card */}
          <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200/90 shadow-2xs">
            <div className="flex items-center gap-2.5 mb-2">
              <Headphones className="w-5 h-5 text-blue-600" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  {language === 'km' ? 'ត្រូវការជំនួយមែនទេ?' : 'Need Assistance?'}
                </h4>
                <span className="text-[11px] text-slate-500">
                  {language === 'km' ? 'មជ្ឈមណ្ឌលជំនួយភ្នំពេញ' : 'Phnom Penh Support Hub'}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-3.5">
              {language === 'km'
                ? 'ទាក់ទងក្រុមការងាររបស់យើងសម្រាប់ការតាមដានដឹកជញ្ជូន ការធានា ឬប្រឹក្សាផលិតផល។'
                : 'Contact our team for delivery tracking, warranty claims, or product advice.'}
            </p>
            <a
              href="mailto:support@techtonic.dev"
              className="inline-flex items-center justify-center w-full py-2 px-3 rounded-xl text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 transition-colors shadow-2xs"
            >
              {language === 'km' ? 'ទាក់ទងផ្នែកជំនួយ' : 'Contact Support'}
            </a>
          </div>
        </aside>

        {/* Right Child Sub-page (9 Cols) */}
        <main className="lg:col-span-9 bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 lg:p-10 shadow-sm">
          <Outlet />
        </main>

      </div>
    </div>
  );
}
