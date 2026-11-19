import React from 'react';

const SIZES = {
  sm: {
    wrap: 'w-11 h-11',
    icon: 'w-5 h-5',
  },
  md: {
    wrap: 'w-14 h-14',
    icon: 'w-7 h-7',
  },
};

/**
 * Animated emerald verification badge: springs in cleanly, draws its SVG tick
 * stroke-by-stroke, and emits a subtle live green verification pulse ring.
 */
export default function VerifiedCheckmark({ size = 'md', className = '' }) {
  const s = SIZES[size] || SIZES.md;

  return (
    <div className={`relative inline-flex items-center justify-center ${s.wrap} ${className}`}>
      <span
        aria-hidden="true"
        className="animate-verify-ripple absolute inset-0 rounded-full border-2 border-emerald-500/60"
      />
      <div
        className={`animate-verify-pop relative flex items-center justify-center ${s.wrap} rounded-full bg-emerald-600 text-white shadow-sm shadow-emerald-600/25`}
      >
        <svg
          className={s.icon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path className="animate-verify-draw" d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </div>
    </div>
  );
}
