import React from 'react';
import { formatUSD, formatKHR } from '../../utils/formatPrice';
import { ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import { productService } from '../../services/productService';

export default function OrderSummary({ items = [], subtotal = 0, shippingFee = 0, discountAmount = 0, total = 0, appliedCoupon = null }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col gap-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-base font-extrabold text-slate-900">Your Order</h3>
        <span className="text-xs font-semibold text-slate-500">
          {items.reduce((acc, i) => acc + i.quantity, 0)} Items
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
                Qty: {item.quantity} {item.selectedVariant ? `• ${item.selectedVariant}` : ''}
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
          <span>Subtotal</span>
          <span className="font-semibold text-slate-900">{formatUSD(subtotal)}</span>
        </div>

        <div className="flex justify-between">
          <span>Express Courier Shipping</span>
          <span className="font-semibold text-slate-900">
            {shippingFee === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : formatUSD(shippingFee)}
          </span>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between text-emerald-600 font-semibold">
            <span>Discount {appliedCoupon ? `(${appliedCoupon.code})` : ''}</span>
            <span>-{formatUSD(discountAmount)}</span>
          </div>
        )}

        <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
          <div>
            <span className="text-sm sm:text-base font-extrabold text-slate-950 block">Total Due</span>
            <span className="text-[10px] text-slate-400">VAT & Delivery included</span>
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
          <span>Official 1-Year TechTonic Cambodia Warranty</span>
        </div>
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>Dispatched from Toul Kork Flagship Hub</span>
        </div>
        <div className="flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>30-Day Money Back Guarantee</span>
        </div>
      </div>
    </div>
  );
}
