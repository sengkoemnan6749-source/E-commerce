import React from 'react';

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = true,
  className = '',
}) {
  const dotColors = {
    default: null,
    primary: 'bg-blue-600',
    success: 'bg-emerald-600',
    warning: 'bg-amber-500',
    danger: 'bg-rose-600',
    purple: 'bg-violet-600',
    cyan: 'bg-cyan-600',
  };

  const variants = {
    default: 'bg-slate-100 text-slate-700',
    primary: 'bg-blue-600/10 text-blue-700',
    success: 'bg-emerald-600/10 text-emerald-700',
    warning: 'bg-amber-500/15 text-amber-800',
    danger: 'bg-rose-600/10 text-rose-700',
    purple: 'bg-violet-600/10 text-violet-700',
    cyan: 'bg-cyan-600/10 text-cyan-700',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  const dotClass = dot ? dotColors[variant] : null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-[5px] ${variants[variant] || variants.default} ${sizes[size] || sizes.md} ${className}`}
    >
      {dotClass && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />}
      {children}
    </span>
  );
}

export default Badge;
