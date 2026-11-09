import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../store/StoreContext';

/**
 * Scanline Strip — Preset 4: EDGE TO EDGE (Per-Pixel Color Reveal Edition)
 * Inspired by Framer Marketplace: https://www.framer.com/marketplace/components/scanline-strip/
 * 
 * Features:
 * - Edge-to-edge full width with transparent background
 * - Dual-layer progressive color reveal mask:
 *   Base Layer: Muted grayscale resting logos
 *   Top Layer: 100% Full vibrant brand colors revealed dynamically by the laser beam mask
 * - 60 FPS requestAnimationFrame loop synchronizes laser line & radial color mask with zero React re-render overhead
 * - Interactive cursor magnetic tracking on mouse hover + auto sweeping ping-pong scan
 */
export default function BrandMarquee() {
  const { t, language } = useLanguage();
  const stripRef = useRef(null);
  const scannerRef = useRef(null);
  const colorLayerRef = useRef(null);
  const isHoveringRef = useRef(false);
  const targetXRef = useRef(0);

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

  // 60 FPS Laser Scanner Beam & Progressive Color Mask Synchronization
  useEffect(() => {
    let animId;
    let posX = -120;
    let direction = 1;
    const speed = 2.4; // smooth scanning velocity

    const tick = () => {
      if (!stripRef.current) {
        animId = requestAnimationFrame(tick);
        return;
      }

      const width = stripRef.current.offsetWidth || window.innerWidth;

      if (isHoveringRef.current) {
        // Smoothly glide towards mouse cursor (lerp)
        const target = targetXRef.current;
        posX += (target - posX) * 0.18;
      } else {
        // Continuous ping-pong laser sweep
        posX += speed * direction;
        if (posX > width + 100) {
          direction = -1;
        } else if (posX < -100) {
          direction = 1;
        }
      }

      // Update Scanner Laser Beam Position
      if (scannerRef.current) {
        scannerRef.current.style.transform = `translate3d(${posX}px, 0, 0)`;
      }

      // Update Progressive Color Reveal Mask (Center of beam reveals full brand colors)
      if (colorLayerRef.current) {
        const mask = `radial-gradient(150px 100% at ${posX}px 50%, black 25%, rgba(0,0,0,0.5) 60%, transparent 100%)`;
        colorLayerRef.current.style.maskImage = mask;
        colorLayerRef.current.style.webkitMaskImage = mask;
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleMouseMove = (e) => {
    if (!stripRef.current) return;
    const rect = stripRef.current.getBoundingClientRect();
    targetXRef.current = e.clientX - rect.left;
  };

  const renderBrandGroup = (colored = false, keyPrefix = 'b1') => (
    <div className="flex items-center gap-14 sm:gap-20 lg:gap-24 px-6 sm:px-12 shrink-0">
      {brands.map((brand) => (
        <Link
          key={`${keyPrefix}-${brand.id}`}
          to={`/shop?search=${encodeURIComponent(brand.query)}`}
          className="group relative flex items-center justify-center shrink-0 transition-transform duration-300 hover:scale-105"
          title={`Explore ${brand.name} official products`}
        >
          <img
            src={brand.logo}
            alt={colored ? '' : `${brand.name} official logo`}
            className={`${brand.heightClass} w-auto max-w-[130px] sm:max-w-[155px] object-contain select-none transition-all duration-300 ${
              colored
                ? 'opacity-100 drop-shadow-[0_4px_12px_rgba(0,0,0,0.15)]'
                : 'filter grayscale contrast-125 opacity-40 group-hover:opacity-80'
            }`}
            loading="eager"
          />
        </Link>
      ))}
    </div>
  );

  return (
    <section
      ref={stripRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => {
        isHoveringRef.current = true;
      }}
      onMouseLeave={() => {
        isHoveringRef.current = false;
      }}
      className="relative w-full bg-transparent border-y border-slate-200/80 py-8 sm:py-10 overflow-hidden select-none"
    >
      {/* 1. The Dynamic Moving "Scanline" Laser Beam */}
      <div
        ref={scannerRef}
        className="pointer-events-none absolute inset-y-0 left-0 z-30 will-change-transform"
        style={{ transform: 'translate3d(-150px, 0, 0)' }}
      >
        {/* Horizontal Ambient Glow Flare */}
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-28 sm:w-44 bg-gradient-to-r from-transparent via-blue-500/15 to-transparent blur-md" />

        {/* Sharp Luminous Laser Line */}
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1.5px] bg-gradient-to-b from-transparent via-blue-500 via-sky-400 to-transparent shadow-[0_0_12px_rgba(59,130,246,0.8)]" />

        {/* Top & Bottom Optical Scanner Nodes */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
      </div>

      {/* 2. Top Header (Clean Centered Title) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 sm:mb-8 text-center relative z-10">
        <p className="text-xs sm:text-sm font-semibold tracking-wider text-slate-500 uppercase">
          {language === 'km'
            ? 'ម៉ាកយីហោឈានមុខគេលើពិភពលោក នៅកន្លែងតែមួយ'
            : t('brand_strip_title', "The world's leading brands, all in one place.")}
        </p>
      </div>

      {/* 3. Dual-Layer Infinite Seamless Marquee Container */}
      <div className="relative w-full overflow-hidden">
        {/* LAYER A: Resting Grayscale Logos (Base Track) */}
        <div className="flex animate-marquee-ltr items-center py-2">
          {renderBrandGroup(false, 'base-1')}
          {renderBrandGroup(false, 'base-2')}
        </div>

        {/* LAYER B: Full Vibrant Brand Colors (Masked by moving scanline beam) */}
        <div
          ref={colorLayerRef}
          className="pointer-events-none absolute inset-0 flex animate-marquee-ltr items-center py-2 z-20"
          style={{
            maskImage: 'radial-gradient(150px 100% at -200px 50%, black 25%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(150px 100% at -200px 50%, black 25%, transparent 100%)',
          }}
        >
          {renderBrandGroup(true, 'color-1')}
          {renderBrandGroup(true, 'color-2')}
        </div>

        {/* Left & Right Soft Fade Gradients (Blends smoothly into transparent/slate-50 page) */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-20 sm:w-40 bg-gradient-to-r from-slate-50 via-slate-50/80 to-transparent z-25" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-20 sm:w-40 bg-gradient-to-l from-slate-50 via-slate-50/80 to-transparent z-25" />
      </div>
    </section>
  );
}
