import React from 'react';
import Badge from '../common/Badge';
import { formatOrderStatus } from '../../services/orderService';
import { Truck, Calendar, Clock, MapPin } from 'lucide-react';

export default function OrderStatus({ order }) {
  const getBadgeVariant = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('delivered')) return 'success';
    if (s.includes('shipped') || s.includes('out')) return 'primary';
    if (s.includes('cancel')) return 'danger';
    return 'warning';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <span className="text-xs text-slate-400 block mb-0.5">Order Tracking</span>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 font-mono">
            {order.id}
          </h2>
        </div>
        <Badge variant={getBadgeVariant(order.status)} size="md" className="text-xs font-bold px-3 py-1">
          {formatOrderStatus(order.status || 'Processing')}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs text-slate-600">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 flex-shrink-0">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase text-slate-400 font-semibold block">Carrier</span>
            <span className="font-bold text-slate-800">{order.carrier || 'GrabExpress Express Phnom Penh'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 flex-shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase text-slate-400 font-semibold block">Estimated Delivery</span>
            <span className="font-bold text-slate-800">{order.estimatedDelivery || 'Today by 5:30 PM'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-50 text-purple-600 flex-shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase text-slate-400 font-semibold block">Destination</span>
            <span className="font-bold text-slate-800 truncate block max-w-[170px]">
              {order.shippingAddress?.city || 'Phnom Penh'}, {order.shippingAddress?.province || 'Cambodia'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
