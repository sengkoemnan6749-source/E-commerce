import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, ArrowLeft, Trash2, ArrowRight, Star, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useWishlist, useCart, useToast } from '../../store/StoreContext';
import { formatUSD } from '../../utils/formatPrice';
import Button from '../../components/common/Button';

export default function Wishlist() {
  const { wishlist, removeFromWishlist, clearWishlist, moveToCart, moveAllWishlistToCart } = useWishlist();
  const navigate = useNavigate();

  const totalValue = wishlist.reduce((acc, item) => acc + Number(item.price || 0), 0);

  if (wishlist.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-6 shadow-inner border border-rose-100">
          <Heart className="w-10 h-10 fill-rose-200" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-3">
          Your Wishlist is Empty
        </h1>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-8 leading-relaxed">
          You haven't saved any hardware yet. Explore our studio acoustics, titanium wearables, and GaN fast chargers to start curating your setup.
        </p>
        <Link to="/shop">
          <button
            type="button"
            className="inline-flex items-center justify-center font-bold px-8 py-3.5 rounded-xl text-sm bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>Explore Hardware Catalog</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-8 border-b border-slate-200 mb-8 gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/60 text-rose-700 text-xs font-bold uppercase tracking-wider mb-3">
            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
            <span>Saved Hardware</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Your Wishlist
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-xl">
            You have <strong className="text-slate-900">{wishlist.length}</strong> saved {wishlist.length === 1 ? 'item' : 'items'} worth <strong className="text-slate-900">{formatUSD(totalValue)}</strong>. Move them to your cart with one click.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={moveAllWishlistToCart}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 shadow-md shadow-blue-500/20 transition-all transform hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Move All ({wishlist.length}) to Cart</span>
          </button>

          <button
            type="button"
            onClick={clearWishlist}
            className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/80 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Wishlist</span>
          </button>
        </div>
      </div>

      {/* Grid of Wishlist Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {wishlist.map((item) => (
          <div
            key={item.id}
            className="group relative flex flex-col rounded-3xl bg-white border border-slate-200/80 hover:border-blue-400/60 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1"
          >
            {/* Remove button floating at top-right */}
            <button
              type="button"
              onClick={() => removeFromWishlist(item.id)}
              className="absolute top-3 right-3 z-20 p-2 rounded-xl bg-white/90 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200/80 shadow-xs transition-colors backdrop-blur-sm"
              title="Remove from wishlist"
              aria-label="Remove item"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Thumbnail Stage */}
            <Link
              to={`/product/${item.id}`}
              className="relative h-56 w-full bg-slate-50/80 flex items-center justify-center p-6 overflow-hidden border-b border-slate-100"
            >
              <div className="absolute inset-0 bg-radial from-slate-200/40 to-transparent opacity-60 pointer-events-none group-hover:scale-110 transition-transform duration-500" />
              <img
                src={item.image}
                alt={item.name}
                className="relative z-10 max-h-44 max-w-[85%] object-contain drop-shadow-[0_12px_20px_rgba(0,0,0,0.12)] group-hover:scale-108 transition-all duration-500 ease-out"
              />
            </Link>

            {/* Card Content */}
            <div className="p-5 flex flex-col flex-1 justify-between bg-white">
              <div>
                {/* Category & Rating */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                    {item.category || item.categoryName || 'Flagship Hardware'}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span>{item.rating || '4.9'}</span>
                  </div>
                </div>

                {/* Title */}
                <Link
                  to={`/product/${item.id}`}
                  className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors line-clamp-2 leading-snug mb-3 block"
                >
                  {item.name}
                </Link>

                {/* Pricing & Stock */}
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-lg font-black text-slate-900">
                    {formatUSD(item.price)}
                  </span>
                  {item.originalPrice && item.originalPrice > item.price && (
                    <span className="text-xs text-slate-400 line-through">
                      {formatUSD(item.originalPrice)}
                    </span>
                  )}
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 ml-auto">
                    In Stock
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => moveToCart(item)}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Move to Cart</span>
                </button>

                <Link
                  to={`/product/${item.id}`}
                  className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 flex items-center justify-center gap-1 transition-colors"
                >
                  <span>View Specifications</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Continue Shopping */}
      <div className="mt-12 text-center pt-8 border-t border-slate-200">
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Continue Shopping Hardware Catalog</span>
        </Link>
      </div>
    </div>
  );
}
