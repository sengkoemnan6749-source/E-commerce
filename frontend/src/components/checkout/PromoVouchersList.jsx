import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { formatUSD } from '../../utils/formatPrice';
import { useLanguage } from '../../store/StoreContext';

export default function PromoVouchersList({ subtotal = 0, onSelectPromo, applying = false }) {
  const { language } = useLanguage();
  const [promos, setPromos] = useState([]);

  useEffect(() => {
    let active = true;
    api
      .get('/promos/active')
      .then((res) => {
        if (active && Array.isArray(res?.data)) {
          setPromos(res.data);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (promos.length === 0) return null;

  return (
    <div className="mt-3 space-y-1.5">
      <div className="text-[11px] font-semibold text-slate-500">
        {language === 'km' ? 'កូដបញ្ចុះតម្លៃ' : 'Available codes'}
      </div>

      <div className="flex flex-col gap-1.5">
        {promos.map((promo) => {
          const minSub = Number(promo.minSubtotal || 0);
          const belowMin = minSub > 0 && subtotal < minSub;
          const discountLabel =
            promo.type === 'percentage'
              ? `${promo.value}% off`
              : `${formatUSD(promo.value)} off`;

          return (
            <button
              key={promo.code}
              type="button"
              disabled={applying}
              onClick={() => onSelectPromo && onSelectPromo(promo)}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl border text-left transition-colors cursor-pointer disabled:opacity-50 ${
                belowMin
                  ? 'bg-slate-50/70 border-slate-200 text-slate-400 hover:border-slate-300'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80 hover:border-slate-300 text-slate-800'
              }`}
            >
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
                <span className="font-mono text-xs font-bold text-slate-900 tracking-wide shrink-0">
                  {promo.code}
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-xs font-bold text-red-600">
                  {discountLabel}
                  {minSub > 0 && (
                    <span className="font-normal text-slate-500">
                      {' '}({language === 'km' ? 'ទិញយ៉ាងតិច' : 'min'} {formatUSD(minSub)})
                    </span>
                  )}
                </span>
              </div>

              <span className="text-[11px] font-semibold text-blue-600 shrink-0">
                {language === 'km' ? 'ប្រើកូដ' : 'Apply'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
