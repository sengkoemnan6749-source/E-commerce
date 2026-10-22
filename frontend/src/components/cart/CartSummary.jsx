import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Tag, ShieldCheck, Truck, Check } from 'lucide-react';
import { formatUSD, formatKHR } from '../../utils/formatPrice';
import { useCart, useAuth, useToast } from '../../store/StoreContext';
import Button from '../common/Button';

export default function CartSummary({ showCheckoutButton = true, onCheckout }) {
  const {
    subtotal,
    discountAmount,
    shippingFee,
    total,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    items
  } = useCart();
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState('');
  const [applying, setApplying] = useState(false);

  const handleApply = (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setApplying(true);
    const res = applyCoupon(couponCode);
    setApplying(false);
    if (res.success) {
      addToast(res.message, 'success');
      setCouponCode('');
    } else {
      addToast(res.message, 'error');
    }
  };

  const handleProceed = () => {
    if (!user) {
      addToast('Please sign in or register to proceed to checkout', 'info');
      navigate('/login?redirect=/checkout');
      return;
    }
    if (onCheckout) {
      onCheckout();
    } else {
      navigate('/checkout');
    }
  };

  const freeShippingThreshold = 100;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingProgress = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm flex flex-col gap-5">
      <h3 className="text-base sm:text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-3">
        Order Summary
      </h3>

      {/* Free Shipping Progress bar */}
      <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100">
        <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
          <span className="text-blue-950 flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-blue-600" />
            {remainingForFreeShipping === 0
              ? 'Congratulations! You unlocked FREE express delivery'
              : `Add ${formatUSD(remainingForFreeShipping)} more for FREE Express delivery`}
          </span>
        </div>
        <div className="h-2 w-full bg-blue-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${freeShippingProgress}%` }}
          />
        </div>
      </div>

      {/* Price breakdown */}
      <div className="space-y-3 text-sm text-slate-600">
        <div className="flex justify-between items-center">
          <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
          <span className="font-semibold text-slate-900">{formatUSD(subtotal)}</span>
        </div>

        <div className="flex justify-between items-center">
          <span>Estimated Shipping</span>
          <span className="font-semibold text-slate-900">
            {shippingFee === 0 ? (
              <span className="text-emerald-600 font-bold">FREE</span>
            ) : (
              formatUSD(shippingFee)
            )}
          </span>
        </div>

        {appliedCoupon && (
          <div className="flex justify-between items-center text-emerald-600 font-semibold bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
            <div className="flex items-center gap-1.5 text-xs">
              <Tag className="w-3.5 h-3.5" />
              <span>Promo ({appliedCoupon.code})</span>
            </div>
            <div className="flex items-center gap-2">
              <span>-{formatUSD(discountAmount)}</span>
              <button
                type="button"
                onClick={() => {
                  removeCoupon();
                  addToast('Coupon removed', 'info');
                }}
                className="text-[10px] text-emerald-700 underline hover:text-emerald-900"
              >
                Remove
              </button>
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
          <div>
            <span className="text-base font-extrabold text-slate-950 block">Total</span>
            <span className="text-[11px] text-slate-400">Includes all taxes and duties</span>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-slate-950 tracking-tight block">
              {formatUSD(total)}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {formatKHR(total)}
            </span>
          </div>
        </div>
      </div>

      {/* Coupon Form */}
      {!appliedCoupon && (
        <form onSubmit={handleApply} className="pt-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
            Discount Code
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Try TECH10 or SAVE5"
                className="w-full uppercase rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono font-bold text-slate-800 placeholder:normal-case placeholder:font-sans placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              loading={applying}
              disabled={!couponCode.trim()}
            >
              Apply
            </Button>
          </div>
        </form>
      )}

      {/* Checkout Button */}
      {showCheckoutButton && (
        <div className="space-y-3 pt-2">
          <Button
            variant="primary"
            size="lg"
            className="w-full shadow-md shadow-blue-500/10"
            disabled={items.length === 0}
            onClick={handleProceed}
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <Link
            to="/shop"
            className="block text-center text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
          >
            Or Continue Shopping
          </Link>
        </div>
      )}

      {/* Trust Seal */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>256-bit SSL encrypted checkout</span>
      </div>
    </div>
  );
}
