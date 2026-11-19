import React from 'react';
import { QrCode } from 'lucide-react';
import { useLanguage } from '../../store/StoreContext';

export default function PaymentMethod({ selectedMethod = 'khqr', onSelectMethod }) {
  const { language } = useLanguage();
  const methods = [
    {
      id: 'khqr',
      title: language === 'km' ? 'KHQR (បាគង, ABA, Wing, អេស៊ីលីដា)' : 'KHQR (Bakong, ABA, Wing, ACLEDA)',
      subtitle:
        language === 'km'
          ? 'ស្កេន និងទូទាត់តាមរយៈកម្មវិធីធនាគារកម្ពុជាណាមួយ'
          : 'Scan and pay using any Cambodian mobile banking app',
      icon: QrCode
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
            className={`flex items-center gap-3.5 p-4 rounded-2xl border transition-all duration-150 cursor-pointer ${
              isSelected
                ? 'border-blue-600 bg-blue-50/20 ring-1 ring-blue-600'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              checked={isSelected}
              onChange={() => onSelectMethod(m.id)}
              className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
            />

            <Icon className={`w-5 h-5 flex-shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-500'}`} />

            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold text-slate-900 block">{m.title}</span>
              <p className="text-xs text-slate-500 mt-0.5">{m.subtitle}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
