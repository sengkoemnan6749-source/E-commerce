import React from 'react';

export function Input({
  label,
  error,
  helperText,
  icon: Icon,
  rightElement,
  className = '',
  id,
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative rounded-2xl shadow-2xs">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <input
          id={inputId}
          className={`block w-full rounded-2xl border ${
            error
              ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200/50'
              : 'border-slate-200/90 hover:border-slate-300 focus:border-blue-600 focus:ring-blue-500/15'
          } bg-white py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 transition duration-200 ${
            Icon ? 'pl-10' : 'pl-4'
          } ${rightElement ? 'pr-11' : 'pr-4'} ${className}`}
          {...props}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-rose-600 font-semibold">{error}</p>}
      {!error && helperText && <p className="mt-1.5 text-xs text-slate-500">{helperText}</p>}
    </div>
  );
}

export default Input;
