import React, { useState, useEffect } from 'react';
import { CheckCircle2, Copy, Check, Smartphone, Sparkles, RefreshCw } from 'lucide-react';
import { formatUSD, formatKHR } from '../../utils/formatPrice';
import { useToast } from '../../store/StoreContext';
import Button from '../common/Button';

export default function KHQRPayment({ totalAmount = 0, onSimulateSuccess }) {
  const { addToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Generate mock Bakong KHQR Deep Link / String
  const khqrString = `khqr://techtonic.store/bakong/checkout?amount=${totalAmount}&currency=USD&md5=e4d909c290d0fb1ca068ffaddf22cbd0`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(khqrString);
    setCopied(true);
    addToast('KHQR payment string copied to clipboard', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulatePayment = () => {
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      if (onSimulateSuccess) {
        onSimulateSuccess();
      }
    }, 1200);
  };

  return (
    <div className="flex flex-col items-center p-5 sm:p-7 rounded-2xl bg-slate-50 border border-slate-200/90 text-center">
      {/* Authentic KHQR Card Frame */}
      <div className="w-full max-w-xs bg-white rounded-2xl shadow-xl border-2 border-red-500 overflow-hidden mb-6">
        {/* Red KHQR Top Banner */}
        <div className="bg-red-600 px-4 py-2.5 flex items-center justify-between text-white">
          <div className="flex items-center gap-1.5 font-black text-sm tracking-wider">
            <span className="bg-white text-red-600 px-1.5 py-0.5 rounded font-black text-xs">
              KHQR
            </span>
            <span>BAKONG</span>
          </div>
          <span className="text-[10px] font-semibold tracking-wide uppercase text-red-100">
            NBC Standard
          </span>
        </div>

        {/* Merchant Info */}
        <div className="px-4 pt-3 pb-1 text-center border-b border-slate-100">
          <h4 className="text-xs font-bold text-slate-900 tracking-tight">
            TECHTONIC STORE CAMBODIA
          </h4>
          <p className="text-[10px] text-slate-500">Merchant ID: 000184920</p>
        </div>

        {/* Dynamic High-Contrast Mock SVG QR Code */}
        <div className="p-5 flex items-center justify-center bg-white">
          <div className="relative p-2 rounded-xl bg-white border border-slate-200 shadow-inner">
            <svg
              className="w-48 h-48"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Outer boundary */}
              <rect width="100" height="100" fill="white" />
              {/* Corner 1 */}
              <rect x="5" y="5" width="26" height="26" rx="4" fill="#0f172a" />
              <rect x="9" y="9" width="18" height="18" rx="2" fill="white" />
              <rect x="13" y="13" width="10" height="10" rx="2" fill="#dc2626" />
              {/* Corner 2 */}
              <rect x="69" y="5" width="26" height="26" rx="4" fill="#0f172a" />
              <rect x="73" y="9" width="18" height="18" rx="2" fill="white" />
              <rect x="77" y="13" width="10" height="10" rx="2" fill="#dc2626" />
              {/* Corner 3 */}
              <rect x="5" y="69" width="26" height="26" rx="4" fill="#0f172a" />
              <rect x="9" y="73" width="18" height="18" rx="2" fill="white" />
              <rect x="13" y="77" width="10" height="10" rx="2" fill="#dc2626" />
              {/* Pattern Blocks */}
              <rect x="36" y="8" width="6" height="6" fill="#0f172a" />
              <rect x="46" y="8" width="8" height="6" fill="#0f172a" />
              <rect x="58" y="8" width="6" height="6" fill="#0f172a" />
              <rect x="36" y="18" width="14" height="6" fill="#0f172a" />
              <rect x="54" y="18" width="10" height="6" fill="#0f172a" />
              <rect x="8" y="36" width="6" height="12" fill="#0f172a" />
              <rect x="18" y="36" width="12" height="6" fill="#0f172a" />
              <rect x="36" y="36" width="10" height="10" fill="#dc2626" />
              <rect x="50" y="36" width="16" height="6" fill="#0f172a" />
              <rect x="70" y="36" width="8" height="10" fill="#0f172a" />
              <rect x="82" y="36" width="10" height="6" fill="#0f172a" />
              <rect x="8" y="52" width="12" height="6" fill="#0f172a" />
              <rect x="24" y="46" width="8" height="14" fill="#0f172a" />
              <rect x="36" y="50" width="12" height="8" fill="#0f172a" />
              <rect x="52" y="46" width="14" height="12" fill="#0f172a" />
              <rect x="70" y="50" width="10" height="8" fill="#0f172a" />
              <rect x="84" y="46" width="8" height="12" fill="#0f172a" />
              <rect x="36" y="68" width="8" height="12" fill="#0f172a" />
              <rect x="48" y="64" width="12" height="6" fill="#0f172a" />
              <rect x="64" y="68" width="10" height="8" fill="#0f172a" />
              <rect x="78" y="64" width="14" height="6" fill="#0f172a" />
              <rect x="36" y="84" width="14" height="8" fill="#0f172a" />
              <rect x="54" y="74" width="6" height="18" fill="#0f172a" />
              <rect x="64" y="80" width="16" height="12" fill="#0f172a" />
              <rect x="84" y="74" width="8" height="18" fill="#0f172a" />
            </svg>

            {/* Central Center Badge */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center font-black text-[9px] shadow-lg border-2 border-white">
                KHQR
              </div>
            </div>
          </div>
        </div>

        {/* Amount Bottom Section */}
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 flex flex-col items-center">
          <div className="text-xl font-extrabold text-slate-900 tracking-tight">
            {formatUSD(totalAmount)}
          </div>
          <div className="text-xs font-semibold text-slate-500">
            {formatKHR(totalAmount)}
          </div>
        </div>
      </div>

      {/* Instructions & Supported Banks */}
      <div className="max-w-md space-y-3">
        <p className="text-xs text-slate-600 font-medium">
          Open your preferred Cambodian banking app and scan this QR code to complete payment instantly:
        </p>

        {/* Supported Banking Apps Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {['ABA Mobile', 'Wing Bank', 'ACLEDA Mobile', 'Sathapana', 'Canadia Bank'].map(
            (bank) => (
              <span
                key={bank}
                className="text-[11px] font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-xs"
              >
                {bank}
              </span>
            )
          )}
        </div>

        {/* Interactive Helper Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Deep Link' : 'Copy KHQR String'}</span>
          </button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            loading={verifying}
            onClick={handleSimulatePayment}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Smartphone className="w-3.5 h-3.5 mr-1.5" />
            <span>Confirm Mobile Payment</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
