import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, Trash2, ArrowRight, UserCheck } from 'lucide-react';
import { useCart, useAuth, useToast } from '../../store/StoreContext';
import CartItem from '../../components/cart/CartItem';
import CartSummary from '../../components/cart/CartSummary';
import Button from '../../components/common/Button';

export default function Cart() {
  const { items, updateQuantity, removeFromCart, clearCart, totalItems } = useCart();
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear your entire cart?')) {
      clearCart();
      addToast('Cart cleared', 'info');
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-5 shadow-inner">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
          Your Cart is Empty
        </h1>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-8 leading-relaxed">
          Looks like you haven't added any electronics to your bag yet. Check out our high-efficiency GaN chargers, ANC headphones, or mechanical keyboards.
        </p>
        <Link to="/shop">
          <Button variant="primary" size="lg" className="px-8 shadow-md">
            <span>Explore Electronics</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Shopping Cart
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review your {totalItems} selected {totalItems === 1 ? 'item' : 'items'} before proceeding to secure checkout.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleClearAll}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-600 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Cart</span>
          </button>
        </div>
      </div>

      {/* Sign In Prompt Banner if Guest */}
      {!user && (
        <div className="mb-8 p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-slate-50 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-extrabold text-blue-950 block">
                Have a TechTonic Account?
              </span>
              <span className="text-[11px] text-blue-800">
                Sign in to automatically load your saved addresses, track deliveries, and complete checkout smoothly.
              </span>
            </div>
          </div>
          <Link
            to="/login?redirect=/checkout"
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-white text-blue-600 hover:text-blue-700 text-xs font-bold border border-blue-200/80 shadow-2xs hover:shadow-xs transition-all shrink-0"
          >
            <span>Sign In Now</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Link>
        </div>
      )}

      {/* Main Grid: Left Items List, Right Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Cart Items List */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
          <div className="divide-y divide-slate-100">
            {items.map((item) => (
              <CartItem
                key={`${item.id}-${item.selectedVariant || 'default'}`}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeFromCart}
              />
            ))}
          </div>

          <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>

        {/* Right Column: Cart Summary */}
        <div className="lg:col-span-4 sticky top-28">
          <CartSummary />
        </div>
      </div>
    </div>
  );
}
