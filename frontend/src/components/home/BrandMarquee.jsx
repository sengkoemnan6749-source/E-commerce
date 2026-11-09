import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../store/StoreContext';

/**
 * Scanline Strip — Preset 4: EDGE TO EDGE
 * Inspired by Framer Marketplace: https://www.framer.com/marketplace/components/scanline-strip/
 * 
 * Features:
 * - 100% full-width edge-to-edge layout with hairline top and bottom borders
 * - Dynamic moving vertical laser scanner line ("Scanline") with glowing beam
 * - Interactive cursor-following scanner on mouse hover
 * - High-contrast white/silver brand logos on deep midnight navy (#091022 / #060b18)
 * - Retains 100% of the authentic brand partners (Apple, Samsung, Sony, DJI, Microsoft, Bose, LG, Nintendo, Canon)
 */
export default function BrandMarquee() {
  const { t, language } = useLanguage();
  const stripRef = useRef(null);
  const [isHovering, setIsHovering] = useState(false);
  const [mouseX, setMouseX] = useState(0);

  const brands = [
    {
      id: 'apple',
      name: 'Apple',
      query: 'Apple',
      logo: '/images/brands/apple.svg',
      heightClass: 'h-7 sm:h-8'
    },
    {
      id: 'samsung',
      name: 'Samsung',
      query: 'Samsung',
      logo: '/images/brands/samsung.svg',
      heightClass: 'h-4.5 sm:h-5.5'
    },
    {
      id: 'sony',
      name: 'Sony',
      query: 'Sony',
      logo: '/images/brands/sony.svg',
      heightClass: 'h-4 sm:h-5'
    },
    {
      id: 'dji',
      name: 'DJI',
      query: 'DJI',
      logo: '/images/brands/dji.svg',
      heightClass: 'h-5.5 sm:h-6.5'
    },
    {
      id: 'microsoft',
      name: 'Microsoft',
      query: 'Microsoft',
      logo: '/images/brands/microsoft.svg',
      heightClass: 'h-5 sm:h-6'
    },
    {
      id: 'bose',
      name: 'Bose',
      query: 'Bose',
      logo: '/images/brands/bose.svg',
      heightClass: 'h-4.5 sm:h-5.5'
    },
    {
      id: 'lg',
      name: 'LG',
      query: 'LG',
      logo: '/images/brands/lg.svg',
      heightClass: 'h-6 sm:h-7'
    },
    {
      id: 'nintendo',
      name: 'Nintendo',
      query: 'Nintendo',
      logo: '/images/brands/nintendo.svg',
      heightClass: 'h-5.5 sm:h-6.5'
    },
    {
      id: 'canon',
      name: 'Canon',
      query: 'Canon',
      logo: '/images/brands/canon.svg',
      heightClass: 'h-5 sm:h-6'
    }
  ];

  const handleMouseMove = (e) => {
    if (!stripRef.current) return;
    const rect = stripRef.current.getBoundingClientRect();
    setMouseX(e.clientX - rect.left);
  };

  return (
    <section
      ref={stripRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className="relative w-full bg-[#060b18] border-y border-[#172545]/90 py-8 sm:py-10 overflow-hidden select-none"
    >
      {/* 1. Subtle Horizontal CRT Scanline Pattern Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255, 255, 255, 0.02) 3px, rgba(255, 255, 255, 0.02) 6px)',
        }}
      />

      {/* 2. Ambient Edge Highlights */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-sky-500/30 to-transparent" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-sky-500/30 to-transparent" />

      {/* 3. The Dynamic Moving "Scanline" Laser Beam */}
      <div
        className={`pointer-events-none absolute inset-y-0 z-20 ${
          isHovering ? 'transition-all duration-75 ease-out' : 'animate-scanline-sweep'
        }`}
        style={
          isHovering
            ? { left: `${mouseX}px`, transform: 'translateX(-50%)' }
            : {}
        }
      >
        {/* Horizontal Ambient Glow Flare */}
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-28 sm:w-44 bg-gradient-to-r from-transparent via-sky-400/18 to-transparent blur-md" />

        {/* Sharp Luminous Laser Line */}
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1.5px] bg-gradient-to-b from-transparent via-cyan-300 via-sky-400 to-transparent shadow-[0_0_12px_rgba(56,189,248,0.9)]" />

        {/* Top & Bottom Optical Scanner Nodes */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#38bdf8]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#38bdf8]" />
      </div>

      {/* 4. Top Technical Meta Bar (Edge-to-Edge Monospace Header) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 sm:mb-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left relative z-10">
        <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{language === 'km' ? 'ម៉ាកយីហោផ្លូវការ' : 'DIRECT HARDWARE ECOSYSTEM'}</span>
        </div>

        <p className="text-xs sm:text-sm font-semibold tracking-wider text-slate-300 uppercase">
          {language === 'km'
            ? 'ម៉ាកយីហោឈានមុខគេលើពិភពលោក នៅកន្លែងតែមួយ'
            : t('brand_strip_title', "The world's leading brands, all in one place.")}
        </p>

        <div className="hidden sm:flex items-center gap-2 text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-slate-400">
          <span className="text-sky-400 font-bold">9</span>
          <span>{language === 'km' ? 'ដៃគូសកលមានការបញ្ជាក់' : 'VERIFIED GLOBAL PARTNERS'}</span>
        </div>
      </div>

      {/* 5. Infinite Seamless Scrolling Marquee Container */}
      <div className="relative w-full overflow-hidden">
        {/* Left & Right Soft Fade Gradients (Matching the #060b18 dark theme) */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-20 sm:w-40 bg-gradient-to-r from-[#060b18] via-[#060b18]/80 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-20 sm:w-40 bg-gradient-to-l from-[#060b18] via-[#060b18]/80 to-transparent z-10" />

        {/* Marquee Track running smoothly Left to Right */}
        <div className="flex animate-marquee-ltr items-center py-2">
          {/* First Set of Brands */}
          <div className="flex items-center gap-14 sm:gap-20 lg:gap-24 px-6 sm:px-12 shrink-0">
            {brands.map((brand) => (
              <Link
                key={`b1-${brand.id}`}
                to={`/shop?search=${encodeURIComponent(brand.query)}`}
                className="group relative flex items-center justify-center shrink-0 transition-all duration-300 hover:scale-110"
                title={`Explore ${brand.name} official products`}
              >
                <img
                  src={brand.logo}
                  alt={`${brand.name} official logo`}
                  className={`${brand.heightClass} w-auto max-w-[130px] sm:max-w-[155px] object-contain select-none transition-all duration-300 brightness-0 invert opacity-45 group-hover:opacity-100 group-hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]`}
                  loading="eager"
                />
              </Link>
            ))}
          </div>

          {/* Second Duplicate Set for 100% Seamless Infinite Wrapping */}
          <div
            className="flex items-center gap-14 sm:gap-20 lg:gap-24 px-6 sm:px-12 shrink-0"
            aria-hidden="true"
          >
            {brands.map((brand) => (
              <Link
                key={`b2-${brand.id}`}
                to={`/shop?search=${encodeURIComponent(brand.query)}`}
                className="group relative flex items-center justify-center shrink-0 transition-all duration-300 hover:scale-110"
                title={`Explore ${brand.name} official products`}
              >
                <img
                  src={brand.logo}
                  alt=""
                  className={`${brand.heightClass} w-auto max-w-[130px] sm:max-w-[155px] object-contain select-none transition-all duration-300 brightness-0 invert opacity-45 group-hover:opacity-100 group-hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]`}
                  loading="eager"
                />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
