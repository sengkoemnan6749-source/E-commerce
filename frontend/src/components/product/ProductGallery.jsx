import React, { useState } from 'react';
import Badge from '../common/Badge';

export default function ProductGallery({
  images = [],
  name = '',
  discountPercent = 0,
  badge = '',
  activeImage: controlledActiveImage,
  onSelectImage,
  selectedVariant = ''
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const withVersion = (url) => {
    if (!url || typeof url !== 'string') return url;
    return url.includes('?') ? url : `${url}?v=20`;
  };

  const displayImages = images.length > 0 ? images : ['/images/products/prod-001-main.png'];
  const rawCurrent = controlledActiveImage || displayImages[selectedIndex] || displayImages[0];
  const currentImage = withVersion(rawCurrent);

  const handleThumbnailClick = (img, idx) => {
    setSelectedIndex(idx);
    if (onSelectImage) {
      onSelectImage(img, idx);
    }
  };

  return (
    <div className="flex flex-col-reverse lg:flex-row gap-4">
      {/* Thumbnail List */}
      <div className="flex lg:flex-col gap-3 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
        {displayImages.map((img, idx) => {
          const isSelected = rawCurrent === img || currentImage === withVersion(img);
          return (
            <button
              key={`${img}-${idx}`}
              type="button"
              onClick={() => handleThumbnailClick(img, idx)}
              className={`relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden transition-all duration-300 ${
                isSelected
                  ? 'bg-slate-100/90 shadow-md scale-105 opacity-100'
                  : 'bg-slate-50/70 hover:bg-slate-100/70 opacity-50 hover:opacity-90'
              }`}
              aria-label={`Select image ${idx + 1}`}
            >
              <img src={withVersion(img)} alt={`${name} thumbnail ${idx + 1}`} className="w-full h-full object-contain p-2" />
            </button>
          );
        })}
      </div>

      {/* Main Image View */}
      <div className="relative flex-1 aspect-square rounded-3xl overflow-hidden bg-gradient-to-b from-slate-50 via-slate-100/50 to-white border border-slate-200/90 shadow-sm flex items-center justify-center p-8 group">
        <img
          key={currentImage}
          src={currentImage}
          alt={name}
          className="w-full h-full object-contain object-center transition-all duration-300 animate-fadeIn filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.12)] group-hover:scale-105"
        />
      </div>
    </div>
  );
}
