import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, Heart, ShoppingBag, Check, Eye } from 'lucide-react';
import { formatUSD } from '../../utils/formatPrice';
import { useCart, useWishlist, useToast, useLanguage } from '../../store/StoreContext';
import { translateCategory, translateSubcategory, translateBadge, translateProductField } from '../../utils/translations';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToast } = useToast();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [added, setAdded] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);

  // Sync state if product changes
  useEffect(() => {
    setSelectedVariant(null);
  }, [product.id]);

  const isFavorited = isInWishlist(product.id);
  const discountPercent =
    Number(product.originalPrice) > Number(product.price)
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  const withVersion = (url) => {
    if (!url || typeof url !== 'string') return url;
    return url.includes('?') ? url : `${url}?v=20`;
  };

  // Determine primary image
  const basePrimary = selectedVariant?.image || product.image || (product.images && product.images[0]) || '/images/products/prod-001-main.png';
  const primaryImg = withVersion(basePrimary);

  // Alternate hover image: if primary is images[0], hover to images[1]; if primary is images[1] or another, hover to images[0]
  let rawSecondary = null;
  if (product.images && product.images.length > 1) {
    if (basePrimary === product.images[0]) {
      rawSecondary = product.images[1];
    } else {
      rawSecondary = product.images[0];
    }
  }
  const secondaryImg = (rawSecondary && rawSecondary !== basePrimary) ? withVersion(rawSecondary) : null;
  const hasSecondary = Boolean(secondaryImg);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock === 0) return;

    addToCart(product, 1, selectedVariant?.name || product.variants?.[0]?.name || null);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <div className="group relative flex flex-col rounded-[28px] p-[1.25px] bg-gradient-to-b from-slate-200/95 via-slate-200/55 to-slate-300/75 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_28px_-14px_rgba(15,23,42,0.10)] hover:shadow-[0_2px_6px_rgba(15,23,42,0.05),0_26px_54px_-18px_rgba(15,23,42,0.18),0_14px_30px_-14px_rgba(37,99,235,0.14)] hover:-translate-y-1.5 transition-all duration-300">
      {/* Precision Hover Bezel Glow */}
      <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-gradient-to-br from-sky-400/65 via-blue-500/35 to-indigo-500/65 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Inner White Card Body */}
      <div className="relative flex flex-col flex-1 bg-white rounded-[26.75px] overflow-hidden ring-1 ring-inset ring-white/90">
        {/* Top Image Studio Container inside Inset Frame */}
        <div className="p-2.5 pb-0">
          <div className="relative aspect-square w-full rounded-[20px] bg-gradient-to-b from-[#f6f8fc] via-slate-50/70 to-white overflow-hidden p-5 flex items-center justify-center ring-1 ring-inset ring-slate-900/[0.05] group-hover:ring-blue-500/[0.12] transition-all duration-300">
        <Link
          to={`/product/${product.id}`}
          className="block w-full h-full relative flex items-center justify-center"
        >
          {/* Primary Main Image */}
          <img
            src={primaryImg}
            alt={product.name}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/images/products/prod-001-main.png';
            }}
            className={`w-full h-full object-contain object-center transition-all duration-500 ease-out filter drop-shadow-[0_12px_20px_rgba(0,0,0,0.08)] group-hover:scale-105 ${
              hasSecondary
                ? 'group-hover:opacity-0 group-hover:pointer-events-none'
                : ''
            }`}
            loading="lazy"
          />

          {/* Secondary Alternate Image (Smooth Hover Crossfade) */}
          {hasSecondary && (
            <img
              src={secondaryImg}
              alt={`${product.name} alternate view`}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
              className="absolute inset-0 w-full h-full object-contain object-center opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 ease-out filter drop-shadow-[0_16px_28px_rgba(37,99,235,0.18)] pointer-events-none"
              loading="lazy"
            />
          )}
        </Link>

        {/* Floating Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10 max-w-[70%] pointer-events-none">
          {discountPercent > 0 && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-bold bg-rose-600 text-white">
              -{discountPercent}%
            </span>
          )}
          {product.badge && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-slate-900 text-white">
              {translateBadge(product.badge, language)}
            </span>
          )}
          {product.stock <= 5 && product.stock > 0 && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-amber-600 text-white">
              {language === 'km' ? `សល់តែ ${product.stock} ទៀត` : `Only ${product.stock} left`}
            </span>
          )}
          {product.stock === 0 && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-500 text-white">
              {t('card_sold_out')}
            </span>
          )}
        </div>

        {/* Floating Quick Action Buttons */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
          <button
            type="button"
            onClick={handleWishlist}
            aria-label={isFavorited ? 'Remove from wishlist' : 'Add to wishlist'}
            className={`w-9 h-9 rounded-full backdrop-blur-md transition-all duration-200 flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 ${
              isFavorited
                ? 'bg-rose-50 text-rose-600 border border-rose-200'
                : 'bg-white/90 text-slate-500 hover:text-rose-500 hover:bg-white border border-slate-200/80'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => navigate(`/product/${product.id}`)}
            aria-label="Quick view"
            className="w-9 h-9 rounded-full bg-white/90 text-slate-500 hover:text-blue-600 hover:bg-white border border-slate-200/80 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-sm hidden sm:flex items-center justify-center hover:scale-110 active:scale-95"
          >
            <Eye className="w-4 h-4" />
          </button>
          </div>
        </div>
        </div>

      {/* Product Content Details */}
      <div className="flex flex-col flex-1 p-4 sm:p-5 pt-3.5">
        
        {/* Category & Rating */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span
            className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50/80 px-2 py-0.5 rounded-md truncate max-w-[170px]"
            title={product.subcategory ? translateSubcategory(product.subcategory, language) : translateCategory(product.categoryName || product.category, language)}
          >
            {product.subcategory
              ? translateSubcategory(product.subcategory, language)
              : translateCategory(product.categoryName || product.category, language)}
          </span>
          <div className="flex items-center gap-1 text-slate-700 text-xs font-semibold">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{Number(product.rating) > 0 ? Number(product.rating).toFixed(1) : '4.9'}</span>
            <span className="text-[11px] text-slate-400 font-normal">({product.reviewsCount || 24})</span>
          </div>
        </div>

        {/* Product Title */}
        <Link
          to={`/product/${product.id}`}
          className="font-extrabold text-slate-900 hover:text-blue-600 transition-colors line-clamp-1 text-base tracking-tight mb-1"
          title={product.name}
        >
          {product.name}
        </Link>

        {/* Short Specs / Subtitle */}
        <p className="text-xs text-slate-500 line-clamp-1 mb-2">
          {translateProductField(product, 'tagline', language) || translateProductField(product, 'description', language)}
        </p>

        {/* Interactive Color Finishes Swatches */}
        {product.variants && product.variants.length > 1 && (
          <div className="flex items-center gap-1.5 mb-3">
            {product.variants.slice(0, 4).map((v) => {
              const isSelected = selectedVariant?.name === v.name;
              return (
                <button
                  key={v.name}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedVariant(isSelected ? null : v);
                  }}
                  onMouseEnter={() => setSelectedVariant(v)}
                  className={`w-3.5 h-3.5 rounded-full border border-white shadow-xs transition-all duration-150 hover:scale-125 ${
                    isSelected ? 'ring-2 ring-blue-600 scale-110' : 'ring-1 ring-slate-200'
                  }`}
                  style={{ backgroundColor: v.colorHex || '#94a3b8' }}
                  title={v.name}
                  aria-label={`Select ${v.name}`}
                />
              );
            })}
            {product.variants.length > 4 && (
              <span className="text-[10px] text-slate-400 font-bold">
                +{product.variants.length - 4}
              </span>
            )}
            <span className="text-[10px] text-slate-400 font-medium ml-1">
              {selectedVariant ? selectedVariant.name : `${product.variants.length} ${t('card_finishes')}`}
            </span>
          </div>
        )}

        {/* Pricing & Add to Cart Action Row */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 mt-auto">
          <div className="flex flex-col min-w-0">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-lg sm:text-xl font-black text-slate-950 tracking-tight">
                {formatUSD(product.price)}
              </span>
              {Number(product.originalPrice) > Number(product.price) && (
                <span className="text-xs text-slate-400 line-through font-medium">
                  {formatUSD(product.originalPrice)}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              {product.stock > 0 ? t('label_in_stock') : t('label_out_of_stock')}
            </span>
          </div>

          <button
            type="button"
            disabled={product.stock === 0}
            onClick={handleAddToCart}
            className={`flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 shadow-sm active:scale-95 shrink-0 ${
              product.stock === 0
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : added
                ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                : 'bg-slate-900 hover:bg-blue-600 text-white shadow-slate-900/10 hover:shadow-blue-500/25'
            }`}
          >
            {added ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>{t('card_added')}</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{t('card_add')}</span>
              </>
            )}
          </button>
        </div>

      </div>
      </div>
    </div>
  );
}
