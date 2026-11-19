import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const SIZE_MAP = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-3xl',
  xl: 'max-w-4xl',
  '2xl': 'max-w-5xl',
  '3xl': 'max-w-6xl',
  full: 'max-w-[96vw]',
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth,
  size = 'md',
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Resolve max width: if maxWidth is passed, use it; otherwise use size mapping
  const resolvedWidth = maxWidth || (SIZE_MAP[size] || 'max-w-lg');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto print:static print:overflow-visible">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity print:hidden"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6 print:block print:min-h-0 print:p-0">
        <div
          className={`relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-6 w-full ${resolvedWidth} border border-slate-200 flex flex-col max-h-[92vh] print:static print:my-0 print:max-h-none print:max-w-none print:rounded-none print:border-none print:shadow-none print:overflow-visible`}
          onClick={e => e.stopPropagation()}
        >
          {/* Header (sticky) */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white/95 backdrop-blur-sm shrink-0 print:hidden">
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body (scrollable) */}
          <div className="p-6 sm:p-8 overflow-y-auto flex-1 print:p-0 print:overflow-visible">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default Modal;
