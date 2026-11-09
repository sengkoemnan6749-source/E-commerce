import React from 'react';
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  QrCode
} from 'lucide-react';
import { useLanguage } from '../../store/StoreContext';

/**
 * Clean, compact e-commerce trust guarantees strip (Apple / Keychron style).
 * Replaces the heavy, oversized AI-template dark container with a lightweight,
 * human-crafted trust bar that puts products first.
 */
export default function WhyChooseUsBento() {
  const { t, language } = useLanguage();

  const benefits = [
    {
      icon: ShieldCheck,
      title: language === 'km' ? 'ការធានាផ្លូវការ ១ ឆ្នាំ' : '1-Year Official Warranty',
      desc: language === 'km'
        ? 'ធានាផ្ទាល់ពីរោងចក្រ និងសេវាកម្មជួសជុលនៅសាខាទួលគោក។'
        : 'Official factory warranty with walk-in service at Toul Kork store.',
    },
    {
      icon: Truck,
      title: language === 'km' ? 'ដឹកជញ្ជូនរហ័សក្នុងថ្ងៃតែមួយ' : 'Same-Day Fast Dispatch',
      desc: language === 'km'
        ? 'ដឹកតាម GrabExpress ក្នុងភ្នំពេញ និង ២៥ ខេត្តក្រុងតាម VET។'
        : 'Delivered via GrabExpress in Phnom Penh and nationwide via VET.',
    },
    {
      icon: RotateCcw,
      title: language === 'km' ? 'ប្តូរទំនិញងាយស្រួល ៣០ ថ្ងៃ' : '30-Day Easy Exchanges',
      desc: language === 'km'
        ? 'មិនពេញចិត្តកុងតាក់ ឬទំហំកាស? ប្តូរបានដោយមិនគិតសេវាបន្ថែម។'
        : 'Not satisfied with switch feel or fit? Exchange with 0% fee.',
    },
    {
      icon: QrCode,
      title: language === 'km' ? 'ទូទាត់រហ័សតាម Bakong KHQR' : 'Bakong KHQR & Cards',
      desc: language === 'km'
        ? 'ស្កេនទូទាត់ជាមួយ ABA, Wing, ACLEDA ឬកាតឥណទានសុវត្ថិភាព។'
        : 'Instant scan with ABA Mobile, Wing, ACLEDA, or Credit Cards.',
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full my-2">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-7 shadow-xs transition-all">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 divide-y sm:divide-y-0 lg:divide-x divide-slate-100">
          {benefits.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className={`flex items-start gap-3.5 ${
                  idx > 0 ? 'pt-4 sm:pt-0 lg:pl-6' : ''
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-700 shrink-0 mt-0.5">
                  <Icon className="w-4.5 h-4.5 text-slate-700" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 tracking-tight mb-0.5">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
