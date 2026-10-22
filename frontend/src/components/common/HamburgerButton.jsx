import React from 'react';

/**
 * Animated Hamburger Button
 * Seamlessly morphs between a 3-bar hamburger icon and an "X" close icon
 * with spring physics, staggered hover expansion, and tactile active press.
 */
export default function HamburgerButton({
  isOpen = false,
  onClick,
  className = '',
  color = 'bg-slate-800',
  activeColor = 'bg-blue-600',
  hoverBg = 'hover:bg-slate-100',
  ariaLabel = 'Toggle navigation menu'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-10 h-10 rounded-2xl flex flex-col items-center justify-center p-2.5 transition-all duration-300 active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer group ${hoverBg} ${className}`}
      aria-expanded={isOpen}
      aria-label={ariaLabel}
    >
      <div className="w-5 h-4 relative flex flex-col justify-between items-center pointer-events-none">
        {/* Top Bar */}
        <span
          className={`block h-[2.5px] rounded-full transition-all duration-300 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)] origin-center will-change-transform ${
            isOpen
              ? `w-5 ${activeColor} translate-y-[6.75px] rotate-45`
              : `w-5 ${color} group-hover:w-5`
          }`}
        />

        {/* Middle Bar (staggered modern width that expands on hover, shrinks & fades on open) */}
        <span
          className={`block h-[2.5px] rounded-full transition-all duration-200 ease-in-out will-change-transform ${
            isOpen
              ? 'w-0 opacity-0 scale-x-0'
              : `w-3.5 ${color} group-hover:w-5 opacity-100`
          }`}
        />

        {/* Bottom Bar */}
        <span
          className={`block h-[2.5px] rounded-full transition-all duration-300 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)] origin-center will-change-transform ${
            isOpen
              ? `w-5 ${activeColor} -translate-y-[6.75px] -rotate-45`
              : `w-5 ${color} group-hover:w-5`
          }`}
        />
      </div>
    </button>
  );
}
