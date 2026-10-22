import React from 'react';
import { Check, Clock, Package, Truck, MapPin, CheckCircle2 } from 'lucide-react';

const STAGES = [
  { key: 'confirmed', label: 'Confirmed', icon: Check, description: 'Order received & verified' },
  { key: 'processing', label: 'Processing', icon: Package, description: 'Assembled at Toul Kork Hub' },
  { key: 'shipped', label: 'Shipped', icon: Truck, description: 'Handed over to GrabExpress / J&T' },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: MapPin, description: 'Courier on final route' },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2, description: 'Handed over to customer' }
];

export default function OrderStepper({ currentStatus = 'processing', history = [] }) {
  const getStageIndex = (status) => {
    const s = (status || '').toLowerCase().replace(/\s+/g, '_');
    if (s === 'delivered') return 4;
    if (s === 'out_for_delivery' || s === 'out for delivery') return 3;
    if (s === 'shipped') return 2;
    if (s === 'processing') return 1;
    return 0; // confirmed
  };

  const currentIndex = getStageIndex(currentStatus);

  return (
    <div className="w-full py-6">
      {/* Desktop / Tablet Stepper */}
      <div className="hidden sm:flex items-center justify-between relative">
        {/* Continuous connector line */}
        <div className="absolute top-5 left-10 right-10 h-1 bg-slate-200 -z-0">
          <div
            className="h-full bg-blue-600 transition-all duration-700 ease-out"
            style={{ width: `${(currentIndex / (STAGES.length - 1)) * 100}%` }}
          />
        </div>

        {STAGES.map((stage, idx) => {
          const isCompleted = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          const Icon = stage.icon;

          return (
            <div key={stage.key} className="flex flex-col items-center relative z-10 text-center w-28">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isCurrent
                    ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-4 ring-blue-100'
                    : isCompleted
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-300 bg-white text-slate-400'
                }`}
              >
                {idx < currentIndex ? (
                  <Check className="w-5 h-5 stroke-[2.5]" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span
                className={`text-xs mt-2 font-bold ${
                  isCurrent
                    ? 'text-blue-600'
                    : isCompleted
                    ? 'text-slate-900'
                    : 'text-slate-400'
                }`}
              >
                {stage.label}
              </span>
              <span className="text-[10px] text-slate-400 leading-tight mt-0.5 max-w-[110px]">
                {stage.description}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mobile Vertical Stepper */}
      <div className="sm:hidden space-y-4 relative pl-6 border-l-2 border-slate-200 ml-4">
        {STAGES.map((stage, idx) => {
          const isCompleted = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          const Icon = stage.icon;

          return (
            <div key={stage.key} className="relative pb-2">
              <div
                className={`absolute -left-[31px] top-0 w-7 h-7 rounded-full flex items-center justify-center border-2 ${
                  isCurrent
                    ? 'border-blue-600 bg-blue-600 text-white ring-4 ring-blue-100'
                    : isCompleted
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-300 bg-white text-slate-400'
                }`}
              >
                {idx < currentIndex ? (
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
              </div>

              <div className="pl-2">
                <span
                  className={`text-xs font-bold block ${
                    isCurrent ? 'text-blue-600' : isCompleted ? 'text-slate-900' : 'text-slate-400'
                  }`}
                >
                  {stage.label}
                </span>
                <p className="text-[11px] text-slate-500">{stage.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
