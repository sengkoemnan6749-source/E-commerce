import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useLanguage } from '../../store/StoreContext';

export default function LanguageSwitcher({ variant = 'navbar', className = '' }) {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const baseUrl = import.meta.env.BASE_URL || '/';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

  const languages = [
    {
      code: 'en',
      label: 'English',
      nativeLabel: 'English (US)',
      badge: 'EN',
      flag: `${cleanBase}icons/flags/us.png`
    },
    {
      code: 'km',
      label: 'Khmer',
      nativeLabel: 'ភាសាខ្មែរ',
      badge: 'KH',
      flag: `${cleanBase}icons/flags/kh.png`
    }
  ];

  const currentLang = languages.find(l => l.code === language) || languages[0];

  const handleSelect = (code) => {
    setLanguage(code);
    setIsOpen(false);
  };

  // Mobile segmented toggle variant
  if (variant === 'segmented') {
    return (
      <div className={`inline-flex items-center p-0.5 bg-slate-100 rounded-lg ${className}`}>
        {languages.map((l) => {
          const isActive = language === l.code;
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => setLanguage(l.code)}
              className={`px-2 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <img
                src={l.flag}
                alt={l.label}
                className="w-3.5 h-2.5 rounded-xs object-cover border border-slate-300/60 shrink-0"
              />
              <span>{l.badge}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Light Header Dropdown Variant (e.g. Admin Console)
  if (variant === 'light') {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          className="flex items-center gap-1.5 h-9 px-2.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100/80 hover:bg-slate-200/70 rounded-xl transition border border-slate-200/80 shrink-0 group cursor-pointer"
          title="Select Language / ជ្រើសរើសភាសា"
          aria-label="Language Switcher"
        >
          <img
            src={currentLang.flag}
            alt={currentLang.label}
            className="w-4.5 h-3 rounded-xs object-cover border border-slate-300 shadow-2xs shrink-0"
          />
          <span className="font-semibold text-slate-800 text-xs tracking-tight">
            {currentLang.badge}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-blue-600' : ''
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 text-slate-900">
            <div className="px-3.5 py-1.5 border-b border-slate-100 mb-1 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Language / ភាសា
              </span>
              <Globe className="w-3.5 h-3.5 text-slate-400" />
            </div>

            <div className="px-1.5 space-y-0.5">
              {languages.map((l) => {
                const isActive = language === l.code;
                return (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => handleSelect(l.code)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition text-left cursor-pointer ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-5 rounded-md overflow-hidden border border-slate-200 shadow-2xs shrink-0 flex items-center justify-center bg-slate-50">
                        <img
                          src={l.flag}
                          alt={l.label}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <span className="block leading-tight font-bold">{l.nativeLabel}</span>
                        <span className="text-[10px] text-slate-400 block leading-tight font-normal">
                          {l.label}
                        </span>
                      </div>
                    </div>
                    {isActive && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Standard Navbar Dropdown Variant
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition border border-transparent shrink-0 group"
        title="Select Language / ជ្រើសរើសភាសា"
        aria-label="Language Switcher"
      >
        <img
          src={currentLang.flag}
          alt={currentLang.label}
          className="w-5 h-3.5 rounded-xs object-cover border border-slate-700 shadow-2xs shrink-0 group-hover:scale-105 transition-transform"
        />
        <span className="hidden sm:inline font-semibold text-slate-200 text-xs tracking-tight">
          {currentLang.badge}
        </span>
        <ChevronDown
          className={`hidden sm:inline w-3 h-3 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-sky-400' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-52 bg-[#091124] rounded-2xl shadow-2xl border border-slate-700/80 py-2 z-50 animate-fadeIn text-white">
          <div className="px-3.5 py-1.5 border-b border-slate-800 mb-1 flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Language / ភាសា
            </span>
            <Globe className="w-3.5 h-3.5 text-slate-400" />
          </div>

          <div className="px-1.5 space-y-0.5">
            {languages.map((l) => {
              const isActive = language === l.code;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => handleSelect(l.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition text-left ${
                    isActive
                      ? 'bg-sky-950/80 text-sky-400 font-bold border border-sky-500/30'
                      : 'text-slate-300 hover:bg-slate-800/80 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-5 rounded-md overflow-hidden border border-slate-700 shadow-2xs shrink-0 flex items-center justify-center bg-slate-800">
                      <img
                        src={l.flag}
                        alt={l.label}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <span className="block leading-tight font-bold">{l.nativeLabel}</span>
                      <span className="text-[10px] text-slate-400 block leading-tight font-normal">
                        {l.label}
                      </span>
                    </div>
                  </div>
                  {isActive && <Check className="w-4 h-4 text-sky-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
