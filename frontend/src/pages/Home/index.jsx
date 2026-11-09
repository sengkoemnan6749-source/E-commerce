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
import WhyChooseUsBento from '../../components/home/WhyChooseUsBento';

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
      tagColor: 'text-blue-700 bg-blue-50/90 border-blue-200/70',
      gradient: 'from-blue-600/5 via-slate-50/50 to-transparent'
    },
    wearables: {
      icon: Watch,
      badge: t('cat_badge_wearables', 'AMOLED & Biosensors'),
      image: '/images/products/prod-004-silver.png',
      tagColor: 'text-blue-700 bg-blue-50/90 border-blue-200/70',
      gradient: 'from-blue-600/5 via-slate-50/50 to-transparent'
    },
    workspace: {
      icon: Keyboard,
      badge: t('cat_badge_workspace', 'CNC & Mechanical'),
      image: '/images/products/prod-006-main.png',
      tagColor: 'text-blue-700 bg-blue-50/90 border-blue-200/70',
      gradient: 'from-blue-600/5 via-slate-50/50 to-transparent'
    },
    power: {
      icon: BatteryCharging,
      badge: t('cat_badge_power', '100W GaN III Fast'),
      image: '/images/products/prod-009-charger.png',
      tagColor: 'text-blue-700 bg-blue-50/90 border-blue-200/70',
      gradient: 'from-blue-600/5 via-slate-50/50 to-transparent'
    }
  };

  const getCatMeta = (cat) => {
    return categoryMeta[cat.slug] || categoryMeta[cat.id] || {
      icon: Headphones,
      badge: t('cat_section_tag', 'Curated Hardware'),
      image: cat.image || '/images/products/prod-001-main.png',
      tagColor: 'text-blue-700 bg-blue-50/90 border-blue-200/70',
      gradient: 'from-blue-600/5 to-transparent'
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

          {/* DESKTOP (>= 1024px) - Balanced Two-Column Cinematic Layout */}
          <div className="hidden lg:block relative w-full max-w-7xl xl:max-w-[1400px] mx-auto px-6 lg:px-8 py-12 xl:py-16">
            <div className="grid grid-cols-12 gap-8 xl:gap-12 items-center">
              
              {/* Left Column: Typography, CTAs & Statistics */}
              <div className="col-span-12 lg:col-span-7 xl:col-span-7 z-20 flex flex-col items-start text-left relative">

                {/* Headline */}
                <h1 className={`font-black ${
                  language === 'kh'
                    ? 'text-2xl sm:text-4xl lg:text-[2.65rem] xl:text-[3rem] leading-[1.35] sm:leading-[1.3] tracking-normal'
                    : 'text-3xl sm:text-5xl lg:text-[3.25rem] xl:text-[3.65rem] tracking-tight leading-[1.12] sm:leading-[1.08]'
                } mb-4 sm:mb-5 text-white drop-shadow-sm relative z-10`}>
                  <span>{t('hero_title_1', 'Next-Gen Electronics.')}</span>{' '}
                  <br className="hidden sm:inline" />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-sky-300 to-blue-500">
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
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-md hover:shadow-blue-500/20 transition-all transform hover:-translate-y-0.5 active:scale-95"
                  >
                    <span>{t('hero_explore', 'Explore Products')}</span>
                    <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </Link>

                  <Link
                    to="/product/prod-012"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-semibold text-xs sm:text-sm text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:border-slate-600 shadow-sm transition-all transform hover:-translate-y-0.5 active:scale-95 group"
                  >
                    <span>TechTonic Pulse Ultra</span>
                    <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400 group-hover:scale-110 transition-transform" />
                  </Link>
                </div>

                {/* Trust stats row with subtle vertical dividers */}
                <div className="hidden sm:flex items-center gap-4 xl:gap-6 pt-5 border-t border-slate-800/80 w-full">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-sky-400 shrink-0" />
                    <div>
                      <div className="text-sm font-bold text-white tracking-tight">12,500+</div>
                      <div className="text-[11px] text-slate-400 font-medium whitespace-nowrap">{t('hero_stat_users', 'Active Tech Users')}</div>
                    </div>
                  </div>

                  <div className="h-7 w-[1px] bg-slate-800 shrink-0" />

                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-sky-400 shrink-0" />
                    <div>
                      <div className="text-sm font-bold text-white tracking-tight">100%</div>
                      <div className="text-[11px] text-slate-400 font-medium whitespace-nowrap">{t('hero_stat_genuine', 'Genuine Guaranteed')}</div>
                    </div>
                  </div>

                  <div className="h-7 w-[1px] bg-slate-800 shrink-0" />

                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-sky-400 shrink-0" />
                    <div>
                      <div className="text-sm font-bold text-white tracking-tight">3-Hour</div>
                      <div className="text-[11px] text-slate-400 font-medium whitespace-nowrap">{t('hero_stat_delivery', 'Express Delivery')}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Seamless Smartwatch Vortex Showcase + Refined Floating Cards */}
              <div className="col-span-12 lg:col-span-5 xl:col-span-5 z-10 relative flex items-center justify-center">
                <div className="relative w-full max-w-[340px] sm:max-w-md lg:max-w-xl 2xl:max-w-2xl select-none mx-auto mt-2 lg:mt-0">
                  
                  {/* Clean Smartwatch & Water Splash with Rotating Water Vortex ("ទឹកវិល") */}
                  <div
                    className="relative select-none overflow-hidden rounded-full"
                    style={{
                      WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 66%, rgba(0,0,0,0.8) 82%, transparent 96%)',
                      maskImage: 'radial-gradient(circle at 50% 50%, black 66%, rgba(0,0,0,0.8) 82%, transparent 96%)',
                    }}
                  >
                    {/* Rotating Water Vortex Ring ("ទឹកវិល" - 360° Continuous Liquid Motion) */}
                    <div
                      className="absolute inset-0 select-none pointer-events-none"
                      style={{
                        animation: 'spin 22s linear infinite',
                        transformOrigin: '50% 50%'
                      }}
                    >
                      <img
                        src="/images/mockup_assets/hero_water_vortex_ring.png"
                        alt="Rotating Water Vortex"
                        className="w-full h-full object-contain select-none"
                      />
                    </div>

                    {/* Stationary Smartwatches Center Layer */}
                    <img
                      src="/images/mockup_assets/hero_smartwatches_center.png"
                      alt="TechTonic Pulse Ultra Dual Smartwatch Showcase"
                      className="relative z-10 w-full h-auto object-contain select-none drop-shadow-[0_20px_50px_rgba(0,217,255,0.3)]"
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
              <h1 className={`font-black ${
                language === 'kh'
                  ? 'text-xl sm:text-2xl leading-[1.38] tracking-normal'
                  : 'text-2xl sm:text-3xl tracking-tight leading-[1.15]'
              } mb-2.5 sm:mb-3.5 text-white`}>
                <span>{t('hero_title_1', 'Next-Gen Electronics.')}</span>{' '}
                <br className="hidden sm:inline" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-sky-300 to-blue-500">
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
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs text-white bg-blue-600 hover:bg-blue-500 shadow-sm transition-all active:scale-95"
                >
                  <span>{t('hero_explore', 'Explore Products')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  to="/product/prod-012"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full font-semibold text-xs text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 shadow-xs transition-all active:scale-95"
                >
                  <span>TechTonic Pulse Ultra</span>
                  <Zap className="w-3.5 h-3.5 text-sky-400" />
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
                {/* Rotating Water Splash Vortex ("ទឹកវិល" - 360° Continuous Liquid Motion) */}
                <div
                  className="absolute inset-0 select-none pointer-events-none"
                  style={{
                    animation: 'spin 22s linear infinite',
                    transformOrigin: '50% 50%'
                  }}
                >
                  <img
                    src="/images/mockup_assets/hero_water_vortex_ring.png"
                    alt="Rotating Water Vortex"
                    className="w-full h-full object-contain select-none"
                  />
                </div>

                {/* Stationary Smartwatches Center Layer */}
                <img
                  src="/images/mockup_assets/hero_smartwatches_center.png"
                  alt="TechTonic Premium Tech Gear Showcase"
                  className="relative z-10 w-full h-auto object-contain select-none drop-shadow-[0_15px_30px_rgba(0,217,255,0.25)]"
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
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0b1328]/60 border border-slate-800">
                <Users className="w-5 h-5 text-sky-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white">12,500+</div>
                  <div className="text-[10px] text-slate-400">{t('hero_stat_users', 'Active Tech Users')}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0b1328]/60 border border-slate-800">
                <ShieldCheck className="w-5 h-5 text-sky-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white">100%</div>
                  <div className="text-[10px] text-slate-400">{t('hero_stat_genuine', 'Genuine Guaranteed')}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0b1328]/60 border border-slate-800">
                <Zap className="w-5 h-5 text-sky-400 shrink-0" />
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
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
              {t('cat_section_tag', 'Curated Hardware')}
            </span>
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
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-8 sm:p-12 lg:p-14 text-white shadow-2xl border border-slate-800">
          {/* Subtle Ambient Lighting */}
          <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-blue-600/10 blur-3xl rounded-full pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
            {/* Left Column: Promotion Info */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400 mb-3">
                <Zap className="w-4 h-4 text-sky-400" />
                <span>{t('promo_badge', 'Exclusive Developer Promotion')}</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-4 text-white leading-tight">
                {t('promo_title_1', 'Supercharge Your Desk with')} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-sky-300 to-blue-500">
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
                    className="inline-flex items-center justify-center font-bold px-7 py-3.5 rounded-xl text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-md hover:shadow-blue-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                  >
                    <span>{t('promo_btn_shop', 'Shop Power & Mobile')}</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </Link>
                <Link to="/shop">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center font-bold px-6 py-3.5 rounded-xl text-sm text-slate-200 bg-slate-800/80 hover:bg-slate-800 hover:text-white border border-slate-700/80 backdrop-blur-md transition-all shadow-sm cursor-pointer"
                  >
                    <span>{t('promo_btn_deals', 'Explore All Deals')}</span>
                  </button>
                </Link>
              </div>

              {/* Feature Pills */}
              <div className="flex flex-wrap gap-2.5 sm:gap-3 text-xs font-semibold text-slate-300">
                <span className="px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-sky-400" />
                  {t('promo_feature_1', '100W Power Delivery 3.0')}
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-sky-400" />
                  {t('promo_feature_2', 'Zero Heat Dissipation')}
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
                  {t('promo_feature_3', '4-Port Matrix Output')}
                </span>
              </div>
            </div>

            {/* Right Column: Animated GaN Charger Energy Showcase */}
            <div className="lg:col-span-5 relative flex items-center justify-center py-6 sm:py-8 select-none">
              
              {/* Radial Energy Background Aura & Pulsing Shockwaves */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 sm:w-84 sm:h-84 rounded-full bg-gradient-to-tr from-sky-500/25 via-blue-600/35 to-cyan-400/25 blur-3xl animate-pulse-glow" />
                <div
                  className="absolute w-56 h-56 sm:w-72 sm:h-72 rounded-full border border-sky-400/40 animate-shockwave-pulse"
                />
                <div
                  className="absolute w-44 h-44 sm:w-60 sm:h-60 rounded-full border border-cyan-300/30 animate-shockwave-pulse"
                  style={{ animationDelay: '1.4s' }}
                />
              </div>

              {/* Floating GaN Charger Unit with Smooth Zero-G Levitation */}
              <div className="relative z-10 w-full max-w-sm flex items-center justify-center animate-gan-levitate group">
                <Link to="/product/prod-009" className="block relative cursor-pointer" title="TechTonic 100W GaN Fast Charger">
                  
                  {/* Dynamic Lightning Bolt Sparks Over Image */}
                  {/* 1. Top-Right Lightning Strike Flare */}
                  <div className="absolute top-[12%] right-[22%] pointer-events-none z-20 animate-lightning-zap">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-sky-400/50 via-cyan-300/60 to-white/80 blur-md" />
                    <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 text-white fill-cyan-200 drop-shadow-[0_0_12px_#38bdf8]" />
                  </div>

                  {/* 2. Left-Side Lightning Strike Flare */}
                  <div
                    className="absolute top-[46%] left-[22%] pointer-events-none z-20 animate-lightning-zap"
                    style={{ animationDelay: '1.3s' }}
                  >
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-blue-500/40 via-sky-400/50 to-white/70 blur-md" />
                    <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 sm:w-8 sm:h-8 text-white fill-sky-200 drop-shadow-[0_0_10px_#0ea5e9]" />
                  </div>

                  {/* 3. Floating Ion Sparkle Particles around Water Splash */}
                  <div className="absolute top-[22%] left-[16%] w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_8px_#67e8f9] animate-ion-sparkle pointer-events-none" />
                  <div className="absolute top-[8%] right-[38%] w-2 h-2 rounded-full bg-sky-300 shadow-[0_0_8px_#38bdf8] animate-ion-sparkle pointer-events-none" style={{ animationDelay: '0.8s' }} />
                  <div className="absolute bottom-[28%] right-[16%] w-2 h-2 rounded-full bg-cyan-200 shadow-[0_0_8px_#a5f3fc] animate-ion-sparkle pointer-events-none" style={{ animationDelay: '1.5s' }} />
                  <div className="absolute bottom-[36%] left-[14%] w-1.5 h-1.5 rounded-full bg-sky-200 shadow-[0_0_6px_#bae6fd] animate-ion-sparkle pointer-events-none" style={{ animationDelay: '0.4s' }} />

                  {/* Main Product Showcase Image */}
                  <img
                    src="/images/banners/promo-gan-charger.png"
                    alt="100W GaN Fast Charger"
                    className="w-full h-auto max-h-[380px] sm:max-h-[440px] object-contain drop-shadow-[0_20px_50px_rgba(14,165,233,0.35)] group-hover:scale-105 group-hover:drop-shadow-[0_25px_60px_rgba(56,189,248,0.6)] transition-all duration-500 ease-out"
                  />

                  {/* Active 100W Power Indicator LED on USB-C1 Port */}
                  <div
                    className="absolute top-[42.2%] right-[38.8%] -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399] animate-pulse pointer-events-none z-20"
                    title="100W GaN Power Live"
                  >
                    <div className="absolute -inset-1 rounded-full bg-emerald-400/40 animate-ping" />
                  </div>

                  {/* Active Power Accent on USB-A Port */}
                  <div
                    className="absolute top-[61.8%] right-[38.8%] -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#fbbf24] pointer-events-none z-20 opacity-80"
                    title="USB-A QuickCharge 3.0"
                  />
                </Link>

                {/* Floating Tech Chip 1: Top Right */}
                <div className="absolute -top-3 -right-2 sm:right-2 z-20 animate-float-reverse pointer-events-none">
                  <div className="px-3 py-1.5 rounded-full bg-slate-900/95 backdrop-blur-md border border-sky-400/50 shadow-[0_4px_16px_rgba(14,165,233,0.25)] flex items-center gap-1.5 text-[11px] font-bold text-sky-300">
                    <Zap className="w-3.5 h-3.5 text-sky-400 fill-sky-400 animate-pulse" />
                    <span>100W GaN III Active</span>
                  </div>
                </div>

                {/* Floating Tech Chip 2: Bottom Left */}
                <div className="absolute -bottom-3 -left-2 sm:left-2 z-20 animate-float-slow pointer-events-none" style={{ animationDelay: '1.5s' }}>
                  <div className="px-3 py-1.5 rounded-full bg-slate-900/95 backdrop-blur-md border border-cyan-400/50 shadow-[0_4px_16px_rgba(6,182,212,0.25)] flex items-center gap-1.5 text-[11px] font-bold text-cyan-300">
                    <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                    <span>CoolFlow &bull; 28&deg;C</span>
                  </div>
                </div>
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

      {/* 6. WHY CHOOSE TECHTONIC - FRAMER-STYLE SPOTLIGHT BENTO GRID */}
      <WhyChooseUsBento />
      </div>

      {/* 7. BRAND PARTNER MARQUEE (World's Leading Brands Loop) */}
      <BrandMarquee />
    </div>
  );
}
