import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Send,
  Phone,
  MapPin,
  Clock,
  Headphones,
  Watch,
  Keyboard,
  BatteryCharging,
  Package,
  User,
  ShoppingBag,
  LayoutDashboard,
  LogIn,
  Lock,
  CheckCircle2,
  Facebook,
  Instagram,
  Youtube,
  ArrowRight,
  Mail,
  Truck,
  RotateCcw,
  CreditCard
} from 'lucide-react';
import { useLanguage } from '../../store/StoreContext';

export function Footer() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setIsSubscribed(true);
      setTimeout(() => {
        setEmail('');
        setIsSubscribed(false);
      }, 3500);
    }
  };

  return (
    <footer className="relative bg-[#070b14] text-slate-300 border-t border-slate-800/80 mt-16">
      
      {/* 1. TRUST VALUE PROPOSITIONS BAR */}
      <div className="border-b border-slate-800/70 bg-slate-900/30">
        <div className="max-w-7xl xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <Truck className="w-6 h-6 text-blue-400 shrink-0" />
              <div>
                <h5 className="text-xs font-bold text-white tracking-tight">Express Delivery</h5>
                <p className="text-[11px] text-slate-400 mt-0.5">Phnom Penh & 25 Provinces</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-blue-400 shrink-0" />
              <div>
                <h5 className="text-xs font-bold text-white tracking-tight">1-Year Warranty</h5>
                <p className="text-[11px] text-slate-400 mt-0.5">100% Genuine Guaranteed</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <RotateCcw className="w-6 h-6 text-blue-400 shrink-0" />
              <div>
                <h5 className="text-xs font-bold text-white tracking-tight">30-Day Returns</h5>
                <p className="text-[11px] text-slate-400 mt-0.5">Hassle-Free Exchange</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-blue-400 shrink-0" />
              <div>
                <h5 className="text-xs font-bold text-white tracking-tight">Bakong KHQR & ABA</h5>
                <p className="text-[11px] text-slate-400 mt-0.5">Instant & Secure Payment</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. NEWSLETTER CARD CONTAINER */}
      <div className="max-w-7xl xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-blue-950/30 border border-slate-800 p-8 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative z-10">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-3">
                <Mail className="w-3.5 h-3.5" />
                <span>Stay In The Loop</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Subscribe to TechTonic Dispatch
              </h3>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                Be the first to receive notifications on new audio gear, mechanical keyboard switches, and exclusive member discounts in Cambodia.
              </p>
            </div>

            <div className="w-full lg:w-auto">
              <form onSubmit={handleNewsletterSubmit} className="w-full sm:w-[440px]">
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address..."
                      className="w-full bg-slate-950/80 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="shrink-0 px-6 py-3 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-blue-500/20"
                  >
                    <span>{isSubscribed ? 'Subscribed!' : 'Subscribe'}</span>
                    {!isSubscribed && <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-2.5">
                  No spam. You can unsubscribe at any time with one click.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MAIN NAVIGATION MATRIX */}
      <div className="max-w-7xl xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          
          {/* Col 1: Brand Info & Payment Rails (4 cols) */}
          <div className="md:col-span-6 lg:col-span-4 space-y-5">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="w-11 h-11 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <img
                  src="/images/logo/techtonic-crest.png"
                  alt="TechTonic Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <img
                src="/images/logo/techtonic-script-orange.png"
                alt="TechTonic"
                className="h-9 w-auto object-contain"
              />
            </Link>
            
            <p className="text-xs text-slate-400 leading-relaxed pr-4">
              TechTonic Store is Cambodia's premier destination for studio-grade acoustics, ergonomic mechanical keyboards, AMOLED wearables, and high-velocity GaN power accessories.
            </p>

            {/* Accepted Payments */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
                Official Payment Gateways
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold hover:border-slate-700 transition-colors">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Bakong KHQR
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold hover:border-slate-700 transition-colors">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  ABA Pay
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold hover:border-slate-700 transition-colors">
                  Visa / MC
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold hover:border-slate-700 transition-colors">
                  Wing Bank
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold hover:border-slate-700 transition-colors">
                  Cash on Delivery
                </span>
              </div>
            </div>
          </div>

          {/* Col 2: Categories (2.5 cols) */}
          <div className="md:col-span-3 lg:col-span-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Categories
            </h4>
            <ul className="space-y-3 text-xs">
              <li>
                <Link to="/shop?category=audio" className="text-slate-400 hover:text-white flex items-center gap-2.5 transition-colors group">
                  <Headphones className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                  <span>Audio & Acoustics</span>
                </Link>
              </li>
              <li>
                <Link to="/shop?category=wearables" className="text-slate-400 hover:text-white flex items-center gap-2.5 transition-colors group">
                  <Watch className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                  <span>Smart Wearables</span>
                </Link>
              </li>
              <li>
                <Link to="/shop?category=workspace" className="text-slate-400 hover:text-white flex items-center gap-2.5 transition-colors group">
                  <Keyboard className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                  <span>Workspace Keyboards</span>
                </Link>
              </li>
              <li>
                <Link to="/shop?category=power" className="text-slate-400 hover:text-white flex items-center gap-2.5 transition-colors group">
                  <BatteryCharging className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                  <span>Power & Chargers</span>
                </Link>
              </li>
              <li className="pt-1 border-t border-slate-800/80">
                <Link to="/shop" className="text-blue-400 hover:text-blue-300 font-bold inline-flex items-center gap-1.5 transition-colors">
                  <span>Browse All Hardware</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Customer Care (2.5 cols) */}
          <div className="md:col-span-3 lg:col-span-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Customer Support
            </h4>
            <ul className="space-y-3 text-xs">
              <li>
                <Link to="/account/orders" className="text-slate-400 hover:text-white flex items-center gap-2.5 transition-colors group">
                  <Package className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                  <span>Track My Order</span>
                </Link>
              </li>
              <li>
                <Link to="/account" className="text-slate-400 hover:text-white flex items-center gap-2.5 transition-colors group">
                  <User className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                  <span>Member Account</span>
                </Link>
              </li>
              <li>
                <Link to="/cart" className="text-slate-400 hover:text-white flex items-center gap-2.5 transition-colors group">
                  <ShoppingBag className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                  <span>Shopping Bag</span>
                </Link>
              </li>
              <li>
                <Link to="/TechTonicAdmin" className="text-slate-400 hover:text-white flex items-center gap-2.5 transition-colors group">
                  <LayoutDashboard className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                  <span>Admin Management</span>
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-slate-400 hover:text-white flex items-center gap-2.5 transition-colors group">
                  <LogIn className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                  <span>Sign In / Register</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Store Location & Flagship (4 cols) */}
          <div className="md:col-span-6 lg:col-span-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Store Location & Contact
              </h4>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Open Today
              </span>
            </div>
            
            <ul className="space-y-3 text-xs text-slate-400">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed text-slate-300">
                  Street 271, Sangkat Boeng Tumpun, Khan Mean Chey, Phnom Penh, Cambodia
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-300">Monday – Sunday: 8:00 AM – 9:00 PM</span>
              </li>
              <li className="flex items-center gap-3">
                <Send className="w-4 h-4 text-blue-400 shrink-0" />
                <a
                  href="https://t.me/techtonic_kh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline font-medium"
                >
                  Telegram: @techtonic_kh
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <a href="tel:+855023999888" className="hover:text-white transition text-slate-300">
                  (+855) 023 999 888
                </a>
              </li>
            </ul>

            {/* Social Channels */}
            <div className="flex items-center gap-2.5 pt-5">
              <a
                href="https://t.me/techtonic_kh"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 text-slate-400 hover:text-blue-400 flex items-center justify-center transition-all hover:scale-105"
                title="Telegram"
              >
                <Send className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 text-slate-400 hover:text-blue-400 flex items-center justify-center transition-all hover:scale-105"
                title="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 text-slate-400 hover:text-blue-400 flex items-center justify-center transition-all hover:scale-105"
                title="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 text-slate-400 hover:text-blue-400 flex items-center justify-center transition-all hover:scale-105"
                title="YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

        </div>

        {/* 4. BOTTOM LEGAL & SECURITY BAR */}
        <div className="border-t border-slate-800/80 pt-6 mt-12 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 TechTonic Store. All rights reserved.</p>
          
          <div className="flex items-center gap-5 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-blue-400" />
              <span>256-Bit SSL Secure</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              <span>NBC Bakong Certified</span>
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              <span>Phnom Penh Flagship</span>
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span className="hover:text-white cursor-pointer transition">Privacy Policy</span>
            <span className="hover:text-white cursor-pointer transition">Terms of Service</span>
            <span className="hover:text-white cursor-pointer transition">Warranty Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;