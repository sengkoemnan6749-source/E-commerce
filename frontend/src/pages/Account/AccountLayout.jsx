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
import { useAuth, useToast } from '../../store/StoreContext';
import { orderService } from '../../services/orderService';

export default function AccountLayout() {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const orders = orderService.getOrders();

  const handleLogout = () => {
    logout();
    addToast('You have been signed out successfully', 'info');
    navigate('/login');
  };

  const navItems = [
    { to: '/account', label: 'Dashboard Overview', icon: LayoutDashboard, end: true },
    { to: '/account/orders', label: 'My Orders', icon: Package, badge: orders.length },
    { to: '/account/profile', label: 'Profile Details', icon: User },
    { to: '/account/addresses', label: 'Saved Addresses', icon: MapPin, badge: user?.addresses?.length || 1 },
    { to: '/account/invoices', label: 'Invoices & Receipts', icon: FileText }
  ];

  const userName = user?.name || user?.fullName || 'Sara Meng';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Top Executive VIP Member Banner */}
      <div className="relative bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800/80 overflow-hidden mb-8">
        {/* Ambient atmospheric glows */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          {/* User Profile Info */}
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center text-2xl sm:text-3xl font-black shadow-lg shadow-blue-500/30 border-2 border-white/20">
                {userInitial}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-slate-900 shadow-sm" title="Verified Customer">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-1">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {userName}
                </h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-300 bg-amber-400/15 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                  <Crown className="w-3 h-3 fill-amber-300 text-amber-300" />
                  <span>Titanium Premier</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-300 bg-cyan-400/10 px-2.5 py-0.5 rounded-full border border-cyan-400/20">
                  <ShieldCheck className="w-3 h-3 text-cyan-400" />
                  <span>Verified Warranty</span>
                </span>
              </div>

              <p className="text-xs text-slate-300/80 font-medium">
                {user?.email || 'sara.meng@techtonic.dev'} • Member ID: <span className="font-mono text-cyan-300">TT-88204</span>
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-2.5 text-xs text-slate-300">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>Member Since: <strong className="text-white">January 2025</strong></span>
                </span>
                <span className="hidden sm:inline text-slate-600">•</span>
                <span className="text-slate-400">
                  Hardware Credits: <strong className="text-emerald-400 font-bold">1,250 Pts ($12.50)</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-3 self-start md:self-center shrink-0">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600/80 hover:bg-blue-600 border border-blue-400/30 hover:border-blue-400 shadow-sm transition-all"
            >
              <span>Explore Hardware</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              id="account-sign-out-btn"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-rose-400 bg-white/5 hover:bg-rose-500/10 border border-white/10 hover:border-rose-400/30 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
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

          {/* Dedicated VIP Concierge Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 to-blue-950 text-white border border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-cyan-400 flex items-center justify-center border border-blue-400/30">
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-white">VIP Concierge</h4>
                <span className="text-[10px] text-cyan-300 font-semibold">Priority 24/7 Support</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
              Direct access to our hardware engineering team for setup, warranty claims, and repairs.
            </p>
            <a
              href="mailto:support@techtonic.dev"
              className="inline-flex items-center justify-center w-full py-2 px-3 rounded-xl text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 transition-colors shadow-2xs"
            >
              Contact Concierge
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
