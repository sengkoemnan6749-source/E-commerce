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
  Zap,
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
  ArrowRight
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
    <footer className="relative bg-[#090d16] text-slate-300 border-t border-slate-800 mt-0">
      
      {/* 1. NEWSLETTER & UPDATES SECTION */}
      <div className="border-b border-slate-800/80">
        <div className="max-w-7xl xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 lg:gap-10">
            
            {/* Left: Heading & Description */}
            <div className="max-w-xl">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {t('footer_cta_title_1', 'Stay connected with TechTonic')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                {t(
                  'footer_cta_desc',
                  'Subscribe to receive notifications for new hardware arrivals, official warranty updates, and exclusive customer offers across Cambodia.'
                )}
              </p>
            </div>

            {/* Right: Clean Standard Newsletter Form */}
            <div className="w-full lg:w-auto shrink-0">
              <form onSubmit={handleNewsletterSubmit} className="w-full sm:w-[420px]">
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('footer_email_placeholder', 'Enter your email address...')}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                    required
                  />
                  <button
                    type="submit"
                    className="shrink-0 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <span>{isSubscribed ? t('footer_subscribed', 'Subscribed!') : t('footer_subscribe', 'Subscribe')}</span>
                    {!isSubscribed && <ArrowRight className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  {t('footer_spam_note', 'No spam. You can unsubscribe at any time.')}
                </p>
              </form>
            </div>

          </div>
        </div>
      </div>

      {/* 2. MAIN STORE NAVIGATION */}
      <div className="max-w-7xl xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-10">
          
          {/* Col 1: Brand Info & Accepted Payments */}
          <div className="md:col-span-6 lg:col-span-4 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <div className="w-10 h-10 flex items-center justify-center shrink-0">
                <img
                  src="/images/logo/techtonic-crest.png"
                  alt="TechTonic Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <img
                src="/images/logo/techtonic-script-orange.png"
                alt="TechTonic"
                className="h-8 w-auto object-contain"
              />
            </Link>
            
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              {t(
                'footer_slogan',
                'Your trusted destination for premium audio hardware, mechanical keyboards, smart wearables, and fast-charging power solutions in Phnom Penh, Cambodia.'
              )}
            </p>

            {/* Accepted Payments */}
            <div className="pt-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
                {t('footer_gateways', 'Accepted Payment Methods')}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-[11px] font-medium">
                  Bakong KHQR
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-[11px] font-medium">
                  ABA Pay
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-[11px] font-medium">
                  Visa / Mastercard
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-[11px] font-medium">
                  Wing Bank
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-[11px] font-medium">
                  Cash on Delivery
                </span>
              </div>
            </div>
          </div>

          {/* Col 2: Categories */}
          <div className="md:col-span-3 lg:col-span-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              {t('footer_col_categories', 'Categories')}
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/shop?category=audio" className="text-slate-400 hover:text-white transition-colors">
                  {t('cat_audio', 'Audio & Acoustics')}
                </Link>
              </li>
              <li>
                <Link to="/shop?category=wearables" className="text-slate-400 hover:text-white transition-colors">
                  {t('cat_wearables', 'Smart Wearables')}
                </Link>
              </li>
              <li>
                <Link to="/shop?category=workspace" className="text-slate-400 hover:text-white transition-colors">
                  {t('cat_workspace', 'Workspace Peripherals')}
                </Link>
              </li>
              <li>
                <Link to="/shop?category=power" className="text-slate-400 hover:text-white transition-colors">
                  {t('cat_power', 'Power & Mobile')}
                </Link>
              </li>
              <li className="pt-1">
                <Link to="/shop" className="text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1 transition-colors">
                  <span>{t('cat_all_hardware', 'Browse All Products')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Customer Support */}
          <div className="md:col-span-3 lg:col-span-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              {t('footer_col_care', 'Customer Support')}
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/account/orders" className="text-slate-400 hover:text-white transition-colors">
                  {t('footer_track_order', 'Track My Order')}
                </Link>
              </li>
              <li>
                <Link to="/account" className="text-slate-400 hover:text-white transition-colors">
                  {t('footer_profile', 'My Account')}
                </Link>
              </li>
              <li>
                <Link to="/cart" className="text-slate-400 hover:text-white transition-colors">
                  {t('footer_bag', 'Shopping Cart')}
                </Link>
              </li>
              <li>
                <Link to="/TechTonicAdmin" className="text-slate-400 hover:text-white transition-colors">
                  TechTonicAdmin Console
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-slate-400 hover:text-white transition-colors">
                  {t('footer_signin', 'Sign In / Register')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Store Location & Contact */}
          <div className="md:col-span-6 lg:col-span-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              {t('footer_col_flagship', 'Store Location & Contact')}
            </h4>
            
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed text-slate-300">{t('footer_address', 'Street 271, Boeng Tumpun, Phnom Penh, Cambodia')}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-300">{t('footer_hours', 'Monday – Sunday: 8:00 AM – 9:00 PM')}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Send className="w-4 h-4 text-slate-400 shrink-0" />
                <a href="https://t.me/techtonic_kh" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                  Telegram: @techtonic_kh
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <a href="tel:+855023999888" className="hover:text-white transition text-slate-300">
                  (+855) 023 999 888
                </a>
              </li>
            </ul>

            {/* Social Channels */}
            <div className="flex items-center gap-2 pt-4">
              <a
                href="https://t.me/techtonic_kh"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                title="Telegram"
              >
                <Send className="w-3.5 h-3.5" />
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                title="Facebook"
              >
                <Facebook className="w-3.5 h-3.5" />
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                title="Instagram"
              >
                <Instagram className="w-3.5 h-3.5" />
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                title="YouTube"
              >
                <Youtube className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

        </div>

        {/* 3. BOTTOM LEGAL & SECURITY BAR */}
        <div className="border-t border-slate-800/80 pt-6 mt-10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 TechTonic Store. {t('footer_rights', 'All rights reserved.')}</p>
          
          <div className="flex items-center gap-5 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>256-Bit SSL Secure</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
              <span>NBC Bakong Certified</span>
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>Phnom Penh Flagship</span>
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span className="hover:text-white cursor-pointer transition">{t('footer_privacy', 'Privacy Policy')}</span>
            <span className="hover:text-white cursor-pointer transition">{t('footer_terms', 'Terms of Service')}</span>
            <span className="hover:text-white cursor-pointer transition">{t('footer_warranty', 'Warranty Policy')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;