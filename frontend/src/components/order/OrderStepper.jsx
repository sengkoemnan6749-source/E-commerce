import React from 'react';
import { Check, Package, Truck, Bike, CheckCircle2 } from 'lucide-react';

const STAGES = [
  { key: 'confirmed', label: 'Confirmed', icon: Check, description: 'Order verified & paid' },
  { key: 'processing', label: 'Processing', icon: Package, description: 'Quality checked & packed' },
  { key: 'shipped', label: 'In Transit', icon: Truck, description: 'Dispatched from hub' },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Bike, description: 'Courier on final route' },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2, description: 'Handed over & signed' }
];

export default function OrderStepper({ currentStatus = 'processing' }) {
  const getStageIndex = (status) => {
    const s = (status || '').toLowerCase().replace(/\s+/g, '_');
    if (s.includes('deliver') && !s.includes('out')) return 4;
    if (s.includes('out')) return 3;
    if (s.includes('ship')) return 2;
    if (s.includes('process')) return 1;
    return 0; // confirmed
  };

  const currentIndex = getStageIndex(currentStatus);

  return (
    <div className="w-full py-4 sm:py-6">
      {/* Desktop / Tablet Stepper */}
      <div className="hidden sm:flex items-center justify-between relative px-2 sm:px-6">
        {/* Continuous connector line */}
        <div className="absolute top-6 left-12 right-12 h-1.5 bg-slate-100 rounded-full -z-0">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(currentIndex / (STAGES.length - 1)) * 100}%` }}
          />
        </div>

        {STAGES.map((stage, idx) => {
          const isCompleted = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          const Icon = stage.icon;

          return (
            <div key={stage.key} className="flex flex-col items-center relative z-10 text-center w-28 sm:w-32">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCurrent
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-4 ring-blue-100 scale-105'
                    : isCompleted
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border-2 border-slate-200 text-slate-400'
                }`}
              >
                {idx < currentIndex ? (
                  <Check className="w-4 h-4 stroke-[2.5]" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span
                className={`text-xs mt-3 font-bold transition-colors ${
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
      <div className="sm:hidden space-y-4 relative pl-7 border-l-2 border-slate-200 ml-4 py-2">
        {STAGES.map((stage, idx) => {
          const isCompleted = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          const Icon = stage.icon;

          return (
            <div key={stage.key} className="relative">
              <div
                className={`absolute -left-[35px] top-0.5 w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  isCurrent
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-sm'
                    : isCompleted
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border-2 border-slate-200 text-slate-400'
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
                <p className="text-[11px] text-slate-500 mt-0.5">{stage.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
