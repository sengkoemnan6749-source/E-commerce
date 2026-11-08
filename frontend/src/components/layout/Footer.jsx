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
    <footer className="relative bg-[#020516] text-slate-300 border-t border-slate-800/80 mt-0 overflow-hidden">
      
      {/* Top Ambient Neon Accent Line (Matching Hero Banner) */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#00D9FF]/70 to-transparent shadow-[0_0_20px_rgba(0,217,255,0.6)] z-20" />

      {/* Subtle Background Geometric Circuit Grid */}
      <div 
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #00D9FF 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}
      />

      {/* Deep Ambient Cosmic Glows */}
      <div className="absolute -top-24 left-1/4 w-[500px] h-[300px] bg-gradient-to-br from-blue-700/15 via-indigo-600/10 to-transparent rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-gradient-to-bl from-cyan-500/15 via-blue-600/10 to-transparent rounded-full blur-[130px] pointer-events-none" />

      {/* 1. HERO DISPATCH & COMMUNITY SECTION */}
      <div className="border-b border-slate-800/70 relative z-10">
        <div className="max-w-7xl xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-9 sm:py-11">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 lg:gap-10">
            
            {/* Left: Dispatch Headline & Tagline */}
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-950/80 via-indigo-950/70 to-purple-950/60 border border-sky-400/40 text-sky-300 text-xs font-semibold shadow-[0_0_15px_rgba(0,217,255,0.2)] mb-3">
                <Zap className="w-3.5 h-3.5 text-[#00D9FF] fill-[#00D9FF]" />
                <span className="font-mono uppercase tracking-wider text-[11px]">
                  TechTonic Dispatch // Cambodia Hardware Lab
                </span>
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
                {t('footer_cta_title_1', 'Next-Gen Hardware Dispatch.')}{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00D9FF] via-[#00b4d8] to-[#8B5CF6] drop-shadow-[0_0_20px_rgba(0,217,255,0.3)]">
                  {t('footer_cta_title_2', 'Stay Ahead of the Curve.')}
                </span>
              </h2>

              <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                {t(
                  'footer_cta_desc',
                  'Get exclusive release announcements for aerospace titanium wearables, reference beryllium acoustics, and flash member drops across Cambodia.'
                )}
              </p>
            </div>

            {/* Right: Illuminated Pill Dispatch Input (Hero Style) */}
            <div className="w-full lg:w-auto shrink-0">
              <form onSubmit={handleNewsletterSubmit} className="relative w-full sm:w-[460px] lg:w-[480px]">
                <div className="relative flex items-center p-1.5 sm:p-2 rounded-full bg-[#050b1d]/90 border border-sky-400/40 focus-within:border-[#00D9FF] focus-within:shadow-[0_0_25px_rgba(0,217,255,0.35)] shadow-[0_4px_25px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all duration-300">
                  <div className="pl-3.5 pr-2.5 text-sky-400 shrink-0">
                    <Send className="w-4 h-4 text-[#00D9FF]" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('footer_email_placeholder', 'Enter developer or creator email...')}
                    className="w-full bg-transparent text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none py-1.5 pr-2 min-w-0"
                    required
                  />
                  <button
                    type="submit"
                    className="shrink-0 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-xs font-bold text-white bg-gradient-to-r from-[#00D9FF] via-[#00b4d8] to-[#1769FF] hover:from-[#00e1ff] hover:to-[#1e7bff] shadow-[0_0_18px_rgba(0,217,255,0.35)] hover:shadow-[0_0_25px_rgba(0,217,255,0.5)] transition-all transform hover:scale-[1.02] active:scale-95 whitespace-nowrap flex items-center gap-1.5"
                  >
                    <span>{isSubscribed ? t('footer_subscribed', 'Subscribed!') : t('footer_subscribe', 'Join Network')}</span>
                    {!isSubscribed && <ArrowRight className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="flex items-center gap-3 px-3 pt-2 text-[10px] text-slate-500 font-mono">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-[#00D9FF]" /> Zero spam
                  </span>
                  <span>•</span>
                  <span>Instant unsub anytime</span>
                  <span>•</span>
                  <span className="text-[#00D9FF] font-semibold">12,500+ Engineers</span>
                </div>
              </form>
            </div>

          </div>
        </div>
      </div>

      {/* 2. MAIN NAVIGATION MATRIX */}
      <div className="max-w-7xl xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-10">
          
          {/* Col 1: Brand Identity & Certified Payment Rails (md: 6 cols, lg: 4 cols) */}
          <div className="md:col-span-6 lg:col-span-4 space-y-4">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="w-12 h-12 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
                <img
                  src="/images/logo/techtonic-crest.png"
                  alt="TechTonic Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <img
                    src="/images/logo/techtonic-script-orange.png"
                    alt="TechTonic"
                    className="h-9 w-auto object-contain group-hover:scale-105 transition-transform duration-200"
                  />
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-lime-400/15 text-lime-400 border border-lime-400/35 font-mono shadow-[0_0_8px_rgba(198,255,0,0.2)]">
                    STORE
                  </span>
                </div>
                <span className="text-[9px] font-mono text-[#00D9FF] tracking-widest uppercase font-bold">
                  Cambodia Hardware Testing Lab
                </span>
              </div>
            </Link>
            
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              {t(
                'footer_slogan',
                'Engineered for the Modern Digital Lifestyle. Authentic audio monitors, precision mechanical workspaces, and GaN charging for Cambodian creators and developers.'
              )}
            </p>

            {/* Verified Cambodia Payment Rails */}
            <div className="pt-2">
              <div className="flex items-center gap-1.5 mb-2.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#00D9FF]" />
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  {t('footer_gateways', 'Verified Payment Gateways')}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {/* Bakong KHQR */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/30 border border-rose-500/40 text-rose-300 text-[11px] font-bold shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                  <span>Bakong KHQR</span>
                </div>
                {/* ABA Pay */}
                <div className="px-2.5 py-1 rounded-lg bg-sky-950/30 border border-sky-500/40 text-sky-300 text-[11px] font-bold shadow-xs">
                  ABA Pay
                </div>
                {/* Visa / Mastercard */}
                <div className="px-2.5 py-1 rounded-lg bg-slate-900/60 border border-slate-700/80 text-slate-200 text-[11px] font-bold shadow-xs">
                  Visa / MC
                </div>
                {/* Wing Bank */}
                <div className="px-2.5 py-1 rounded-lg bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold shadow-xs">
                  Wing Bank
                </div>
                {/* COD Express */}
                <div className="px-2.5 py-1 rounded-lg bg-amber-950/30 border border-amber-500/40 text-amber-300 text-[11px] font-bold shadow-xs">
                  COD Express
                </div>
              </div>
            </div>
          </div>

          {/* Col 2: Hardware Ecosystem (md: 3 cols, lg: 2 cols) */}
          <div className="md:col-span-3 lg:col-span-2">
            <div className="flex items-center gap-1.5 mb-3">
              <span className="text-[10px] font-mono text-[#00D9FF] font-bold">//</span>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                {t('footer_col_categories', 'Hardware Categories')}
              </h4>
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/shop?category=audio" className="text-slate-400 hover:text-[#00D9FF] flex items-center justify-between group py-0.5 transition-colors">
                  <div className="flex items-center gap-2">
                    <Headphones className="w-3.5 h-3.5 text-blue-400 group-hover:text-[#00D9FF] transition-colors" />
                    <span className="group-hover:translate-x-1 transition-transform">{t('cat_audio', 'Audio & Acoustics')}</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 group-hover:text-blue-400 transition-colors">Lossless</span>
                </Link>
              </li>
              <li>
                <Link to="/shop?category=wearables" className="text-slate-400 hover:text-[#00D9FF] flex items-center justify-between group py-0.5 transition-colors">
                  <div className="flex items-center gap-2">
                    <Watch className="w-3.5 h-3.5 text-cyan-400 group-hover:text-[#00D9FF] transition-colors" />
                    <span className="group-hover:translate-x-1 transition-transform">{t('cat_wearables', 'Smart Wearables')}</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 group-hover:text-cyan-400 transition-colors">Titanium</span>
                </Link>
              </li>
              <li>
                <Link to="/shop?category=workspace" className="text-slate-400 hover:text-[#00D9FF] flex items-center justify-between group py-0.5 transition-colors">
                  <div className="flex items-center gap-2">
                    <Keyboard className="w-3.5 h-3.5 text-purple-400 group-hover:text-[#00D9FF] transition-colors" />
                    <span className="group-hover:translate-x-1 transition-transform">{t('cat_workspace', 'Workspace Peripherals')}</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 group-hover:text-purple-400 transition-colors">Mechanical</span>
                </Link>
              </li>
              <li>
                <Link to="/shop?category=power" className="text-slate-400 hover:text-[#00D9FF] flex items-center justify-between group py-0.5 transition-colors">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-amber-400 group-hover:text-[#00D9FF] transition-colors" />
                    <span className="group-hover:translate-x-1 transition-transform">{t('cat_power', 'Power & Mobile')}</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 group-hover:text-amber-400 transition-colors">100W GaN</span>
                </Link>
              </li>
              <li className="pt-2 border-t border-slate-800/80">
                <Link to="/shop" className="text-xs font-bold text-[#00D9FF] hover:text-sky-300 transition-colors inline-flex items-center gap-1.5 group">
                  <span>{t('cat_all_hardware', 'View All Hardware')}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Customer Care & Portal (md: 3 cols, lg: 2 cols) */}
          <div className="md:col-span-3 lg:col-span-2">
            <div className="flex items-center gap-1.5 mb-3">
              <span className="text-[10px] font-mono text-[#00D9FF] font-bold">//</span>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                {t('footer_col_care', 'Customer Care')}
              </h4>
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/account/orders" className="text-slate-400 hover:text-white flex items-center gap-2 transition group py-0.5">
                  <Package className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                  <span className="group-hover:translate-x-1 transition-transform">{t('footer_track_order', 'Track My Order')}</span>
                </Link>
              </li>
              <li>
                <Link to="/account" className="text-slate-400 hover:text-white flex items-center gap-2 transition group py-0.5">
                  <User className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                  <span className="group-hover:translate-x-1 transition-transform">{t('footer_profile', 'Member Profile')}</span>
                </Link>
              </li>
              <li>
                <Link to="/cart" className="text-slate-400 hover:text-white flex items-center gap-2 transition group py-0.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400 transition-colors" />
                  <span className="group-hover:translate-x-1 transition-transform">{t('footer_bag', 'Shopping Bag')}</span>
                </Link>
              </li>
              <li>
                <Link to="/TechTonicAdmin" className="text-slate-400 hover:text-white flex items-center gap-2 transition group py-0.5" title="Direct URL for TechTonicAdmin">
                  <LayoutDashboard className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
                  <span className="group-hover:translate-x-1 transition-transform">TechTonicAdmin Console</span>
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-slate-400 hover:text-white flex items-center gap-2 transition group py-0.5">
                  <LogIn className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#00D9FF] transition-colors" />
                  <span className="group-hover:translate-x-1 transition-transform">{t('footer_signin', 'Customer Sign In')}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Flagship Lab & Community (md: 6 cols, lg: 4 cols) */}
          <div className="md:col-span-6 lg:col-span-4">
            <div className="flex items-center gap-1.5 mb-3">
              <span className="text-[10px] font-mono text-[#00D9FF] font-bold">//</span>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>{t('footer_col_flagship', 'Phnom Penh Flagship')}</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-mono">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                  </span>
                  OPEN
                </span>
              </h4>
            </div>
            
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#00D9FF] shrink-0 mt-0.5" />
                <span className="leading-snug text-slate-300 text-[11px]">{t('footer_address', 'Street 271, Boeng Tumpun, Phnom Penh')}</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="text-slate-400 text-[11px]">{t('footer_hours', 'Mon – Sun: 8:00 AM – 9:00 PM')}</span>
              </li>
              <li className="flex items-center gap-2">
                <Send className="w-3.5 h-3.5 text-[#00D9FF] shrink-0" />
                <a href="https://t.me/techtonic_kh" target="_blank" rel="noopener noreferrer" className="text-[#00D9FF] hover:text-sky-300 font-semibold transition text-[11px]">
                  Telegram: @techtonic_kh
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <a href="tel:+855023999888" className="hover:text-white transition text-slate-300 text-[11px]">
                  (+855) 023 999 888
                </a>
              </li>
            </ul>

            {/* Glowing Glass Social Channels */}
            <div className="flex items-center gap-2 pt-3">
              <a
                href="https://t.me/techtonic_kh"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-[#050b1d] border border-sky-500/30 hover:border-sky-400 hover:text-[#00D9FF] hover:shadow-[0_0_12px_rgba(0,217,255,0.3)] text-slate-400 flex items-center justify-center transition-all hover:scale-105"
                title="Telegram"
              >
                <Send className="w-3.5 h-3.5" />
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-lg bg-[#050b1d] border border-sky-500/30 hover:border-blue-400 hover:text-blue-400 hover:shadow-[0_0_12px_rgba(59,130,246,0.3)] text-slate-400 flex items-center justify-center transition-all hover:scale-105"
                title="Facebook"
              >
                <Facebook className="w-3.5 h-3.5" />
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-lg bg-[#050b1d] border border-sky-500/30 hover:border-pink-400 hover:text-pink-400 hover:shadow-[0_0_12px_rgba(244,114,182,0.3)] text-slate-400 flex items-center justify-center transition-all hover:scale-105"
                title="Instagram"
              >
                <Instagram className="w-3.5 h-3.5" />
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-lg bg-[#050b1d] border border-sky-500/30 hover:border-red-400 hover:text-red-400 hover:shadow-[0_0_12px_rgba(239,68,68,0.3)] text-slate-400 flex items-center justify-center transition-all hover:scale-105"
                title="YouTube"
              >
                <Youtube className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

        </div>

        {/* 3. REFINED BOTTOM LEGAL & SECURITY BAR */}
        <div className="border-t border-slate-800/80 pt-6 mt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 TechTonic Store. {t('footer_rights', 'All rights reserved.')}</p>
          
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-[#00D9FF]" />
              <span>256-Bit SSL</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-[#00D9FF]" />
              <span>NBC Bakong Certified</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-xs">🇰🇭</span>
              <span className="text-[#00D9FF] font-mono font-bold">Cambodia Flagship</span>
            </span>
          </div>

          <div className="flex items-center gap-5 text-[11px] text-slate-400">
            <span className="hover:text-[#00D9FF] cursor-pointer transition">{t('footer_privacy', 'Privacy Policy')}</span>
            <span className="hover:text-[#00D9FF] cursor-pointer transition">{t('footer_terms', 'Terms of Service')}</span>
            <span className="hover:text-[#00D9FF] cursor-pointer transition">{t('footer_warranty', 'Warranty Policy')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
