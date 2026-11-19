import React, { useRef, useState } from 'react';
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  QrCode,
  Award,
  CheckCircle
} from 'lucide-react';
import { useLanguage } from '../../store/StoreContext';

/**
 * Framer-style Spotlight Card with interactive cursor tracking
 * Uses the exact dark midnight navy background (#091022) specified by user
 */
function SpotlightCard({ children, className = '' }) {
  const cardRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative p-6 sm:p-7 rounded-2xl bg-[#0d162d]/90 hover:bg-[#111c38] border border-[#1a294d] hover:border-sky-500/50 shadow-lg transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 overflow-hidden ${className}`}
    >
      {/* Dynamic Cursor Spotlight Beam (Framer style) */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(450px circle at ${mousePos.x}px ${mousePos.y}px, rgba(56, 189, 248, 0.14), transparent 70%)`,
        }}
      />

      {/* Dynamic Border Glow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300 border border-sky-400/30"
        style={{
          opacity: isHovered ? 1 : 0,
          maskImage: `radial-gradient(180px circle at ${mousePos.x}px ${mousePos.y}px, black 20%, transparent 80%)`,
          WebkitMaskImage: `radial-gradient(180px circle at ${mousePos.x}px ${mousePos.y}px, black 20%, transparent 80%)`,
        }}
      />

      {/* Card Content */}
      <div className="relative z-10 flex flex-col justify-between h-full">
        {children}
      </div>
    </div>
  );
}

export default function WhyChooseUsBento() {
  const { t } = useLanguage();

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full my-4">
      {/* Outer Container with the exact deep midnight navy color (#091022) */}
      <div className="relative rounded-3xl overflow-hidden bg-[#091022] p-5 sm:p-10 lg:p-14 text-white shadow-2xl border border-[#172545]">
        
        {/* Subtle Ambient Radial Highlight */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-56 bg-sky-500/10 blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-14 relative z-10">
          <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400 mb-3">
            <Award className="w-4 h-4 text-sky-400" />
            <span>{t('why_tag', 'Engineered For Excellence')}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            {t('why_title_1', 'Why Technology Leaders')} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-sky-300 to-blue-500">
              {t('why_title_2', 'Choose TechTonic')}
            </span>
          </h2>
          <p className="text-sm sm:text-base text-slate-300 mt-3.5 leading-relaxed max-w-2xl mx-auto">
            {t('why_desc', 'Every hardware unit in our inventory undergoes acoustic, ergonomic, and thermal benchmark tests before entering our catalog.')}
          </p>
        </div>

        {/* 4 Premium Cards Grid (Exact Layout from Image 1) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 relative z-10">
          
          {/* 1. Warranty */}
          <SpotlightCard>
            <div>
              <div className="flex items-center justify-between mb-5">
                <ShieldCheck className="w-7 h-7 text-sky-400 group-hover:text-sky-300 transition-colors" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {t('why_card_1_badge', 'Official SLA')}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-sky-300 transition-colors">
                {t('why_card_1_title', '1-Year Full Warranty')}
              </h3>
              <p className="text-xs text-slate-300/80 leading-relaxed">
                {t('why_card_1_desc', 'Official serialized warranty backed by our physical flagship service store at Toul Kork, Phnom Penh.')}
              </p>
            </div>
            <div className="pt-4 mt-5 border-t border-[#1a294d] flex items-center gap-2 text-[11px] font-bold text-slate-400">
              <CheckCircle className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>{t('why_card_1_footer', 'Flagship Service Store Hub')}</span>
            </div>
          </SpotlightCard>

          {/* 2. Dispatch */}
          <SpotlightCard>
            <div>
              <div className="flex items-center justify-between mb-5">
                <Truck className="w-7 h-7 text-sky-400 group-hover:text-sky-300 transition-colors" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {t('why_card_2_badge', 'Same-Day < 2PM')}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-sky-300 transition-colors">
                {t('why_card_2_title', 'Express City Dispatch')}
              </h3>
              <p className="text-xs text-slate-300/80 leading-relaxed">
                {t('why_card_2_desc', 'Orders placed before 2:00 PM are delivered same-day across Phnom Penh via GrabExpress & Cambodia Post.')}
              </p>
            </div>
            <div className="pt-4 mt-5 border-t border-[#1a294d] flex items-center gap-2 text-[11px] font-bold text-slate-400">
              <CheckCircle className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>{t('why_card_2_footer', 'Real-time GPS Tracking')}</span>
            </div>
          </SpotlightCard>

          {/* 3. Swap */}
          <SpotlightCard>
            <div>
              <div className="flex items-center justify-between mb-5">
                <RotateCcw className="w-7 h-7 text-sky-400 group-hover:text-sky-300 transition-colors" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {t('why_card_3_badge', 'Zero Risk')}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-sky-300 transition-colors">
                {t('why_card_3_title', '30-Day Hassle-Free Swap')}
              </h3>
              <p className="text-xs text-slate-300/80 leading-relaxed">
                {t('why_card_3_desc', 'Not fully satisfied with keyboard switches or headphone fit? Enjoy smooth exchanges with zero fuss.')}
              </p>
            </div>
            <div className="pt-4 mt-5 border-t border-[#1a294d] flex items-center gap-2 text-[11px] font-bold text-slate-400">
              <CheckCircle className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>{t('why_card_3_footer', '0% Restocking Deduction')}</span>
            </div>
          </SpotlightCard>

          {/* 4. KHQR */}
          <SpotlightCard>
            <div>
              <div className="flex items-center justify-between mb-5">
                <QrCode className="w-7 h-7 text-sky-400 group-hover:text-sky-300 transition-colors" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {t('why_card_4_badge', 'NBC Standard')}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-sky-300 transition-colors">
                {t('why_card_4_title', 'Bakong KHQR Integrated')}
              </h3>
              <p className="text-xs text-slate-300/80 leading-relaxed">
                {t('why_card_4_desc', 'Scan seamlessly with ABA Mobile, Wing Bank, ACLEDA, or any National Bank of Cambodia compliant app.')}
              </p>
            </div>
            <div className="pt-4 mt-5 border-t border-[#1a294d] flex items-center gap-2 text-[11px] font-bold text-slate-400">
              <CheckCircle className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>{t('why_card_4_footer', 'Zero Processing Fee · Instant')}</span>
            </div>
          </SpotlightCard>

        </div>
      </div>
    </section>
  );
}
