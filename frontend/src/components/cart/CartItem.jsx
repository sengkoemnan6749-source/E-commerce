import React from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { formatUSD } from '../../utils/formatPrice';
import { productService } from '../../services/productService';
import { useLanguage } from '../../store/StoreContext';

export default function CartItem({ item, onUpdateQuantity, onRemove }) {
  const { t } = useLanguage();
  const cleanImg = productService.getCleanProductImage(item, item.selectedVariant || item.variant);

  return (
    <div className="flex gap-3 sm:gap-4 py-4 border-b border-slate-100 last:border-b-0 items-start">
      {/* Thumbnail */}
      <Link
        to={`/product/${item.id}`}
        className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-100/70 border border-slate-200/80 flex-shrink-0 flex items-center justify-center p-1.5 hover:border-blue-400 transition-colors"
      >
        <img
          src={cleanImg}
          alt={item.name}
          className="w-full h-full object-contain drop-shadow-xs"
        />
      </Link>

      {/* Info & Controls */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-start justify-between gap-2">
          <Link
            to={`/product/${item.id}`}
            className="text-xs sm:text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors line-clamp-1"
          >
            {item.name}
          </Link>
          <button
            type="button"
            onClick={() => onRemove(item.id, item.selectedVariant)}
            className="text-slate-400 hover:text-rose-600 transition-colors p-1"
            aria-label="Remove item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Variant label */}
        {item.selectedVariant && (
          <span className="text-[11px] text-slate-500 font-medium">
            {t('cart_variant', 'Variant:')} <span className="text-slate-700 font-semibold">{item.selectedVariant}</span>
          </span>
        )}

        {/* Price & Quantity stepper */}
        <div className="flex items-center justify-between mt-3 pt-1">
          {/* Stepper */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
            <button
              type="button"
              onClick={() => onUpdateQuantity(item.id, item.selectedVariant, item.quantity - 1)}
              className="w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-8 text-center text-xs font-bold text-slate-900">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => onUpdateQuantity(item.id, item.selectedVariant, item.quantity + 1)}
              className="w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Subtotal */}
          <div className="text-right">
            <div className="text-xs sm:text-sm font-extrabold text-slate-900">
              {formatUSD(item.price * item.quantity)}
            </div>
            {item.quantity > 1 && (
              <span className="text-[10px] text-slate-400 block">
                {formatUSD(item.price)} {t('cart_each', 'each')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
