import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ShieldCheck, Truck, RotateCcw, Plus, Minus, ShoppingBag, Zap, Heart } from 'lucide-react';
import { formatUSD, formatKHR } from '../../utils/formatPrice';
import { useCart, useWishlist, useToast, useAuth } from '../../store/StoreContext';
import Button from '../common/Button';
import Badge from '../common/Badge';

export default function ProductInfo({
  product,
  selectedVariant: controlledVariant,
  onSelectVariant,
  activeImage
}) {
  const navigate = useNavigate();
  const { addToCart, openDrawer } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToast } = useToast();
  const { user } = useAuth();

  const [internalVariant, setInternalVariant] = useState(
    product.variants?.[0]?.name || 'Standard'
  );
  const selectedVariant = controlledVariant !== undefined ? controlledVariant : internalVariant;

  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  const isFavorited = isInWishlist(product.id);
  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleQuantityChange = (delta) => {
    setQuantity((prev) => Math.max(1, Math.min(prev + delta, product.stock || 10)));
  };

  const handleVariantSelect = (v) => {
    if (onSelectVariant) {
      onSelectVariant(v.name);
    } else {
      setInternalVariant(v.name);
    }
  };

  const handleAddToCart = () => {
    if (product.stock === 0) return;
    setAdding(true);
    addToCart(product, quantity, selectedVariant, activeImage);
    addToast(`Added ${quantity}x "${product.name}" (${selectedVariant}) to cart`, 'success');
    openDrawer();
    setTimeout(() => setAdding(false), 500);
  };

  const handleBuyNow = () => {
    if (product.stock === 0) return;
    addToCart(product, quantity, selectedVariant, activeImage);
    if (!user) {
      addToast('Please sign in or register to proceed to checkout', 'info');
      navigate('/login?redirect=/checkout');
    } else {
      navigate('/checkout');
    }
  };

  return (
    <div className="flex flex-col">
      {/* Category & SKU */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {product.category}
        </span>
        <span className="text-xs text-slate-400 font-mono">
          SKU: {product.sku || `TT-${product.id.toString().padStart(4, '0')}`}
        </span>
      </div>

      {/* Product Title */}
      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
        {product.name}
      </h1>

      {/* Rating & Stock Summary */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-5 pb-5 border-b border-slate-200">
        <div className="flex items-center gap-1.5">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span className="font-bold text-sm text-slate-900">{product.rating}</span>
          <span className="text-xs text-slate-500 font-medium">
            ({product.reviewsCount || 24} reviews)
          </span>
        </div>

        <div className="h-4 w-px bg-slate-200 hidden sm:block" />

        {product.stock > 0 ? (
          <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            In Stock ({product.stock} units)
          </span>
        ) : (
          <span className="text-xs font-semibold text-slate-400">
            Out of Stock
          </span>
        )}
      </div>

      {/* Pricing Block */}
      <div className="mb-6 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
            {formatUSD(product.price)}
          </span>
          {product.originalPrice && (
            <span className="text-lg text-slate-400 line-through font-medium">
              {formatUSD(product.originalPrice)}
            </span>
          )}
          {discountPercent > 0 && (
            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
              Save {discountPercent}%
            </span>
          )}
        </div>
        <div className="mt-1 text-xs font-medium text-slate-500">
          Estimated: <span className="font-semibold text-slate-700">{formatKHR(product.price)}</span> (VAT included)
        </div>
      </div>

      {/* Short Summary Description */}
      <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6">
        {product.description}
      </p>

      {/* Variant Selector */}
      {product.variants && product.variants.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Color / Edition:
            </label>
            <span className="text-xs text-slate-500">
              Selected: <strong className="text-slate-900 font-semibold">{selectedVariant}</strong>
            </span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {product.variants.map((v) => {
              const isSelected = selectedVariant === v.name;
              return (
                <button
                  key={v.name}
                  type="button"
                  onClick={() => handleVariantSelect(v)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border-2 transition-all duration-150 ${
                    isSelected
                      ? 'border-slate-900 bg-slate-900 text-white shadow-sm scale-[1.02]'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                  aria-pressed={isSelected}
                >
                  {v.colorHex && (
                    <span
                      className={`w-3.5 h-3.5 rounded-full border transition-transform flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-white/80 ring-2 ring-slate-400/40' : 'border-slate-300'
                      }`}
                      style={{ backgroundColor: v.colorHex }}
                    >
                      {isSelected && (
                        <span className="w-1 h-1 rounded-full bg-white shadow-xs" />
                      )}
                    </span>
                  )}
                  <span>{v.name}</span>
                  {v.inStock === false && (
                    <span className="text-[10px] text-rose-500 font-medium ml-1">
                      (Out of stock)
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity & Action Buttons */}
      <div className="flex flex-col gap-3.5 mb-8">
        <div className="flex items-center gap-3">
          {/* Quantity Controls */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1 || product.stock === 0}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-12 text-center text-sm font-bold text-slate-900">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => handleQuantityChange(1)}
              disabled={quantity >= (product.stock || 10) || product.stock === 0}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Cart Button */}
          <Button
            variant="primary"
            size="lg"
            className="flex-1"
            disabled={product.stock === 0 || adding}
            onClick={handleAddToCart}
          >
            <ShoppingBag className="w-5 h-5 mr-2" />
            Add to Cart
          </Button>

          {/* Wishlist Button */}
          <button
            type="button"
            onClick={() => {
              toggleWishlist(product);
              if (!isFavorited) addToast('Saved to wishlist', 'info');
            }}
            className={`p-3 rounded-xl border transition-all ${
              isFavorited
                ? 'border-rose-200 bg-rose-50 text-rose-600'
                : 'border-slate-200 bg-white text-slate-600 hover:text-rose-500 hover:border-slate-300'
            }`}
            aria-label="Wishlist"
          >
            <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Buy Now Button */}
        <Button
          variant="secondary"
          size="lg"
          className="w-full bg-slate-900 hover:bg-slate-800 text-white"
          disabled={product.stock === 0}
          onClick={handleBuyNow}
        >
          Buy Now
        </Button>
      </div>

      {/* Brand Value Guarantees */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-slate-200">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
          <Truck className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div className="text-xs">
            <p className="font-bold text-slate-900">Same-Day Express</p>
            <p className="text-slate-500">Phnom Penh & 24h provinces</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
          <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div className="text-xs">
            <p className="font-bold text-slate-900">1-Year Warranty</p>
            <p className="text-slate-500">100% genuine guaranteed</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
          <RotateCcw className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div className="text-xs">
            <p className="font-bold text-slate-900">30-Day Returns</p>
            <p className="text-slate-500">Hassle-free swap or refund</p>
          </div>
        </div>
      </div>
    </div>
  );
}
