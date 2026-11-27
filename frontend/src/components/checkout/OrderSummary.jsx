import React, { useState } from 'react';
import { formatUSD, formatKHR } from '../../utils/formatPrice';
import { ShieldCheck, Truck, RotateCcw, Tag } from 'lucide-react';
import { productService } from '../../services/productService';
import { useLanguage, useCart, useToast } from '../../store/StoreContext';
import PromoVouchersList from './PromoVouchersList';

export default function OrderSummary({ items = [], subtotal = 0, shippingFee = 0, discountAmount = 0, total = 0, appliedCoupon = null }) {
  const { language } = useLanguage();
  const { applyCoupon, removeCoupon } = useCart();
  const { addToast } = useToast();
  const [promoInput, setPromoInput] = useState('');
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [promoError, setPromoError] = useState('');

  const handleApplyPromo = async (codeToApply) => {
    const clean = String(codeToApply || promoInput || '').trim();
    if (!clean) return;
    setApplyingPromo(true);
    setPromoError('');
    try {
      const res = await applyCoupon(clean);
      if (res?.success) {
        addToast(res.message, 'success');
        setPromoInput('');
      } else {
        const msg = res?.message || (language === 'km' ? 'កូដប្រូម៉ូសិនមិនត្រឹមត្រូវទេ។' : 'Invalid promo code.');
        setPromoError(msg);
        addToast(msg, 'error');
      }
    } finally {
      setApplyingPromo(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col gap-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-base font-extrabold text-slate-900">
          {language === 'km' ? 'ការកុម្ម៉ង់របស់អ្នក' : 'Your Order'}
        </h3>
        <span className="text-xs font-semibold text-slate-500">
          {items.reduce((acc, i) => acc + i.quantity, 0)} {language === 'km' ? 'មុខទំនិញ' : 'Items'}
        </span>
      </div>

      {/* Item list */}
      <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
        {items.map((item) => {
          const cleanImg = productService.getCleanProductImage(item, item.selectedVariant || item.variant);
          return (
            <div key={`${item.id}-${item.selectedVariant || 'default'}`} className="py-3 flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100/70 border border-slate-200/80 flex-shrink-0 flex items-center justify-center p-1">
                <img src={cleanImg} alt={item.name} className="w-full h-full object-contain" />
              </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-slate-900 truncate">{item.name}</h4>
              <p className="text-[11px] text-slate-500">
                {language === 'km' ? 'ចំនួន៖' : 'Qty:'} {item.quantity} {item.selectedVariant ? `• ${item.selectedVariant}` : ''}
              </p>
            </div>
            <div className="text-right text-xs font-extrabold text-slate-900">
              {formatUSD(item.price * item.quantity)}
            </div>
          </div>
        );
      })}
    </div>

      {/* Price breakdown */}
      <div className="space-y-2.5 pt-3 border-t border-slate-100 text-xs sm:text-sm text-slate-600">
        <div className="flex justify-between">
          <span>{language === 'km' ? 'តម្លៃទំនិញសរុប' : 'Subtotal'}</span>
          <span className="font-semibold text-slate-900">{formatUSD(subtotal)}</span>
        </div>

        <div className="flex justify-between">
          <span>{language === 'km' ? 'ថ្លៃដឹកជញ្ជូនរហ័ស' : 'Express Courier Shipping'}</span>
          <span className="font-semibold text-slate-900">
            {shippingFee === 0 ? (
              <span className="text-emerald-600 font-bold">
                {language === 'km' ? 'ឥតគិតថ្លៃ' : 'FREE'}
              </span>
            ) : (
              formatUSD(shippingFee)
            )}
          </span>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between items-center text-emerald-600 font-semibold">
            <span className="inline-flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              {language === 'km' ? 'បញ្ចុះតម្លៃ' : 'Discount'} {appliedCoupon ? `(${appliedCoupon.code})` : ''}
            </span>
            <div className="flex items-center gap-2">
              <span>-{formatUSD(discountAmount)}</span>
              {appliedCoupon && (
                <button
                  type="button"
                  onClick={() => {
                    removeCoupon();
                    addToast(language === 'km' ? 'បានដកកូដបញ្ចុះតម្លៃ' : 'Promo removed', 'info');
                  }}
                  className="text-[10px] underline text-slate-400 hover:text-rose-600 cursor-pointer"
                >
                  {language === 'km' ? 'ដកចេញ' : 'Remove'}
                </button>
              )}
            </div>
          </div>
        )}

        {!appliedCoupon && (
          <div className="pt-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={promoInput}
                onChange={(e) => {
                  setPromoInput(e.target.value.toUpperCase());
                  if (promoError) setPromoError('');
                }}
                placeholder={language === 'km' ? 'បញ្ចូលកូដប្រូម៉ូសិន...' : 'Promo code...'}
                className="flex-1 uppercase rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-mono font-bold text-slate-800 placeholder:normal-case placeholder:font-sans placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                type="button"
                disabled={applyingPromo || !promoInput.trim()}
                onClick={() => handleApplyPromo(promoInput)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold disabled:opacity-40 cursor-pointer"
              >
                {language === 'km' ? 'ប្រើកូដ' : 'Apply'}
              </button>
            </div>
            {promoError && (
              <p className="mt-1.5 text-[11px] font-semibold text-rose-600">{promoError}</p>
            )}
            <PromoVouchersList
              subtotal={subtotal}
              applying={applyingPromo}
              onSelectPromo={(promo) => handleApplyPromo(promo.code)}
            />
          </div>
        )}

        <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
          <div>
            <span className="text-sm sm:text-base font-extrabold text-slate-950 block">
              {language === 'km' ? 'សរុបត្រូវទូទាត់' : 'Total Due'}
            </span>
            <span className="text-[10px] text-slate-400">
              {language === 'km' ? 'រួមបញ្ចូលពន្ធ VAT និងថ្លៃដឹកជញ្ជូន' : 'VAT & Delivery included'}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight block">
              {formatUSD(total)}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {formatKHR(total)}
            </span>
          </div>
        </div>
      </div>

      {/* Trust Guarantee Box */}
      <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>
            {language === 'km'
              ? 'ការធានាផ្លូវការ ១ ឆ្នាំពី TechTonic កម្ពុជា'
              : 'Official 1-Year TechTonic Cambodia Warranty'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>
            {language === 'km'
              ? 'ដឹកជញ្ជូនចេញពីមជ្ឈមណ្ឌលទួលគោក'
              : 'Dispatched from Toul Kork Flagship Hub'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>
            {language === 'km' ? 'ធានាសងប្រាក់វិញក្នុងរយៈពេល ៣០ ថ្ងៃ' : '30-Day Money Back Guarantee'}
          </span>
        </div>
      </div>
    </div>
  );
}
