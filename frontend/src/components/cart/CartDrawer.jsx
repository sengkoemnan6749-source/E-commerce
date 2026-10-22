import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, ShoppingBag, ArrowRight, Truck } from 'lucide-react';
import { useCart, useAuth, useToast, useLanguage } from '../../store/StoreContext';
import CartItem from './CartItem';
import Button from '../common/Button';
import { formatUSD } from '../../utils/formatPrice';

export default function CartDrawer() {
  const { isDrawerOpen, closeDrawer, items, updateQuantity, removeFromCart, subtotal, totalItems } = useCart();
  const { user } = useAuth();
  const { addToast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isDrawerOpen]);

  if (!isDrawerOpen) return null;

  const handleCheckout = () => {
    closeDrawer();
    if (!user) {
      addToast('Please sign in or register to proceed to checkout', 'info');
      navigate('/login?redirect=/checkout');
    } else {
      navigate('/checkout');
    }
  };

  const handleViewCart = () => {
    closeDrawer();
    navigate('/cart');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={closeDrawer}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">{t('cart_title', 'Your Shopping Cart')}</h2>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {totalItems}
              </span>
            </div>
            <button
              type="button"
              onClick={closeDrawer}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Alert */}
          {items.length > 0 && (
            <div className="bg-blue-50/80 px-5 py-2.5 border-b border-blue-100 text-xs text-blue-900 flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>
                {subtotal >= 100
                  ? t('cart_free_shipping_eligible', 'You qualified for FREE express courier delivery!')
                  : `Add ${formatUSD(100 - subtotal)} ${t('cart_free_shipping_remaining', 'more for free express shipping.')}`}
              </span>
            </div>
          )}

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto px-5 divide-y divide-slate-100">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  {t('cart_empty', 'Your cart is empty')}
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mb-6">
                  {t('cart_empty_desc', 'Looks like you haven\'t added any items yet.')}
                </p>
                <Button variant="primary" size="sm" onClick={() => { closeDrawer(); navigate('/shop'); }}>
                  {t('cart_start_shopping', 'Start Shopping')}
                </Button>
              </div>
            ) : (
              items.map((item) => (
                <CartItem
                  key={`${item.id}-${item.selectedVariant || 'default'}`}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeFromCart}
                />
              ))
            )}
          </div>

          {/* Footer with Subtotal and CTAs */}
          {items.length > 0 && (
            <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 font-medium">
                  {t('cart_subtotal', 'Subtotal')}
                </span>
                <span className="text-lg font-extrabold text-slate-900">{formatUSD(subtotal)}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {t('cart_shipping_calc', 'Taxes, promos, and final delivery calculated at checkout.')}
              </p>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <Button variant="outline" size="md" onClick={handleViewCart}>
                  {t('cart_view_bag', 'View Cart')}
                </Button>
                <Button variant="primary" size="md" onClick={handleCheckout}>
                  <span>{t('cart_checkout', 'Proceed to Checkout')}</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
