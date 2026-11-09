import React from 'react';
import { CreditCard, QrCode, ShieldCheck } from 'lucide-react';

export default function PaymentMethod({ selectedMethod, onSelectMethod }) {
  const methods = [
    {
      id: 'khqr',
      title: 'KHQR (Bakong, ABA, Wing, ACLEDA)',
      subtitle: 'Scan and pay using any Cambodian mobile banking app',
      icon: QrCode,
      badge: 'Recommended'
    },
    {
      id: 'card',
      title: 'Credit / Debit Card',
      subtitle: 'Visa, Mastercard, JCB, UnionPay',
      icon: CreditCard,
      badge: null
    }
  ];

  return (
    <div className="space-y-3">
      {methods.map((m) => {
        const Icon = m.icon;
        const isSelected = selectedMethod === m.id;

        return (
          <div
            key={m.id}
            onClick={() => onSelectMethod(m.id)}
            className={`relative flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
              isSelected
                ? 'border-blue-600 bg-blue-50/40 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center h-5 mt-1">
              <input
                type="radio"
                name="paymentMethod"
                checked={isSelected}
                onChange={() => onSelectMethod(m.id)}
                className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-slate-900">{m.title}</span>
                {m.badge && (
                  <span className="text-[10px] font-semibold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">
                    {m.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{m.subtitle}</p>
            </div>

            <div
              className={`p-2.5 rounded-xl border flex-shrink-0 ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-slate-50 text-slate-500 border-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
