import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  Watch,
  Keyboard,
  BatteryCharging,
  Zap,
  Star,
  CheckCircle,
  Sparkles,
  Droplets,
  QrCode,
  Award,
  Play,
  X,
  Cpu,
  Rocket,
  Clock,
  Laptop,
  ShoppingBag,
  Users,
  Phone,
  PhoneOff,
  Heart
} from 'lucide-react';
import ProductCard from '../../components/product/ProductCard';
import Button from '../../components/common/Button';
import { productService } from '../../services/productService';
import { useLanguage } from '../../store/StoreContext';
import { translateCategory } from '../../utils/translations';
import BrandMarquee from '../../components/home/BrandMarquee';

export default function Home() {
  const { t, language } = useLanguage();
  const allProducts = productService.getProducts();
  const categories = productService.getCategories();

  const featuredProducts = allProducts.filter((p) => p.isFeatured).slice(0, 4);
  const bestSellers = allProducts.filter((p) => p.rating >= 4.8).slice(0, 4);

  // Interactive Smartwatch Incoming Call Simulation State
  const [callActive, setCallActive] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);

  React.useEffect(() => {
    let interval;
    if (callActive) {
      interval = setInterval(() => {
        setCallSeconds((s) => s + 1);
      }, 1000);
    } else {
      setCallSeconds(0);
    }
    return () => clearInterval(interval);
  }, [callActive]);

  const formatCallTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const categoryMeta = {
    audio: {
      icon: Headphones,
      badge: t('cat_badge_audio', 'Beryllium Acoustics'),
      image: '/images/products/prod-001-main.png',
      tagColor: 'text-blue-600 bg-blue-50 border-blue-200/80',
      gradient: 'from-blue-600/10 via-cyan-500/5 to-transparent'
    },
    wearables: {
      icon: Watch,
      badge: t('cat_badge_wearables', 'AMOLED & Biosensors'),
      image: '/images/products/prod-004-silver.png',
      tagColor: 'text-cyan-600 bg-cyan-50 border-cyan-200/80',
      gradient: 'from-cyan-500/10 via-blue-500/5 to-transparent'
    },
    workspace: {
      icon: Keyboard,
      badge: t('cat_badge_workspace', 'CNC & Mechanical'),
      image: '/images/products/prod-006-main.png',
      tagColor: 'text-indigo-600 bg-indigo-50 border-indigo-200/80',
      gradient: 'from-indigo-600/10 via-purple-500/5 to-transparent'
    },
    power: {
      icon: BatteryCharging,
      badge: t('cat_badge_power', '100W GaN III Fast'),
      image: '/images/products/prod-009-charger.png',
      tagColor: 'text-amber-600 bg-amber-50 border-amber-200/80',
      gradient: 'from-amber-500/10 via-orange-500/5 to-transparent'
    }
  };

  const getCatMeta = (cat) => {
    return categoryMeta[cat.slug] || categoryMeta[cat.id] || {
      icon: Headphones,
      badge: t('cat_section_tag', 'Curated Hardware'),
      image: cat.image || '/images/products/prod-001-main.png',
      tagColor: 'text-blue-600 bg-blue-50 border-blue-200/80',
      gradient: 'from-blue-600/10 to-transparent'
    };
  };

  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  return (
    <div className="flex flex-col pb-20">
      {/* TOP FOLD SHOWCASE (Hero Banner + Categories) matching reference mockup */}
      <div className="flex flex-col w-full">
        {/* 1. HERO SECTION (Polished Cinematic Futuristic Theme) */}
        <section className="relative w-full overflow-hidden bg-[#020516] border-b border-slate-800/80">
          {/* Subtle Ambient Cosmic Glows (Non-intrusive) */}
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-blue-700/10 via-indigo-600/5 to-transparent rounded-full blur-[140px] pointer-events-none" />

          {/* Clean constellation network on bottom-left */}
          <div className="hidden lg:block absolute left-0 bottom-0 w-80 h-72 pointer-events-none opacity-30 z-0">
            <svg viewBox="0 0 320 280" className="w-full h-full">
              <line x1="20" y1="260" x2="80" y2="210" stroke="#00D9FF" strokeWidth="0.75" />
              <line x1="80" y1="210" x2="160" y2="240" stroke="#00D9FF" strokeWidth="0.75" />
              <line x1="160" y1="240" x2="220" y2="180" stroke="#00D9FF" strokeWidth="0.75" />
              <line x1="80" y1="210" x2="120" y2="140" stroke="#818cf8" strokeWidth="0.75" />
              <line x1="120" y1="140" x2="200" y2="120" stroke="#818cf8" strokeWidth="0.75" />
              <line x1="200" y1="120" x2="220" y2="180" stroke="#00D9FF" strokeWidth="0.75" />
              <line x1="20" y1="180" x2="80" y2="210" stroke="#00D9FF" strokeWidth="0.75" />
              <circle cx="20" cy="260" r="2.5" fill="#00D9FF" />
              <circle cx="80" cy="210" r="3" fill="#00D9FF" />
              <circle cx="160" cy="240" r="2" fill="#818cf8" />
              <circle cx="220" cy="180" r="2.5" fill="#00D9FF" />
              <circle cx="120" cy="140" r="3" fill="#a855f7" />
              <circle cx="200" cy="120" r="2" fill="#00D9FF" />
              <circle cx="20" cy="180" r="2" fill="#818cf8" />
            </svg>
          </div>

          {/* DESKTOP (>= 1024px) - Balanced Two-Column Cinematic Layout */}
          <div className="hidden lg:block relative w-full max-w-7xl xl:max-w-[1400px] mx-auto px-6 lg:px-8 py-12 xl:py-16">
            <div className="grid grid-cols-12 gap-8 xl:gap-12 items-center">
              
              {/* Left Column: Typography, CTAs & Statistics */}
              <div className="col-span-12 lg:col-span-6 xl:col-span-6 z-20 flex flex-col items-start text-left relative">
                {/* Floating 3D Geometric Crystal Accent (Matching Mockup) */}
                <div className="hidden xl:block absolute -right-6 top-8 w-28 h-28 pointer-events-none opacity-80 z-0 animate-float-slow">
                  <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-[0_0_20px_rgba(168,85,247,0.35)]">
                    <defs>
                      <linearGradient id="crystalFacet1" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#818cf8" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#3730a3" stopOpacity="0.6" />
                      </linearGradient>
                      <linearGradient id="crystalFacet2" x1="1" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#c084fc" stopOpacity="0.85" />
                        <stop offset="100%" stopColor="#581c87" stopOpacity="0.6" />
                      </linearGradient>
                      <linearGradient id="crystalFacet3" x1="0" y1="1" x2="1" y2="0">
                        <stop offset="0%" stopColor="#00D9FF" stopOpacity="0.75" />
                        <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.5" />
                      </linearGradient>
                      <linearGradient id="crystalFacet4" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f472b6" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#831843" stopOpacity="0.4" />
                      </linearGradient>
                    </defs>
                    <polygon points="60,10 105,35 105,85 60,110 15,85 15,35" fill="none" stroke="#818cf8" strokeWidth="1" opacity="0.6" />
                    <polygon points="60,10 105,35 60,60" fill="url(#crystalFacet1)" stroke="#a5b4fc" strokeWidth="0.75" />
                    <polygon points="105,35 105,85 60,60" fill="url(#crystalFacet2)" stroke="#d8b4fe" strokeWidth="0.75" />
                    <polygon points="105,85 60,110 60,60" fill="url(#crystalFacet3)" stroke="#7dd3fc" strokeWidth="0.75" />
                    <polygon points="60,110 15,85 60,60" fill="url(#crystalFacet1)" stroke="#a5b4fc" strokeWidth="0.75" />
                    <polygon points="15,85 15,35 60,60" fill="url(#crystalFacet4)" stroke="#f472b6" strokeWidth="0.75" />
                    <polygon points="15,35 60,10 60,60" fill="url(#crystalFacet2)" stroke="#c084fc" strokeWidth="0.75" />
                    <polygon points="60,30 85,75 35,75" fill="none" stroke="#00D9FF" strokeWidth="0.75" opacity="0.8" />
                    <circle cx="60" cy="10" r="2.5" fill="#00D9FF" />
                    <circle cx="105" cy="35" r="2" fill="#c084fc" />
                    <circle cx="105" cy="85" r="2" fill="#818cf8" />
                    <circle cx="60" cy="110" r="2.5" fill="#00D9FF" />
                    <circle cx="15" cy="85" r="2" fill="#c084fc" />
                    <circle cx="15" cy="35" r="2" fill="#818cf8" />
                    <circle cx="60" cy="60" r="3" fill="#ffffff" />
                  </svg>
                </div>

                {/* Cyber Data Metric Accent (113, grid) */}
                <div className="hidden xl:flex flex-col items-end absolute -right-2 top-36 pointer-events-none opacity-70 font-mono text-[10px] text-sky-400 select-none">
                  <span className="font-bold tracking-widest text-[#00D9FF]">113</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-2xs bg-[#00D9FF]/80" />
                    <span className="w-5 h-0.5 bg-[#00D9FF]/60" />
                    <span className="w-1.5 h-1.5 rounded-2xs bg-[#00D9FF]/80" />
                  </div>
                </div>



                {/* Headline */}
                <h1 className="text-3xl sm:text-5xl lg:text-[3.25rem] xl:text-[3.65rem] font-black tracking-tight leading-[1.12] sm:leading-[1.08] mb-4 sm:mb-5 text-white drop-shadow-md relative z-10">
                  {t('hero_title_1', 'Next-Gen Electronics.')} <br />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00D9FF] via-[#1769FF] to-[#8B5CF6] drop-shadow-[0_0_30px_rgba(0,217,255,0.4)]">
                    {t('hero_title_2', 'Engineered for the Elements.')}
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="text-xs sm:text-sm xl:text-base text-slate-300/85 leading-relaxed max-w-lg mb-6 sm:mb-7 font-normal">
                  {t(
                    'hero_desc',
                    'Designed for software developers, athletes, and digital creators. Discover aerospace titanium unibody wearables, reference beryllium acoustics, and high-velocity GaN power.'
                  )}
                </p>

                {/* Buttons */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                  <Link
                    to="/shop"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 sm:px-7 sm:py-3.5 rounded-full font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-[#00D9FF] via-[#00b4d8] to-[#1769FF] hover:from-[#00e1ff] hover:to-[#1e7bff] shadow-[0_0_25px_rgba(0,217,255,0.4)] hover:shadow-[0_0_35px_rgba(0,217,255,0.6)] transition-all transform hover:-translate-y-0.5 active:scale-95"
                  >
                    <span>{t('hero_explore', 'Explore Products')}</span>
                    <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </Link>

                  <Link
                    to="/product/prod-012"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 sm:px-6 sm:py-3.5 rounded-full font-semibold text-xs sm:text-sm text-slate-200 bg-[#0c1527]/90 hover:bg-[#13203c] border border-sky-500/40 hover:border-sky-400 shadow-[0_0_15px_rgba(0,217,255,0.15)] backdrop-blur-md transition-all transform hover:-translate-y-0.5 active:scale-95 group"
                  >
                    <span>TechTonic Pulse Ultra</span>
                    <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#00D9FF] group-hover:scale-110 transition-transform" />
                  </Link>
                </div>

                {/* Trust stats row with subtle vertical dividers */}
                <div className="hidden sm:flex items-center gap-4 xl:gap-6 pt-5 border-t border-slate-800/80 w-full">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#00D9FF]/10 border border-[#00D9FF]/40 flex items-center justify-center text-[#00D9FF] shadow-[0_0_12px_rgba(0,217,255,0.25)] shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white tracking-tight">12,500+</div>
                      <div className="text-[11px] text-slate-400 font-medium whitespace-nowrap">{t('hero_stat_users', 'Active Tech Users')}</div>
                    </div>
                  </div>

                  <div className="h-7 w-[1px] bg-slate-800 shrink-0" />

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#00D9FF]/10 border border-[#00D9FF]/40 flex items-center justify-center text-[#00D9FF] shadow-[0_0_12px_rgba(0,217,255,0.25)] shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white tracking-tight">100%</div>
                      <div className="text-[11px] text-slate-400 font-medium whitespace-nowrap">{t('hero_stat_genuine', 'Genuine Guaranteed')}</div>
                    </div>
                  </div>

                  <div className="h-7 w-[1px] bg-slate-800 shrink-0" />

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#00D9FF]/10 border border-[#00D9FF]/40 flex items-center justify-center text-[#00D9FF] shadow-[0_0_12px_rgba(0,217,255,0.25)] shrink-0">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white tracking-tight">3-Hour</div>
                      <div className="text-[11px] text-slate-400 font-medium whitespace-nowrap">{t('hero_stat_delivery', 'Express Delivery')}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Seamless Smartwatch Vortex Showcase + Refined Floating Cards */}
              <div className="col-span-12 lg:col-span-6 xl:col-span-6 z-10 relative flex items-center justify-center">
                <div className="relative w-full max-w-[340px] sm:max-w-md lg:max-w-xl 2xl:max-w-2xl select-none mx-auto mt-2 lg:mt-0">
                  
                  {/* Clean Smartwatch & Water Splash with Animations strictly on the Watches */}
                  <div
                    className="relative select-none overflow-hidden rounded-full"
                    style={{
                      WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 66%, rgba(0,0,0,0.8) 82%, transparent 96%)',
                      maskImage: 'radial-gradient(circle at 50% 50%, black 66%, rgba(0,0,0,0.8) 82%, transparent 96%)',
                    }}
                  >
                    <img
                      src="/images/mockup_assets/smartwatch_clean_water.jpg"
                      alt="TechTonic Pulse Ultra Dual Smartwatch Showcase"
                      className="w-full h-auto object-contain select-none drop-shadow-[0_20px_50px_rgba(0,217,255,0.3)]"
                    />

                    {/* --- ADVANCED ANIMATIONS ON WATCHES --- */}

                    {/* Precision Automatic Chronometer Second Hand (Runs around 360° smoothly) */}
                    <div className="absolute left-[29.3%] top-[45.8%] -translate-x-1/2 -translate-y-1/2 w-[8.6%] h-[8.6%] pointer-events-none select-none z-10">
                      {/* 360-Degree Continuous Rotating Hand */}
                      <div
                        className="w-full h-full relative"
                        style={{
                          animation: 'spin 12s linear infinite',
                          transformOrigin: '50% 50%'
                        }}
                      >
                        {/* Red Second Hand with Luminous Tip pointing up */}
                        <div className="absolute top-[4%] left-1/2 -translate-x-1/2 w-[1.5px] h-[46%] bg-gradient-to-t from-rose-600 via-rose-500 to-white rounded-full shadow-[0_0_6px_rgba(244,63,94,0.95)]" />
                        
                        {/* Counterweight Tail */}
                        <div className="absolute top-[50%] left-1/2 -translate-x-1/2 w-[1.5px] h-[16%] bg-rose-700">
                          <div className="w-1.5 h-1.5 rounded-full border border-rose-500 bg-black/80 -translate-x-[2.25px] translate-y-0.5" />
                        </div>
                      </div>

                      {/* Center Ruby & Titanium Cap */}
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gradient-to-tr from-slate-200 to-white shadow-sm flex items-center justify-center border border-slate-700 pointer-events-none">
                        <div className="w-1 h-1 rounded-full bg-rose-600 shadow-[0_0_4px_#e11d48]" />
                      </div>
                    </div>

                    {/* Interactive Incoming Call or Connected Call Simulation */}
                    {!callActive ? (
                      <>
                        {/* Green Button Incoming Call Ripple */}
                        <div className="absolute left-[69.4%] top-[52.8%] -translate-x-1/2 -translate-y-1/2 w-[7%] h-[7%] rounded-full bg-emerald-400/35 animate-ping pointer-events-none" />
                        <div className="absolute left-[69.4%] top-[52.8%] -translate-x-1/2 -translate-y-1/2 w-[5.6%] h-[5.6%] rounded-full ring-2 ring-emerald-400/90 shadow-[0_0_15px_#10b981] animate-pulse pointer-events-none" />
                        
                        {/* Interactive Clickable Answer Button with Ringing Vibration */}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setCallActive(true); }}
                          className="absolute left-[69.4%] top-[52.8%] -translate-x-1/2 -translate-y-1/2 w-[5.8%] h-[5.8%] rounded-full bg-emerald-500 hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.9)] flex items-center justify-center text-white transition-all transform hover:scale-110 active:scale-95 z-20 group cursor-pointer"
                          title="Tap to answer incoming call"
                        >
                          <Phone className="w-[50%] h-[50%] animate-ringing" />
                        </button>

                        {/* Caller Avatar Pulse Aura */}
                        <div className="absolute left-[71.8%] top-[38.6%] -translate-x-1/2 -translate-y-1/2 w-[9%] h-[9%] rounded-full ring-1 ring-emerald-400/50 animate-pulse pointer-events-none" />

                        {/* Calling Soundwave Telemetry */}
                        <div className="absolute left-[71.8%] top-[46.2%] -translate-x-1/2 -translate-y-1/2 flex items-center gap-[2px] pointer-events-none opacity-85">
                          <span className="w-[1.5px] h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                          <span className="w-[1.5px] h-3 bg-emerald-400 rounded-full animate-pulse [animation-delay:150ms]" />
                          <span className="w-[1.5px] h-2 bg-emerald-400 rounded-full animate-pulse [animation-delay:300ms]" />
                        </div>
                      </>
                    ) : (
                      /* Active Connected Call Screen Overlay */
                      <div className="absolute left-[63%] top-[31%] w-[22%] h-[32%] rounded-2xl bg-[#030a1c]/95 backdrop-blur-md border border-emerald-500/50 p-2 flex flex-col items-center justify-between text-white z-20 shadow-[0_0_25px_rgba(16,185,129,0.4)] animate-fadeIn">
                        <div className="flex items-center gap-1.5 text-[8.5px] text-emerald-400 font-mono font-bold tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>CONNECTED</span>
                        </div>
                        
                        <div className="text-center py-0.5">
                          <div className="text-[10px] font-bold text-slate-100">TechTonic Lab</div>
                          <div className="text-[11px] font-mono text-emerald-300 font-bold tracking-widest mt-0.5">
                            {formatCallTime(callSeconds)}
                          </div>
                        </div>

                        {/* Equalizer Wave */}
                        <div className="flex items-center gap-1 h-3.5">
                          <span className="w-1 bg-emerald-400 rounded-full animate-bar-1" />
                          <span className="w-1 bg-emerald-400 rounded-full animate-bar-2" />
                          <span className="w-1 bg-emerald-400 rounded-full animate-bar-3" />
                          <span className="w-1 bg-emerald-400 rounded-full animate-bar-1" />
                        </div>

                        {/* End Call Button */}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setCallActive(false); }}
                          className="w-5 h-5 rounded-full bg-rose-600 hover:bg-rose-500 flex items-center justify-center text-white shadow-md active:scale-90 transition-transform mt-0.5"
                          title="End Call"
                        >
                          <PhoneOff className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    )}

                    {/* Anti-Reflective Sapphire Crystal Glare Sweep */}
                    <div className="absolute left-[18%] top-[16%] w-[68%] h-[70%] overflow-hidden rounded-full pointer-events-none">
                      <div className="absolute -inset-full w-[200%] h-[200%] bg-gradient-to-r from-transparent via-cyan-400/12 via-purple-500/10 to-transparent animate-sapphire-glare pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* MOBILE & TABLET (< 1024px) - Clean Stacked Layout with Zero Collision */}
          <div className="lg:hidden relative w-full px-4 sm:px-6 pt-4 sm:pt-6 pb-6 sm:pb-8 flex flex-col items-center">
            {/* Top Text & CTAs */}
            <div className="w-full max-w-lg flex flex-col items-center text-center mb-4 sm:mb-6">


              {/* Headline */}
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-[1.15] mb-2.5 sm:mb-3.5 text-white">
                {t('hero_title_1', 'Next-Gen Electronics.')} <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00D9FF] via-[#1769FF] to-[#8B5CF6]">
                  {t('hero_title_2', 'Engineered for the Elements.')}
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-xs text-slate-300/85 leading-relaxed max-w-md mb-4 sm:mb-5 font-normal">
                {t(
                  'hero_desc',
                  'Designed for software developers, athletes, and digital creators. Discover aerospace titanium unibody wearables, reference beryllium acoustics, and high-velocity GaN power.'
                )}
              </p>

              {/* Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 w-full">
                <Link
                  to="/shop"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs text-white bg-gradient-to-r from-[#00D9FF] via-[#00b4d8] to-[#1769FF] shadow-md shadow-blue-500/25 transition-all active:scale-95"
                >
                  <span>{t('hero_explore', 'Explore Products')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  to="/product/prod-012"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full font-semibold text-xs text-slate-200 bg-[#0c1527]/90 hover:bg-[#13203c] border border-sky-500/40 shadow-xs transition-all active:scale-95"
                >
                  <span>TechTonic Pulse Ultra</span>
                  <Zap className="w-3.5 h-3.5 text-[#00D9FF]" />
                </Link>
              </div>
            </div>

            {/* Middle: Gear Showcase Image + Floating Cards */}
            <div className="w-full max-w-[290px] sm:max-w-sm mx-auto relative mb-4 select-none">
              <div
                className="relative overflow-hidden rounded-full"
                style={{
                  WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 66%, rgba(0,0,0,0.8) 82%, transparent 96%)',
                  maskImage: 'radial-gradient(circle at 50% 50%, black 66%, rgba(0,0,0,0.8) 82%, transparent 96%)',
                }}
              >
                <img
                  src="/images/mockup_assets/smartwatch_clean_water.jpg"
                  alt="TechTonic Premium Tech Gear Showcase"
                  className="w-full h-auto object-contain select-none drop-shadow-[0_15px_30px_rgba(0,217,255,0.25)]"
                />

                {/* Precision Automatic Chronometer Second Hand (Runs around 360° smoothly) */}
                <div className="absolute left-[29.3%] top-[45.8%] -translate-x-1/2 -translate-y-1/2 w-[8.6%] h-[8.6%] pointer-events-none select-none z-10">
                  {/* 360-Degree Continuous Rotating Hand */}
                  <div
                    className="w-full h-full relative"
                    style={{
                      animation: 'spin 12s linear infinite',
                      transformOrigin: '50% 50%'
                    }}
                  >
                    {/* Red Second Hand with Luminous Tip pointing up */}
                    <div className="absolute top-[4%] left-1/2 -translate-x-1/2 w-[1.5px] h-[46%] bg-gradient-to-t from-rose-600 via-rose-500 to-white rounded-full shadow-[0_0_6px_rgba(244,63,94,0.95)]" />
                    
                    {/* Counterweight Tail */}
                    <div className="absolute top-[50%] left-1/2 -translate-x-1/2 w-[1.5px] h-[16%] bg-rose-700">
                      <div className="w-1.5 h-1.5 rounded-full border border-rose-500 bg-black/80 -translate-x-[2.25px] translate-y-0.5" />
                    </div>
                  </div>

                  {/* Center Ruby & Titanium Cap */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gradient-to-tr from-slate-200 to-white shadow-sm flex items-center justify-center border border-slate-700 pointer-events-none">
                    <div className="w-1 h-1 rounded-full bg-rose-600 shadow-[0_0_4px_#e11d48]" />
                  </div>
                </div>

                {/* Right Watch: Interactive Incoming Call or Connected Call Simulation */}
                {!callActive ? (
                  <>
                    <div className="absolute left-[69.4%] top-[52.8%] -translate-x-1/2 -translate-y-1/2 w-[7%] h-[7%] rounded-full bg-emerald-400/35 animate-ping pointer-events-none" />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setCallActive(true); }}
                      className="absolute left-[69.4%] top-[52.8%] -translate-x-1/2 -translate-y-1/2 w-[5.8%] h-[5.8%] rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-md z-20"
                      title="Tap to answer incoming call"
                    >
                      <Phone className="w-[50%] h-[50%] animate-ringing" />
                    </button>
                  </>
                ) : (
                  <div className="absolute left-[63%] top-[31%] w-[23%] h-[34%] rounded-xl bg-[#030a1c]/95 border border-emerald-500/50 p-1.5 flex flex-col items-center justify-between text-white z-20 shadow-lg animate-fadeIn">
                    <span className="text-[7.5px] text-emerald-400 font-mono font-bold">CONNECTED</span>
                    <span className="text-[9px] font-mono text-emerald-300 font-bold">{formatCallTime(callSeconds)}</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setCallActive(false); }}
                      className="w-4 h-4 rounded-full bg-rose-600 flex items-center justify-center text-white"
                    >
                      <PhoneOff className="w-2 h-2" />
                    </button>
                  </div>
                )}

                {/* Sapphire Glare Sweep */}
                <div className="absolute left-[18%] top-[16%] w-[68%] h-[70%] overflow-hidden rounded-full pointer-events-none">
                  <div className="absolute -inset-full w-[200%] h-[200%] bg-gradient-to-r from-transparent via-cyan-400/10 via-purple-500/10 to-transparent animate-sapphire-glare pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Bottom Trust Indicators (Mobile / Tablet) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full max-w-md">
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#0b1328]/60 border border-slate-800">
                <div className="w-7 h-7 rounded-full bg-[#00D9FF]/10 border border-[#00D9FF]/30 flex items-center justify-center text-[#00D9FF] shrink-0">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">12,500+</div>
                  <div className="text-[10px] text-slate-400">{t('hero_stat_users', 'Active Tech Users')}</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#0b1328]/60 border border-slate-800">
                <div className="w-7 h-7 rounded-full bg-[#00D9FF]/10 border border-[#00D9FF]/30 flex items-center justify-center text-[#00D9FF] shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">100%</div>
                  <div className="text-[10px] text-slate-400">{t('hero_stat_genuine', 'Genuine Guaranteed')}</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#0b1328]/60 border border-slate-800">
                <div className="w-7 h-7 rounded-full bg-[#00D9FF]/10 border border-[#00D9FF]/30 flex items-center justify-center text-[#00D9FF] shrink-0">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">3-Hour</div>
                  <div className="text-[10px] text-slate-400">{t('hero_stat_delivery', 'Express Delivery')}</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Main Catalog Content */}
      <div className="flex flex-col gap-12 sm:gap-16 mt-8 sm:mt-12">


      {/* Video Demo Modal */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 fill-blue-600 text-blue-600" />
                <span className="text-sm font-bold text-slate-900">TechTonic Ecosystem — Experience Film</span>
              </div>
              <button
                type="button"
                onClick={() => setIsVideoModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 flex items-center justify-center text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative aspect-video bg-slate-900 flex items-center justify-center">
              <video
                src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                poster="/images/banners/techtonic-hero-banner.jpg"
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. FEATURED CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>{t('cat_section_tag', 'Curated Hardware')}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {t('cat_section_title', 'Curated Hardware Categories')}
            </h2>
          </div>
          <Link
            to="/shop"
            className="group inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
          >
            <span>{t('cat_all_hardware', 'Browse All Departments')}</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => {
            const meta = getCatMeta(cat);
            const Icon = meta.icon;
            const count = cat.itemCount || cat.count || 4;
            return (
              <Link
                key={cat.id}
                to={`/shop?category=${encodeURIComponent(cat.name)}`}
                className="group relative flex flex-col rounded-3xl bg-white border border-slate-200/80 hover:border-blue-400/60 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 overflow-hidden transform hover:-translate-y-1.5"
              >
                {/* Visual Stage with Ambient Radial Light and Transparent Product PNG */}
                <div className={`relative h-48 w-full bg-gradient-to-b ${meta.gradient} flex items-center justify-center p-4 overflow-hidden border-b border-slate-100`}>
                  {/* Subtle animated ambient aura */}
                  <div className="absolute w-32 h-32 rounded-full bg-white/60 blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
                  
                  {/* Category Pill Tag */}
                  <div className="absolute top-3.5 left-3.5 z-10">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border shadow-2xs backdrop-blur-md ${meta.tagColor}`}>
                      <Icon className="w-3.5 h-3.5" />
                      <span>{meta.badge}</span>
                    </span>
                  </div>

                  {/* Floating Product Cutout PNG */}
                  <img
                    src={meta.image}
                    alt={cat.name}
                    className="relative z-10 max-h-36 max-w-[85%] object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.12)] group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-500 ease-out"
                  />
                </div>

                {/* Card Content Details */}
                <div className="p-6 flex flex-col flex-1 justify-between bg-white">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors mb-2">
                      {translateCategory(cat.name, language)}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                      {cat.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 group-hover:text-blue-600 transition-colors pt-4 mt-4 border-t border-slate-100">
                    <span className="inline-flex items-center gap-1.5 text-slate-600 group-hover:text-blue-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      {count} {t('cat_flagship_products', 'Flagship Products')}
                    </span>
                    <span className="inline-flex items-center gap-1 text-blue-600 font-extrabold group-hover:translate-x-1 transition-transform">
                      {t('cat_explore_action', 'Explore')} <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. FEATURED PRODUCTS GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              {t('featured_tag', 'Hand-Picked Hardware')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              {t('featured_title', 'Featured Flagship Releases')}
            </h2>
          </div>
          <Link
            to="/shop"
            className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5"
          >
            <span>{t('featured_view_all', 'See Entire Catalog')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* 4. PROMOTIONAL SHOWCASE BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-950 via-blue-950 to-slate-950 p-8 sm:p-12 lg:p-14 text-white shadow-2xl border border-blue-500/20">
          {/* Ambient Lighting */}
          <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/15 blur-[120px] rounded-full pointer-events-none animate-pulse-glow" />
          <div className="absolute -bottom-10 left-10 w-[350px] h-[350px] bg-blue-600/15 blur-[100px] rounded-full pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
            {/* Left Column: Promotion Info */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 font-mono text-xs font-bold uppercase tracking-wider mb-4">
                <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>{t('promo_badge', 'Exclusive Developer Promotion')}</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-4 text-white leading-tight">
                {t('promo_title_1', 'Supercharge Your Desk with')} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400">
                  {t('promo_title_2', 'GaN 100W Fast Power.')}
                </span>
              </h2>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6 max-w-xl">
                {language === 'km' ? (
                  <>
                    ប្រើកូដបញ្ចុះតម្លៃ <span className="font-mono font-bold text-amber-400 bg-slate-900/80 px-2.5 py-1 rounded-md border border-amber-400/30 shadow-xs">TECH10</span> ពេលទូទាត់ ដើម្បីទទួលបានការបញ្ចុះតម្លៃ ១០% ភ្លាមៗ លើគ្រប់ឆ្នាំងសាក និងសម្ភារៈតុធ្វើការ។
                  </>
                ) : (
                  <>
                    Use promo code <span className="font-mono font-bold text-amber-400 bg-slate-900/80 px-2.5 py-1 rounded-md border border-amber-400/30 shadow-xs">TECH10</span> at checkout for 10% instant discount across all chargers and workspace peripherals.
                  </>
                )}
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4 mb-8">
                <Link to="/shop?category=Power+%26+Mobile">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center font-bold px-7 py-3.5 rounded-xl text-sm bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 shadow-lg shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <span>{t('promo_btn_shop', 'Shop Power & Mobile')}</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </Link>
                <Link to="/shop">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center font-bold px-6 py-3.5 rounded-xl text-sm text-slate-200 bg-slate-800/80 hover:bg-slate-800 hover:text-white border border-slate-700/80 backdrop-blur-md transition-all shadow-sm"
                  >
                    <span>{t('promo_btn_deals', 'Explore All Deals')}</span>
                  </button>
                </Link>
              </div>

              {/* Feature Pills */}
              <div className="flex flex-wrap gap-2.5 sm:gap-3 text-xs font-semibold text-slate-300">
                <span className="px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  {t('promo_feature_1', '100W Power Delivery 3.0')}
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-sky-400" />
                  {t('promo_feature_2', 'Zero Heat Dissipation')}
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  {t('promo_feature_3', '4-Port Matrix Output')}
                </span>
              </div>
            </div>

            {/* Right Column: Animated Power Splash Charger Image */}
            <div className="lg:col-span-5 relative flex items-center justify-center py-4">
              {/* Rotating Ambient Energy Rings */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[300px] h-[300px] sm:w-[380px] sm:h-[380px] rounded-full border border-cyan-500/20 animate-energy-spin" />
                <div className="absolute w-[220px] h-[220px] sm:w-[280px] sm:h-[280px] rounded-full border border-blue-500/25" />
              </div>

              {/* Animated Float Image */}
              <div className="relative z-10 w-full max-w-sm flex items-center justify-center group">
                <Link to="/product/prod-009" className="block relative">
                  <img
                    src="/images/banners/promo-gan-charger.png"
                    alt="100W GaN Fast Charger — Electric Power Splash"
                    className="w-full h-auto max-h-[380px] sm:max-h-[420px] object-contain drop-shadow-[0_20px_45px_rgba(6,182,212,0.4)] group-hover:scale-105 transition-transform duration-700 ease-out animate-float-slow"
                  />
                </Link>

                {/* Floating Badge 1: 100W HyperGaN */}
                <div className="absolute -top-3 -right-2 sm:-right-4 z-20 bg-slate-900/90 backdrop-blur-xl border border-cyan-500/30 px-3.5 py-2 rounded-2xl shadow-xl flex items-center gap-2 pointer-events-none">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-cyan-300" />
                  </div>
                  <div>
                    <div className="text-[11px] font-extrabold text-white">100W HyperGaN™</div>
                    <div className="text-[9px] text-cyan-200/80 font-medium">{t('promo_badge_density', '3x Power Density')}</div>
                  </div>
                </div>

                {/* Floating Badge 2: Product Link & Price */}
                <Link
                  to="/product/prod-009"
                  className="absolute -bottom-3 -left-2 sm:-left-4 z-20 bg-slate-900/90 hover:bg-slate-900 backdrop-blur-xl border border-slate-700/80 hover:border-cyan-500/50 px-3.5 py-2 rounded-2xl shadow-xl flex items-center gap-2.5 transition-all group/badge"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
                    <BatteryCharging className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-[11px] font-extrabold text-white group-hover/badge:text-cyan-300 transition-colors">
                      GaN Fast 100W
                    </div>
                    <div className="text-[9px] text-slate-400 font-medium">
                      <span className="font-bold text-white">$59.99</span> · {t('promo_badge_discount', '-10% with TECH10')}
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover/badge:text-cyan-400 group-hover/badge:translate-x-0.5 transition-all" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. BEST SELLERS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              {t('bestseller_tag', 'Top Customer Ratings')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              {t('bestseller_title', 'Best-Selling Hardware')}
            </h2>
          </div>
          <Link
            to="/shop?sort=rating"
            className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5"
          >
            <span>{t('featured_view_all', 'View All High-Rated')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {bestSellers.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* 6. WHY CHOOSE TECHTONIC */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 p-8 sm:p-12 lg:p-16 text-white shadow-2xl border border-slate-800/80">
          {/* Ambient Lighting Background */}
          <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-blue-600/10 blur-[130px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-[450px] h-[300px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 font-mono text-xs font-bold uppercase tracking-wider mb-4">
              <Award className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t('why_tag', 'Engineered For Excellence')}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              {t('why_title_1', 'Why Technology Leaders')} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400">
                {t('why_title_2', 'Choose TechTonic')}
              </span>
            </h2>
            <p className="text-sm sm:text-base text-slate-300 mt-3 leading-relaxed max-w-2xl mx-auto">
              {t('why_desc', 'Every hardware unit in our inventory undergoes acoustic, ergonomic, and thermal benchmark tests before entering our catalog.')}
            </p>
          </div>

          {/* 4 Premium Value Prop Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {/* 1. Warranty */}
            <div className="p-6 sm:p-7 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/50 shadow-lg hover:shadow-cyan-500/10 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1.5 backdrop-blur-md">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-cyan-300 border border-blue-500/30 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-md">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20">
                    {t('why_card_1_badge', 'Official SLA')}
                  </span>
                </div>
                <h3 className="text-lg font-black text-white mb-2 group-hover:text-cyan-300 transition-colors">
                  {t('why_card_1_title', '1-Year Full Warranty')}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t('why_card_1_desc', 'Official serialized warranty backed by our physical flagship service store at Toul Kork, Phnom Penh.')}
                </p>
              </div>
              <div className="pt-4 mt-5 border-t border-slate-800/80 flex items-center gap-2 text-[11px] font-bold text-slate-300">
                <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>{t('why_card_1_footer', 'Flagship Service Store Hub')}</span>
              </div>
            </div>

            {/* 2. Dispatch */}
            <div className="p-6 sm:p-7 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/50 shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1.5 backdrop-blur-md">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-md">
                    <Truck className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    {t('why_card_2_badge', 'Same-Day < 2PM')}
                  </span>
                </div>
                <h3 className="text-lg font-black text-white mb-2 group-hover:text-emerald-300 transition-colors">
                  {t('why_card_2_title', 'Express City Dispatch')}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t('why_card_2_desc', 'Orders placed before 2:00 PM are delivered same-day across Phnom Penh via GrabExpress & Cambodia Post.')}
                </p>
              </div>
              <div className="pt-4 mt-5 border-t border-slate-800/80 flex items-center gap-2 text-[11px] font-bold text-slate-300">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{t('why_card_2_footer', 'Real-time GPS Tracking')}</span>
              </div>
            </div>

            {/* 3. Swap */}
            <div className="p-6 sm:p-7 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-indigo-500/50 shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1.5 backdrop-blur-md">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-md">
                    <RotateCcw className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                    {t('why_card_3_badge', 'Zero Risk')}
                  </span>
                </div>
                <h3 className="text-lg font-black text-white mb-2 group-hover:text-indigo-300 transition-colors">
                  {t('why_card_3_title', '30-Day Hassle-Free Swap')}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t('why_card_3_desc', 'Not fully satisfied with keyboard switches or headphone fit? Enjoy smooth exchanges with zero fuss.')}
                </p>
              </div>
              <div className="pt-4 mt-5 border-t border-slate-800/80 flex items-center gap-2 text-[11px] font-bold text-slate-300">
                <CheckCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>{t('why_card_3_footer', '0% Restocking Deduction')}</span>
              </div>
            </div>

            {/* 4. KHQR */}
            <div className="p-6 sm:p-7 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-500/50 shadow-lg hover:shadow-amber-500/10 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1.5 backdrop-blur-md">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-600 group-hover:text-white transition-all shadow-md">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                    {t('why_card_4_badge', 'NBC Standard')}
                  </span>
                </div>
                <h3 className="text-lg font-black text-white mb-2 group-hover:text-amber-300 transition-colors">
                  {t('why_card_4_title', 'Bakong KHQR Integrated')}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t('why_card_4_desc', 'Scan seamlessly with ABA Mobile, Wing Bank, ACLEDA, or any National Bank of Cambodia compliant app.')}
                </p>
              </div>
              <div className="pt-4 mt-5 border-t border-slate-800/80 flex items-center gap-2 text-[11px] font-bold text-slate-300">
                <CheckCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{t('why_card_4_footer', 'Zero Processing Fee · Instant')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      </div>

      {/* 7. BRAND PARTNER MARQUEE (World's Leading Brands Loop) */}
      <BrandMarquee />
    </div>
  );
}
