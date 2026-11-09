import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../store/StoreContext';

/**
 * Scanline Strip — Running Marquee Edition with Laser Color Reveal
 * Inspired by Framer Marketplace: https://www.framer.com/marketplace/components/scanline-strip/
 * 
 * Features:
 * - Brands RUN smoothly in an infinite marquee loop (Left to Right)
 * - Single-track architecture: ZERO duplicate layers, ZERO ghosting, ZERO text overlapping
 * - Dynamic moving vertical laser scanline sweeps across the strip
 * - As any brand passes under or touches the laser beam ("ចំ brand ណា"), it instantly reveals its 100% full vibrant color and scales up
 * - Smoothly transitions back to resting grayscale once it passes the laser
 * - Interactive cursor-following on mouse hover
 */
export default function BrandMarquee() {
  const { t, language } = useLanguage();
  const stripRef = useRef(null);
  const scannerRef = useRef(null);
  const brandElementsRef = useRef([]);
  const isHoveringRef = useRef(false);
  const targetXRef = useRef(0);

  const brands = [
    {
      id: 'apple',
      name: 'Apple',
      query: 'Apple',
      logo: '/images/brands/apple.svg',
      heightClass: 'h-6 sm:h-7'
    },
    {
      id: 'samsung',
      name: 'Samsung',
      query: 'Samsung',
      logo: '/images/brands/samsung.svg',
      heightClass: 'h-4 sm:h-5'
    },
    {
      id: 'sony',
      name: 'Sony',
      query: 'Sony',
      logo: '/images/brands/sony.svg',
      heightClass: 'h-3.5 sm:h-4.5'
    },
    {
      id: 'dji',
      name: 'DJI',
      query: 'DJI',
      logo: '/images/brands/dji.svg',
      heightClass: 'h-5 sm:h-6'
    },
    {
      id: 'microsoft',
      name: 'Microsoft',
      query: 'Microsoft',
      logo: '/images/brands/microsoft.svg',
      heightClass: 'h-4.5 sm:h-5.5'
    },
    {
      id: 'bose',
      name: 'Bose',
      query: 'Bose',
      logo: '/images/brands/bose.svg',
      heightClass: 'h-4 sm:h-5'
    },
    {
      id: 'lg',
      name: 'LG',
      query: 'LG',
      logo: '/images/brands/lg.svg',
      heightClass: 'h-5.5 sm:h-6.5'
    },
    {
      id: 'nintendo',
      name: 'Nintendo',
      query: 'Nintendo',
      logo: '/images/brands/nintendo.svg',
      heightClass: 'h-5 sm:h-6'
    },
    {
      id: 'canon',
      name: 'Canon',
      query: 'Canon',
      logo: '/images/brands/canon.svg',
      heightClass: 'h-4.5 sm:h-5.5'
    }
  ];

  // 60 FPS Laser Scanner Beam & Running Brand Hit-Detection Loop
  useEffect(() => {
    let animId;
    let posX = -80;
    let direction = 1;
    const speed = 2.4; // scanning velocity

    const tick = () => {
      if (!stripRef.current) {
        animId = requestAnimationFrame(tick);
        return;
      }

      const stripRect = stripRef.current.getBoundingClientRect();
      const width = stripRect.width || window.innerWidth;

      if (isHoveringRef.current) {
        // Smoothly glide towards mouse cursor (lerp)
        const target = targetXRef.current;
        posX += (target - posX) * 0.18;
      } else {
        // Continuous ping-pong laser sweep
        posX += speed * direction;
        if (posX > width + 40) {
          direction = -1;
        } else if (posX < -40) {
          direction = 1;
        }
      }

      // Update Scanner Laser Beam Position
      if (scannerRef.current) {
        scannerRef.current.style.transform = `translate3d(${posX}px, 0, 0)`;
      }

      // Check which running brand the laser line is currently hitting ("ចំ brand ណា")
      const elements = brandElementsRef.current;
      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        if (!el) continue;

        const rect = el.getBoundingClientRect();
        // Calculate center relative to strip container
        const elCenter = (rect.left + rect.right) / 2 - stripRect.left;
        const halfWidth = rect.width / 2 + 25; // hit threshold

        const isHit = Math.abs(posX - elCenter) <= halfWidth;
        if (isHit) {
          el.classList.add('brand-scanned-active');
        } else {
          el.classList.remove('brand-scanned-active');
        }
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

  const renderBrandGroup = (startIndex = 0) => (
    <div className="flex items-center gap-14 sm:gap-20 lg:gap-24 px-6 sm:px-12 shrink-0">
      {brands.map((brand, idx) => {
        const globalIdx = startIndex + idx;
        return (
          <Link
            key={`brand-${globalIdx}-${brand.id}`}
            to={`/shop?search=${encodeURIComponent(brand.query)}`}
            ref={(el) => {
              brandElementsRef.current[globalIdx] = el;
            }}
            className="brand-item group relative flex items-center justify-center shrink-0 p-2 cursor-pointer"
            title={`Explore ${brand.name} official products`}
          >
            <img
              src={brand.logo}
              alt={`${brand.name} official logo`}
              className={`${brand.heightClass} w-auto max-w-[120px] sm:max-w-[145px] object-contain select-none`}
              loading="eager"
            />
          </Link>
        );
      })}
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
      <style>{`
        .brand-item {
          transition: filter 0.28s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1), transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
          filter: grayscale(100%) contrast(120%);
          opacity: 0.38;
          will-change: filter, opacity, transform;
        }
        .brand-item.brand-scanned-active,
        .brand-item:hover {
          filter: none !important;
          opacity: 1 !important;
          transform: scale(1.1) !important;
        }
      `}</style>

      {/* 1. The Dynamic Moving "Scanline" Laser Beam */}
      <div
        ref={scannerRef}
        className="pointer-events-none absolute inset-y-0 left-0 z-30 will-change-transform"
        style={{ transform: 'translate3d(-150px, 0, 0)' }}
      >
        {/* Horizontal Ambient Glow Flare */}
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-28 sm:w-44 bg-gradient-to-r from-transparent via-blue-500/15 to-transparent blur-md" />

        {/* Sharp Luminous Laser Line */}
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1.5px] bg-gradient-to-b from-transparent via-blue-500 via-sky-400 to-transparent shadow-[0_0_12px_rgba(59,130,246,0.85)]" />

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

      {/* 3. Single-Track Running Marquee (Zero Ghosting, Zero Overlap) */}
      <div className="relative w-full overflow-hidden">
        {/* Soft Fade Edge Gradients */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-20 sm:w-36 bg-gradient-to-r from-slate-50 via-slate-50/80 to-transparent z-20" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-20 sm:w-36 bg-gradient-to-l from-slate-50 via-slate-50/80 to-transparent z-20" />

        {/* Infinite Running Marquee Track */}
        <div className="flex animate-marquee-ltr items-center py-2">
          {renderBrandGroup(0)}
          {renderBrandGroup(9)}
        </div>
      </div>
    </section>
  );
}
