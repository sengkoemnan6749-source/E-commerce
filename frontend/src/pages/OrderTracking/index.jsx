import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Truck, ArrowLeft, RefreshCw, MapPin, Phone, ShieldCheck, Clock, CheckCircle2, ExternalLink } from 'lucide-react';
import { orderService } from '../../services/orderService';
import { productService } from '../../services/productService';
import OrderStepper from '../../components/order/OrderStepper';
import OrderStatus from '../../components/order/OrderStatus';
import DeliveryMap from './DeliveryMap';
import Button from '../../components/common/Button';
import { formatUSD } from '../../utils/formatPrice';
import { formatDate } from '../../utils/formatDate';
import { useToast } from '../../store/StoreContext';

const STATUS_OPTIONS = ['confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];

export default function OrderTracking() {
  const { id } = useParams();
  const { addToast } = useToast();

  const [order, setOrder] = useState(() => {
    return orderService.getOrderById(id) || orderService.getOrders()[0] || null;
  });

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Order Not Found</h2>
        <p className="text-xs text-slate-500 mb-6">No order matching "{id}" could be located.</p>
        <Link to="/account/orders">
          <Button variant="primary">View My Orders</Button>
        </Link>
      </div>
    );
  }

  // Interactive status switcher for UI demonstration
  const handleUpdateStatus = (newStatus) => {
    const updated = orderService.updateOrderStatus(order.id, newStatus);
    setOrder({ ...updated });
    addToast(`Order simulated status changed to: ${newStatus}`, 'info');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Top Breadcrumb Header */}
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/account/orders"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Orders</span>
        </Link>

        {/* Demo Stage Switcher Bar */}
        <div className="flex items-center gap-1.5 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-100 text-xs">
          <span className="text-[11px] font-semibold text-blue-900 hidden sm:inline">
            Simulate Stage:
          </span>
          <select
            value={order.status.toLowerCase().replace(/\s+/g, '_')}
            onChange={(e) => handleUpdateStatus(e.target.value)}
            className="text-[11px] font-bold text-blue-700 bg-transparent border-none focus:outline-none cursor-pointer"
          >
            <option value="confirmed">1. Confirmed</option>
            <option value="processing">2. Processing</option>
            <option value="shipped">3. Shipped</option>
            <option value="out_for_delivery">4. Out for Delivery</option>
            <option value="delivered">5. Delivered</option>
          </select>
        </div>
      </div>

      {/* Main Order Status Header */}
      <div className="mb-6">
        <OrderStatus order={order} />
      </div>

      {/* 5-Stage Stepper Component Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm mb-6">
        <h3 className="text-sm font-extrabold text-slate-900 mb-2">Live Shipment Progress</h3>
        <OrderStepper currentStatus={order.status} />

        {/* Live Status Note */}
        <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3 text-xs text-slate-600">
          <Clock className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-900 block">Dispatch Telemetry Update:</span>
            {order.status === 'delivered' ? (
              <p className="text-emerald-700 font-semibold mt-0.5">
                Package successfully delivered and signed by customer.
              </p>
            ) : order.status === 'out_for_delivery' ? (
              <p className="text-blue-700 font-semibold mt-0.5">
                Driver is currently in transit in Chamkarmon area. Expect delivery within 35 minutes.
              </p>
            ) : order.status === 'shipped' ? (
              <p className="mt-0.5">
                Package departed TechTonic Toul Kork Central Hub via GrabExpress Courier.
              </p>
            ) : order.status === 'processing' ? (
              <p className="mt-0.5">
                Quality inspection and serialized warranty barcode scanning in progress.
              </p>
            ) : (
              <p className="mt-0.5">
                Payment verified. Order queued for warehouse packing team.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Live Phnom Penh Courier Radar & Map Telemetry */}
      <DeliveryMap orderStatus={order.status} shippingAddress={order.shippingAddress} />

      {/* Cambodia Logistics Partner & Shipping Recipient Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Logistics Courier Partner Card (Teacher Delivery Requirement) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Truck className="w-3.5 h-3.5 text-blue-600" />
                <span>Delivery Logistics Service</span>
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Active Courier
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 mb-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <span className="text-sm font-extrabold text-slate-900">
                  {order.deliveryPartner || order.tracking?.courier || 'Vireak Buntham Express (VET)'}
                </span>
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {order.trackingNumber || order.tracking?.trackingCode || 'VET-KH-889210'}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                <strong>Schedule:</strong> {order.estimatedDelivery || order.tracking?.estimatedDelivery || 'Within 24-48 Hours'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href={order.carrierWebsite || (order.deliveryPartner?.includes('J&T') ? 'https://www.jtexpresskh.com/' : 'https://vireakbuntham.com/')}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
              >
                <span>Track on Carrier Website</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://vireakbuntham.com/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-[11px] font-semibold transition"
              >
                VET Portal
              </a>
              <a
                href="https://www.jtexpresskh.com/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-[11px] font-semibold transition"
              >
                J&T Express
              </a>
            </div>
          </div>

          <div className="pt-3.5 mt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Nationwide 25 Provinces Delivery</span>
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Gateway Synced
            </span>
          </div>
        </div>

        {/* Shipping Recipient */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>Recipient Information</span>
            </h4>
            <div className="space-y-1 text-xs text-slate-700">
              <p className="font-bold text-sm text-slate-900">{order.shippingAddress?.fullName}</p>
              <p className="flex items-center gap-1.5 text-slate-500">
                <Phone className="w-3 h-3" />
                <span>{order.shippingAddress?.phone}</span>
              </p>
              <p className="pt-2 text-slate-600 leading-relaxed">
                {order.shippingAddress?.address}, {order.shippingAddress?.city},{' '}
                {order.shippingAddress?.province} {order.shippingAddress?.postalCode}
              </p>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Driver verified with contact-free delivery</span>
          </div>
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 gap-6">

        {/* Ordered Hardware Items */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Package Contents ({(order.items || []).length} items)
          </h4>
          <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto pr-1">
            {(order.items || []).map((item, idx) => {
              const cleanImg = productService.getCleanProductImage(item, item.selectedVariant || item.variant);
              return (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-lg bg-slate-100/70 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center p-0.5">
                      <img src={cleanImg} alt={item.name} className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900 block truncate max-w-[170px]">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Qty: {item.quantity} {item.selectedVariant ? `• ${item.selectedVariant}` : ''}
                      </span>
                    </div>
                  </div>
                  <span className="font-bold text-slate-900 font-mono">
                    {formatUSD(item.price * item.quantity)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-900">
            <span>Total Value:</span>
            <span className="text-base font-extrabold text-blue-600 font-mono">
              {formatUSD(order.total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
