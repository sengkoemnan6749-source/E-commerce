import React from 'react';
import ProductCard from './ProductCard';
import { PackageOpen } from 'lucide-react';
import Button from '../common/Button';
import { useLanguage } from '../../store/StoreContext';

export default function ProductGrid({
  products = [],
  loading = false,
  emptyTitle,
  emptyMessage,
  onResetFilters,
  columns = 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
}) {
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className={`grid ${columns} gap-6`}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-3xl p-6 border border-slate-200/80 animate-pulse flex flex-col">
            <div className="aspect-square bg-slate-100 rounded-2xl mb-4" />
            <div className="h-3 bg-slate-200 rounded w-1/3 mb-2" />
            <div className="h-5 bg-slate-200 rounded w-4/5 mb-3" />
            <div className="h-3 bg-slate-200 rounded w-full mb-4" />
            <div className="flex justify-between items-center pt-3 border-t border-slate-100 mt-auto">
              <div className="h-6 bg-slate-200 rounded w-20" />
              <div className="h-8 bg-slate-200 rounded w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-12 sm:p-20 bg-white rounded-3xl border border-dashed border-slate-300">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4 shadow-sm">
          <PackageOpen className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-1">
          {emptyTitle || t('shop_empty_title')}
        </h3>
        <p className="text-sm text-slate-500 max-w-md mb-6">
          {emptyMessage || t('shop_empty_message')}
        </p>
        {onResetFilters && (
          <Button variant="primary" size="md" onClick={onResetFilters}>
            {t('shop_clear_all_filters')}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`grid ${columns} gap-6 animate-fadeIn`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
