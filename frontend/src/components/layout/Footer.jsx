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
import { useLanguage, useToast } from '../../store/StoreContext';
import { api } from '../../services/api';

export function Footer() {
  const { t, language } = useLanguage();
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || subscribing) return;
    setSubscribing(true);
    try {
      await api.post('/newsletter/subscribe', { email: cleanEmail, language });
      setIsSubscribed(true);
      addToast(
        language === 'km'
          ? 'បានចុះឈ្មោះទទួលព័ត៌មានថ្មីៗដោយជោគជ័យ!'
          : 'Subscribed to TechTonic Dispatch!',
        'success'
      );
      setEmail('');
      setTimeout(() => setIsSubscribed(false), 3500);
    } catch (err) {
      addToast(err?.message || 'Unable to subscribe right now.', 'error');
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <footer className="relative bg-[#070b14] text-slate-300 border-t border-slate-800/80 mt-16">
      
      {/* 1. TRUST VALUE PROPOSITIONS BAR */}
      <div className="border-b border-slate-800/70 bg-slate-900/30">
        <div className="max-w-7xl xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <Truck className="w-6 h-6 text-blue-400 shrink-0" />
              <div>
                <h5 className="text-xs font-bold text-white tracking-tight">{t('footer_trust_delivery_title', 'Express Delivery')}</h5>
                <p className="text-[11px] text-slate-400 mt-0.5">{t('footer_trust_delivery_desc', 'Phnom Penh & 25 Provinces')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-blue-400 shrink-0" />
              <div>
                <h5 className="text-xs font-bold text-white tracking-tight">{t('footer_trust_warranty_title', '1-Year Warranty')}</h5>
                <p className="text-[11px] text-slate-400 mt-0.5">{t('footer_trust_warranty_desc', '100% Genuine Guaranteed')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <RotateCcw className="w-6 h-6 text-blue-400 shrink-0" />
              <div>
                <h5 className="text-xs font-bold text-white tracking-tight">{t('footer_trust_returns_title', '30-Day Returns')}</h5>
                <p className="text-[11px] text-slate-400 mt-0.5">{t('footer_trust_returns_desc', 'Hassle-Free Exchange')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-blue-400 shrink-0" />
              <div>
                <h5 className="text-xs font-bold text-white tracking-tight">{t('footer_trust_payment_title', 'Bakong KHQR')}</h5>
                <p className="text-[11px] text-slate-400 mt-0.5">{t('footer_trust_payment_desc', 'Instant & Secure Payment')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. NEWSLETTER CARD CONTAINER */}
      <div className="max-w-7xl xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-12 pb-8">
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-blue-950/30 border border-slate-800 p-5 sm:p-8 lg:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 sm:gap-8 relative z-10">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400 mb-2">
                <Mail className="w-4 h-4 text-blue-400" />
                <span>{t('footer_newsletter_badge', 'Newsletter')}</span>
              </div>
              <h3 className="text-xl sm:text-3xl font-black text-white tracking-tight">
                {t('footer_newsletter_title', 'Subscribe to TechTonic Dispatch')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                {t('footer_newsletter_desc', 'Be the first to receive notifications on new audio gear, mechanical keyboard switches, and exclusive member discounts in Cambodia.')}
              </p>
            </div>

            <div className="w-full lg:w-auto">
              <form onSubmit={handleNewsletterSubmit} className="w-full lg:w-[440px] max-w-xl">
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('footer_email_placeholder', 'Enter your email address...')}
                      className="w-full bg-slate-950/80 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={subscribing}
                    className="shrink-0 px-6 py-3 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-blue-500/20 disabled:opacity-60"
                  >
                    <span>
                      {subscribing
                        ? language === 'km' ? 'កំពុងផ្ញើ...' : 'Subscribing...'
                        : isSubscribed
                        ? t('footer_subscribed', 'Subscribed!')
                        : t('footer_subscribe', 'Subscribe')}
                    </span>
                    {!isSubscribed && !subscribing && <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-2.5">
                  {t('footer_newsletter_no_spam', 'No spam. You can unsubscribe at any time with one click.')}
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MAIN NAVIGATION MATRIX */}
      <div className="max-w-7xl xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 sm:gap-10">
          
          {/* Col 1: Brand Info & Payment Rails (4 cols) */}
          <div className="sm:col-span-2 lg:col-span-4 space-y-5">
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
              {t('footer_slogan', "TechTonic Store is Cambodia's premier destination for studio-grade acoustics, ergonomic mechanical keyboards, AMOLED wearables, and high-velocity GaN power accessories.")}
            </p>

            {/* Accepted Payments */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
                {t('footer_gateways', 'Official Payment Gateways')}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold hover:border-slate-700 transition-colors">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Bakong KHQR
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold hover:border-slate-700 transition-colors">
                  {t('footer_cod', 'Cash on Delivery')}
                </span>
              </div>
            </div>
          </div>

          {/* Col 2: Categories (2 cols) */}
          <div className="sm:col-span-1 lg:col-span-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              {t('footer_col_categories', 'Categories')}
            </h4>
            <ul className="space-y-3 text-xs">
              <li>
                <Link to="/shop?category=audio" className="text-slate-400 hover:text-white flex items-center gap-2.5 transition-colors group">
                  <Headphones className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                  <span>{t('cat_audio', 'Audio & Acoustics')}</span>
                </Link>
              </li>
              <li>
                <Link to="/shop?category=wearables" className="text-slate-400 hover:text-white flex items-center gap-2.5 transition-colors group">
                  <Watch className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                  <span>{t('cat_wearables', 'Smart Wearables')}</span>
                </Link>
              </li>
              <li>
                <Link to="/shop?category=workspace" className="text-slate-400 hover:text-white flex items-center gap-2.5 transition-colors group">
                  <Keyboard className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                  <span>{t('footer_link_workspace_keyboards', 'Workspace Keyboards')}</span>
                </Link>
              </li>
              <li>
                <Link to="/shop?category=power" className="text-slate-400 hover:text-white flex items-center gap-2.5 transition-colors group">
                  <BatteryCharging className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                  <span>{t('footer_link_power_chargers', 'Power & Chargers')}</span>
                </Link>
              </li>
              <li className="pt-1 border-t border-slate-800/80">
                <Link to="/shop" className="text-blue-400 hover:text-blue-300 font-bold inline-flex items-center gap-1.5 transition-colors">
                  <span>{t('cat_all_hardware', 'Browse All Hardware')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Customer Care (2 cols) */}
          <div className="sm:col-span-1 lg:col-span-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              {t('footer_col_care', 'Customer Support')}
            </h4>
            <ul className="space-y-3 text-xs">
              <li>
                <Link to="/track" className="text-slate-400 hover:text-white flex items-center gap-2.5 transition-colors group">
                  <Package className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                  <span>{t('footer_track_order', 'Track My Order')}</span>
                </Link>
              </li>
              <li>
                <Link to="/account" className="text-slate-400 hover:text-white flex items-center gap-2.5 transition-colors group">
                  <User className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                  <span>{t('footer_profile', 'Member Account')}</span>
                </Link>
              </li>
              <li>
                <Link to="/cart" className="text-slate-400 hover:text-white flex items-center gap-2.5 transition-colors group">
                  <ShoppingBag className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                  <span>{t('footer_bag', 'Shopping Bag')}</span>
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-slate-400 hover:text-white flex items-center gap-2.5 transition-colors group">
                  <LogIn className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                  <span>{t('footer_link_signin_register', 'Sign In / Register')}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Store Location & Flagship (4 cols) */}
          <div className="sm:col-span-2 lg:col-span-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              {t('footer_col_flagship', 'Store Location & Contact')}
            </h4>
            
            <ul className="space-y-3 text-xs text-slate-400">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed text-slate-300">
                  {t('footer_address', 'Street 271, Sangkat Boeng Tumpun, Khan Mean Chey, Phnom Penh, Cambodia')}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-300">{t('footer_hours', 'Monday – Sunday: 8:00 AM – 9:00 PM')}</span>
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
                href="https://www.facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 text-slate-400 hover:text-blue-400 flex items-center justify-center transition-all hover:scale-105"
                title="Facebook"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://www.instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 text-slate-400 hover:text-blue-400 flex items-center justify-center transition-all hover:scale-105"
                title="Instagram"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://www.youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 text-slate-400 hover:text-blue-400 flex items-center justify-center transition-all hover:scale-105"
                title="YouTube"
                aria-label="YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

        </div>

        {/* 4. BOTTOM LEGAL & SECURITY BAR */}
        <div className="border-t border-slate-800/80 pt-6 mt-10 sm:mt-12 flex flex-col lg:flex-row items-center justify-between gap-4 text-xs text-slate-500 text-center">
          <p>{t('footer_copyright', '© 2026 TechTonic Store. All rights reserved.')}</p>
          
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>{t('footer_ssl', '256-Bit SSL Secure')}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>{t('perk_bakong', 'NBC Bakong Certified')}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>{t('footer_phnom_penh_flagship', 'Phnom Penh Flagship')}</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-slate-400">
            <Link to="/privacy" className="hover:text-white transition">{t('footer_privacy', 'Privacy Policy')}</Link>
            <Link to="/terms" className="hover:text-white transition">{t('footer_terms', 'Terms of Service')}</Link>
            <Link to="/warranty" className="hover:text-white transition">{t('footer_warranty', 'Warranty Policy')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;