import React, { useState } from 'react';
import { ShieldCheck, Package } from 'lucide-react';
import { useLanguage } from '../../store/StoreContext';

export default function ProductSpecs({ specs = {}, inBox = [], warranty = '' }) {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const { language } = useLanguage();
  const specEntries = Object.entries(specs);

  return (
    <div className="space-y-8">
      {/* Main Grid: Left Specifications & Right Box Contents */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Tech Specs (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {language === 'km' ? 'លក្ខណៈបច្ចេកទេសផលិតផល' : 'Hardware Specifications'}
              </h3>
            </div>

            {/* View Mode Toggle Switcher */}
            <div className="flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-medium">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded-md transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-slate-900 font-bold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {language === 'km' ? 'កាត' : 'Cards'}
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 rounded-md transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 font-bold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {language === 'km' ? 'តារាង' : 'Table'}
              </button>
            </div>
          </div>

          {specEntries.length > 0 ? (
            viewMode === 'grid' ? (
              /* CLEAN MODERN SPEC CARDS (No Squircle Icon Clutter) */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {specEntries.map(([key, value]) => (
                  <div
                    key={key}
                    className="p-4 rounded-xl bg-white border border-slate-200/90 hover:border-slate-300 transition-colors"
                  >
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      {key}
                    </span>
                    <span className="font-semibold text-slate-900 text-sm leading-snug block">
                      {String(value)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              /* CLEAN CONTRAST TABLE VIEW */
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-sm border-collapse">
                  <tbody>
                    {specEntries.map(([key, value], idx) => (
                      <tr
                        key={key}
                        className={`border-b border-slate-100 last:border-b-0 ${
                          idx % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'
                        }`}
                      >
                        <td className="py-3 px-4 font-semibold text-slate-600 w-2/5 text-xs sm:text-sm">
                          {key}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 text-xs sm:text-sm">
                          {String(value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <p className="text-sm text-slate-500 py-6 text-center bg-slate-50 rounded-xl border border-slate-200">
              {language === 'km'
                ? 'លក្ខណៈបច្ចេកទេសស្តង់ដារត្រូវបានអនុវត្តសម្រាប់ម៉ូដែលនេះ។'
                : 'Standard hardware architecture applies to this model.'}
            </p>
          )}
        </div>

        {/* Right Column: In the Box & Warranty (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          
          {/* What's In The Box */}
          {inBox && inBox.length > 0 && (
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
              <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100">
                <Package className="w-4 h-4 text-blue-600" />
                <h4 className="text-sm font-bold text-slate-900">
                  {language === 'km' ? 'សម្ភារៈក្នុងប្រអប់' : 'In the Box'}
                </h4>
              </div>

              <ul className="space-y-2.5">
                {inBox.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-xs sm:text-sm font-medium text-slate-700"
                  >
                    <span className="text-slate-400 font-mono text-xs">{i + 1}.</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Official Warranty Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200/90">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <h4 className="text-sm font-bold text-slate-900">
                {language === 'km' ? 'ការធានាផ្លូវការរយៈពេល ១ ឆ្នាំ' : '1-Year Official Warranty'}
              </h4>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {warranty ||
                (language === 'km'
                  ? 'រួមបញ្ចូលការធានាពេញលេញរយៈពេល ១២ ខែ តាមរយៈមជ្ឈមណ្ឌលសេវាកម្មផ្លូវការ TechTonic (ផ្លូវ ២៧១ រាជធានីភ្នំពេញ)។'
                  : 'Includes 12 months comprehensive warranty through TechTonic Flagship Service Center (Street 271, Phnom Penh).')}
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
