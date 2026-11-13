import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowLeft, PackageX, Sparkles } from 'lucide-react';
import ProductGallery from '../../components/product/ProductGallery';
import ProductInfo from '../../components/product/ProductInfo';
import ProductSpecs from '../../components/product/ProductSpecs';
import ProductReviews from '../../components/product/ProductReviews';
import ProductCard from '../../components/product/ProductCard';
import Button from '../../components/common/Button';
import { productService } from '../../services/productService';
import { useLanguage } from '../../store/StoreContext';
import { translateCategory, translateBadge } from '../../utils/translations';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();

  const product = useMemo(() => {
    return productService.getProductById(id);
  }, [id]);

  // Synchronized Variant & Image state
  const [selectedVariant, setSelectedVariant] = useState(
    product?.variants?.[0]?.name || 'Standard'
  );
  const [activeImage, setActiveImage] = useState(
    product?.variants?.[0]?.image || product?.image || product?.images?.[0] || ''
  );

  // Sync state whenever product changes (e.g. navigation to related product)
  React.useEffect(() => {
    if (product) {
      const firstVariant = product.variants?.[0];
      setSelectedVariant(firstVariant?.name || 'Standard');
      setActiveImage(firstVariant?.image || product.image || product.images?.[0] || '');
    }
  }, [product]);

  const handleVariantChange = (variantName) => {
    setSelectedVariant(variantName);
    const found = product?.variants?.find((v) => v.name === variantName);
    if (found?.image) {
      setActiveImage(found.image);
    }
  };

  const handleImageSelect = (img) => {
    setActiveImage(img);
    const found = product?.variants?.find((v) => v.image === img);
    if (found) {
      setSelectedVariant(found.name);
    }
  };

  // Related products from same category
  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return productService
      .getProducts()
      .filter((p) => p.category === product.category && p.id !== product.id)
      .slice(0, 4);
  }, [product]);

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <PackageX className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">
          {language === 'km' ? 'រកមិនឃើញផលិតផលទេ' : 'Product Not Found'}
        </h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
          {language === 'km'
            ? 'ផលិតផលបច្ចេកវិទ្យាដែលអ្នកកំពុងស្វែងរក អាចត្រូវបានលុបចេញ ឬមិនមាននៅក្នុងស្តុករបស់យើងទៀតទេ។'
            : 'The hardware item you are looking for may have been archived or removed from our inventory.'}
        </p>
        <Button variant="primary" size="md" onClick={() => navigate('/shop')}>
          {language === 'km' ? 'ត្រឡប់ទៅហាងទំនិញ' : 'Back to Shop'}
        </Button>
      </div>
    );
  }

  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 mb-8 overflow-x-auto whitespace-nowrap pb-1">
        <Link to="/" className="hover:text-blue-600 transition-colors">
          {language === 'km' ? 'ទំព័រដើម' : 'Home'}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
        <Link to="/shop" className="hover:text-blue-600 transition-colors">
          {language === 'km' ? 'ហាងទំនិញ' : 'Shop'}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
        <Link
          to={`/shop?category=${encodeURIComponent(product.category)}`}
          className="hover:text-blue-600 transition-colors"
        >
          {translateCategory(product.category, language)}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
        <span className="font-semibold text-slate-900 truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Layout: Gallery (left) & Info (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-16 sm:mb-20">
        <div className="lg:col-span-7">
          <ProductGallery
            images={product.gallery || product.images || [product.image]}
            activeImage={activeImage}
            onSelectImage={handleImageSelect}
            name={product.name}
            discountPercent={discountPercent}
            badge={translateBadge(product.badge, language)}
            selectedVariant={selectedVariant}
          />
        </div>

        <div className="lg:col-span-5">
          <ProductInfo
            product={product}
            selectedVariant={selectedVariant}
            onSelectVariant={handleVariantChange}
            activeImage={activeImage}
          />
        </div>
      </div>

      {/* Detailed Technical Specifications & In The Box */}
      <div className="mb-16 sm:mb-20 pt-12 border-t border-slate-200">
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {language === 'km' ? 'លក្ខណៈបច្ចេកទេស' : 'Technical Specifications'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {language === 'km'
              ? 'ព័ត៌មានលម្អិតផលិតផល វិមាត្រ និងសម្ភារៈក្នុងប្រអប់'
              : 'Product specifications, dimensions, and box contents'}
          </p>
        </div>
        <ProductSpecs
          specs={product.specs}
          inBox={product.inBox}
          warranty={product.warranty}
        />
      </div>

      {/* Verified Customer Reviews Section */}
      <div className="mb-16 sm:mb-20 pt-12 border-t border-slate-200">
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {language === 'km' ? 'មតិយោបល់អតិថិជន' : 'Customer Reviews'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {language === 'km'
              ? 'មតិយោបល់ពិតពីអតិថិជនដែលបានទិញប្រើប្រាស់'
              : 'Real feedback from verified purchasers'}
          </p>
        </div>
        <ProductReviews
          productId={product.id}
          rating={product.rating}
          reviewsCount={product.reviewsCount || 0}
        />
      </div>

      {/* Related Products Recommendations */}
      {relatedProducts.length > 0 && (
        <div className="pt-12 border-t border-slate-200">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                {language === 'km' ? 'បំពេញឈុតឧបករណ៍របស់អ្នក' : 'Complete The Ecosystem'}
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
                {language === 'km'
                  ? `${translateCategory(product.category, language)} ដែលពាក់ព័ន្ធ`
                  : `Related ${product.category}`}
              </h2>
            </div>
            <Link
              to={`/shop?category=${encodeURIComponent(product.category)}`}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 hidden sm:inline"
            >
              {language === 'km' ? 'មើលប្រភេទនេះ →' : 'View Category →'}
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
