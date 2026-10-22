import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../store/StoreContext';

export default function BrandMarquee() {
  const { t, language } = useLanguage();

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

  return (
    <section className="w-full bg-white border-t border-slate-200/80 pt-10 pb-10 overflow-hidden select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 text-center">
        <p className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-widest">
          {language === 'km'
            ? 'ម៉ាកយីហោឈានមុខគេលើពិភពលោក នៅកន្លែងតែមួយ'
            : t('brand_strip_title', "The world's leading brands, all in one place.")}
        </p>
      </div>

      {/* Infinite Seamless Scrolling Marquee Container (Left to Right Loop) */}
      <div className="relative w-full overflow-hidden">
        {/* Left & Right Soft Fade Gradients */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-20 sm:w-36 bg-gradient-to-r from-white via-white/80 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-20 sm:w-36 bg-gradient-to-l from-white via-white/80 to-transparent z-10" />

        {/* Marquee Track running smoothly Left to Right */}
        <div className="flex animate-marquee-ltr items-center">
          {/* First Set of Brands */}
          <div className="flex items-center gap-14 sm:gap-20 lg:gap-24 px-6 sm:px-12 shrink-0">
            {brands.map((brand) => (
              <Link
                key={`b1-${brand.id}`}
                to={`/shop?search=${encodeURIComponent(brand.query)}`}
                className="group flex items-center justify-center shrink-0 transition-transform duration-300 hover:scale-105"
                title={`Explore ${brand.name} official products`}
              >
                <img
                  src={brand.logo}
                  alt={`${brand.name} official logo`}
                  className={`${brand.heightClass} w-auto max-w-[130px] sm:max-w-[155px] object-contain select-none transition-all duration-300 filter grayscale contrast-125 opacity-75 group-hover:grayscale-0 group-hover:opacity-100`}
                  loading="eager"
                />
              </Link>
            ))}
          </div>

          {/* Second Duplicate Set for 100% Seamless Infinite Wrapping */}
          <div className="flex items-center gap-14 sm:gap-20 lg:gap-24 px-6 sm:px-12 shrink-0" aria-hidden="true">
            {brands.map((brand) => (
              <Link
                key={`b2-${brand.id}`}
                to={`/shop?search=${encodeURIComponent(brand.query)}`}
                className="group flex items-center justify-center shrink-0 transition-transform duration-300 hover:scale-105"
                title={`Explore ${brand.name} official products`}
              >
                <img
                  src={brand.logo}
                  alt=""
                  className={`${brand.heightClass} w-auto max-w-[130px] sm:max-w-[155px] object-contain select-none transition-all duration-300 filter grayscale contrast-125 opacity-75 group-hover:grayscale-0 group-hover:opacity-100`}
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
