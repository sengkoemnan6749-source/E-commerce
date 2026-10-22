import React, { useState } from 'react';
import {
  CheckCircle2,
  ShieldCheck,
  Box,
  Monitor,
  Activity,
  BatteryCharging,
  Droplets,
  Wifi,
  Headphones,
  Sparkles,
  Zap,
  Scale,
  Cpu,
  Layers,
  Radio,
  FileText,
  Package,
  Award,
  Sliders,
  Check,
  ExternalLink
} from 'lucide-react';

// Intelligent Icon & Category Selector for Technical Specs
const getSpecIcon = (key = '') => {
  const lower = key.toLowerCase();
  if (lower.includes('display') || lower.includes('screen') || lower.includes('resolution')) {
    return { icon: Monitor, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' };
  }
  if (lower.includes('sensor') || lower.includes('health') || lower.includes('hr') || lower.includes('spo2')) {
    return { icon: Activity, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' };
  }
  if (lower.includes('battery') || lower.includes('playback') || lower.includes('power')) {
    return { icon: BatteryCharging, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' };
  }
  if (lower.includes('water') || lower.includes('atm') || lower.includes('ip') || lower.includes('splash')) {
    return { icon: Droplets, color: 'text-cyan-600', bg: 'bg-cyan-50 border-cyan-200' };
  }
  if (lower.includes('connect') || lower.includes('bluetooth') || lower.includes('wifi') || lower.includes('wireless')) {
    return { icon: Wifi, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' };
  }
  if (lower.includes('driver') || lower.includes('audio') || lower.includes('sound') || lower.includes('frequency')) {
    return { icon: Headphones, color: 'text-violet-600', bg: 'bg-violet-50 border-violet-200' };
  }
  if (lower.includes('noise') || lower.includes('anc') || lower.includes('cancel')) {
    return { icon: Sparkles, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' };
  }
  if (lower.includes('charge') || lower.includes('fast charge') || lower.includes('gan') || lower.includes('watt')) {
    return { icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' };
  }
  if (lower.includes('weight') || lower.includes('dimension') || lower.includes('mass')) {
    return { icon: Scale, color: 'text-slate-600', bg: 'bg-slate-100 border-slate-200' };
  }
  if (lower.includes('codec') || lower.includes('format')) {
    return { icon: Layers, color: 'text-sky-600', bg: 'bg-sky-50 border-sky-200' };
  }
  if (lower.includes('material') || lower.includes('build') || lower.includes('finish') || lower.includes('frame')) {
    return { icon: Cpu, color: 'text-teal-600', bg: 'bg-teal-50 border-teal-200' };
  }
  return { icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' };
};

// Formatter to detect sub-attributes / pills (e.g. "1000 nits Peak", "5 ATM", "Swim-Proof")
const renderSpecValue = (value) => {
  if (typeof value !== 'string') return String(value);

  // If the value contains commas or slashes, we can present it with clean contrast
  const parts = value.split(/,\s*/);
  if (parts.length > 1) {
    return (
      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
        <span className="font-bold text-slate-900 text-sm leading-snug">{parts[0]}</span>
        {parts.slice(1).map((part, i) => (
          <span
            key={i}
            className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/80"
          >
            {part}
          </span>
        ))}
      </div>
    );
  }

  return <span className="font-bold text-slate-900 text-sm leading-snug">{value}</span>;
};

export default function ProductSpecs({ specs = {}, inBox = [], warranty = '' }) {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const specEntries = Object.entries(specs);

  // Extract key quick highlight metrics
  const quickHighlights = specEntries.slice(0, 3).map(([key, val]) => ({
    key,
    val,
    ...getSpecIcon(key)
  }));

  return (
    <div className="space-y-8">
      {/* Quick-Glance Top Metrics Banner */}
      {quickHighlights.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickHighlights.map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-gradient-to-br from-white to-slate-50 border border-slate-200/90 shadow-2xs hover:shadow-sm hover:border-blue-300 transition-all flex items-center gap-3.5 group"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${item.bg} ${item.color} shrink-0 group-hover:scale-105 transition-transform`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block truncate">
                    {item.key}
                  </span>
                  <span className="text-xs sm:text-sm font-black text-slate-900 block truncate mt-0.5">
                    {item.val}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Grid: Left Specifications & Right Package Manifest */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Tech Specs Cards (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Hardware Specifications</span>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                  {specEntries.length} Parameters
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Verified laboratory test measurements and engineering characteristics.
              </p>
            </div>

            {/* View Mode Toggle Switcher */}
            <div className="hidden sm:flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/80 text-xs font-bold">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Card View
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Table View
              </button>
            </div>
          </div>

          {specEntries.length > 0 ? (
            viewMode === 'grid' ? (
              /* MODERN SPEC CARDS GRID (Easy View & High Scanability) */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                {specEntries.map(([key, value]) => {
                  const { icon: SpecIcon, color, bg } = getSpecIcon(key);
                  return (
                    <div
                      key={key}
                      className="group p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-400/80 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                    >
                      <div className="flex items-center gap-3 mb-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${bg} ${color} shrink-0 group-hover:scale-105 transition-transform`}>
                          <SpecIcon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          {key}
                        </span>
                      </div>
                      <div className="pl-1">
                        {renderSpecValue(value)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* CLEAN CONTRAST TABLE VIEW */
              <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
                <table className="w-full text-left text-sm border-collapse">
                  <tbody>
                    {specEntries.map(([key, value], idx) => {
                      const { icon: SpecIcon, color, bg } = getSpecIcon(key);
                      return (
                        <tr
                          key={key}
                          className={`border-b border-slate-100 last:border-b-0 hover:bg-blue-50/30 transition-colors ${
                            idx % 2 === 0 ? 'bg-slate-50/40' : 'bg-white'
                          }`}
                        >
                          <td className="py-3.5 px-4 font-bold text-slate-700 w-2/5 text-xs sm:text-sm">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-6 h-6 rounded-lg flex items-center justify-center border ${bg} ${color} shrink-0`}>
                                <SpecIcon className="w-3.5 h-3.5" />
                              </div>
                              <span>{key}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-900 text-xs sm:text-sm font-semibold">
                            {renderSpecValue(value)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <p className="text-sm text-slate-500 py-6 text-center bg-slate-50 rounded-2xl border border-slate-200">
              Standard hardware architecture applies to this model.
            </p>
          )}
        </div>

        {/* Right Column: Package Manifest & Official Warranty (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          
          {/* What's In The Box Manifest */}
          {inBox && inBox.length > 0 && (
            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 leading-tight">Package Manifest</h4>
                    <span className="text-[11px] text-slate-400 font-medium">Standard Factory Seal</span>
                  </div>
                </div>
                <span className="text-[11px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {inBox.length} Items
                </span>
              </div>

              <ul className="space-y-3">
                {inBox.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors"
                  >
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-extrabold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 font-medium text-emerald-600">
                  <Check className="w-3.5 h-3.5" />
                  Tamper-Evident Tape
                </span>
                <span>QC Passed #412</span>
              </div>
            </div>
          )}

          {/* Official Warranty Support Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-blue-50/90 via-indigo-50/50 to-white border border-blue-200/90 shadow-sm relative overflow-hidden">
            {/* Subtle background shield glow */}
            <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-blue-600/10 rounded-full blur-xl pointer-events-none" />

            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-blue-950 leading-tight">
                  Official Warranty Support
                </h4>
                <span className="text-[11px] font-bold text-blue-600">
                  Serialized Coverage
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              {warranty ||
                'Includes 12 months comprehensive hardware replacement guarantee through TechTonic Flagship Service Center (Street 271, Phnom Penh).'}
            </p>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-700 bg-white/90 p-2 rounded-xl border border-blue-100 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Zero-Cost Component Replacement</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-700 bg-white/90 p-2 rounded-xl border border-blue-100 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Direct Walk-in Service Center</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-blue-100/80 flex items-center justify-between text-[11px]">
              <span className="font-extrabold text-blue-700">Anti-Counterfeit NFC Tag</span>
              <span className="font-semibold text-slate-400">Valid Worldwide</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
