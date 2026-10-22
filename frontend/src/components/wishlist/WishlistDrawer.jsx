import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Heart, ShoppingBag, ArrowRight, Trash2, CheckCircle2, Sparkles } from 'lucide-react';
import { useWishlist, useCart } from '../../store/StoreContext';
import { formatUSD } from '../../utils/formatPrice';
import Button from '../common/Button';

export default function WishlistDrawer() {
  const {
    isWishlistDrawerOpen,
    closeWishlistDrawer,
    wishlist,
    removeFromWishlist,
    moveToCart,
    moveAllWishlistToCart,
    clearWishlist
  } = useWishlist();

  const navigate = useNavigate();

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isWishlistDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isWishlistDrawerOpen]);

  if (!isWishlistDrawerOpen) return null;

  const totalWishlistValue = wishlist.reduce((acc, item) => acc + Number(item.price || 0), 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={closeWishlistDrawer}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200/60 text-rose-600 flex items-center justify-center">
                <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 leading-tight">Your Wishlist</h2>
                <p className="text-[11px] font-medium text-slate-500">
                  {wishlist.length} saved {wishlist.length === 1 ? 'item' : 'items'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeWishlistDrawer}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Close Wishlist"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action Bar when wishlist has items */}
          {wishlist.length > 0 && (
            <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">
                Total Value: <strong className="text-slate-900">{formatUSD(totalWishlistValue)}</strong>
              </span>
              <button
                type="button"
                onClick={clearWishlist}
                className="text-slate-400 hover:text-rose-600 transition-colors font-medium flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            </div>
          )}

          {/* Items List */}
          <div className="flex-1 overflow-y-auto px-6 divide-y divide-slate-100">
            {wishlist.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-4 shadow-inner">
                  <Heart className="w-8 h-8 fill-rose-100" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mb-1">Your wishlist is empty</h3>
                <p className="text-xs text-slate-500 max-w-xs mb-6 leading-relaxed">
                  Save your favorite hardware units to keep track of stock, special pricing, and quick access.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    closeWishlistDrawer();
                    navigate('/shop');
                  }}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white shadow-md transition-all"
                >
                  Explore Hardware Catalog
                </button>
              </div>
            ) : (
              wishlist.map((item) => (
                <div key={item.id} className="py-4.5 flex gap-4 items-start group">
                  {/* Thumbnail */}
                  <Link
                    to={`/product/${item.id}`}
                    onClick={closeWishlistDrawer}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-100/70 border border-slate-200/80 flex-shrink-0 flex items-center justify-center p-1.5 hover:border-blue-400 transition-colors shadow-2xs group-hover:scale-102"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-contain drop-shadow-xs"
                    />
                  </Link>

                  {/* Info & Action */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          to={`/product/${item.id}`}
                          onClick={closeWishlistDrawer}
                          className="text-xs sm:text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors line-clamp-1"
                        >
                          {item.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeFromWishlist(item.id)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                          title="Remove from wishlist"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-black text-slate-900">
                          {formatUSD(item.price)}
                        </span>
                        {item.originalPrice && item.originalPrice > item.price && (
                          <span className="text-[10px] text-slate-400 line-through">
                            {formatUSD(item.originalPrice)}
                          </span>
                        )}
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                          In Stock
                        </span>
                      </div>
                    </div>

                    {/* Move to Cart button */}
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => moveToCart(item)}
                        className="w-full py-1.5 px-3 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Move to Cart</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer actions */}
          {wishlist.length > 0 && (
            <div className="p-6 border-t border-slate-100 bg-slate-50/70 space-y-3">
              <button
                type="button"
                onClick={moveAllWishlistToCart}
                className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Move All ({wishlist.length}) to Cart</span>
              </button>

              <Link
                to="/wishlist"
                onClick={closeWishlistDrawer}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 shadow-2xs flex items-center justify-center gap-1.5 transition-all"
              >
                <span>View Full Wishlist Page</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
