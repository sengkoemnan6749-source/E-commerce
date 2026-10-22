import React, { useMemo, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Download, Truck, ShoppingBag, ArrowRight, Printer, Share2 } from 'lucide-react';
import { orderService } from '../../services/orderService';
import { productService } from '../../services/productService';
import { formatUSD, formatKHR } from '../../utils/formatPrice';
import { formatDate } from '../../utils/formatDate';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Invoice from '../../components/order/Invoice';

export default function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('orderId');
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  const order = useMemo(() => {
    if (orderId) {
      return orderService.getOrderById(orderId);
    }
    // Fallback: grab latest order
    const all = orderService.getOrders();
    return all.length > 0 ? all[0] : null;
  }, [orderId]);

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Order Not Found</h2>
        <p className="text-xs text-slate-500 mb-6">We could not retrieve this order ID.</p>
        <Link to="/shop">
          <Button variant="primary">Continue to Shop</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      {/* Success Card Header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-lg text-center mb-8">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-5 ring-8 ring-emerald-50/60">
          <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
        </div>

        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
          Payment Confirmed
        </span>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-3 mb-2">
          Thank You For Your Order!
        </h1>

        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6">
          Your payment has been successfully processed. We have dispatched our logistics team at the Toul Kork Flagship center to prepare your hardware.
        </p>

        {/* Order Identifier Box */}
        <div className="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-6 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-200 text-xs text-slate-600 mb-6 font-mono">
          <div>
            Order Reference: <strong className="text-blue-600 text-sm font-black">{order.id}</strong>
          </div>
          <div className="hidden sm:block text-slate-300">•</div>
          <div>
            Payment Method: <strong className="text-slate-900">{order.paymentMethod || 'KHQR'}</strong>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate(`/orders/${order.id}`)}
            className="shadow-md shadow-blue-500/20"
          >
            <Truck className="w-4 h-4 mr-2" />
            <span>Track Order Status</span>
          </Button>

          <Button
            variant="outline"
            size="md"
            onClick={() => setIsInvoiceOpen(true)}
          >
            <Printer className="w-4 h-4 mr-2" />
            <span>Download Invoice</span>
          </Button>

          <Link to="/shop">
            <Button variant="ghost" size="md">
              <ShoppingBag className="w-4 h-4 mr-2" />
              <span>Continue Shopping</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Order Details & Summary Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
        <h3 className="text-base font-extrabold text-slate-900 pb-3 border-b border-slate-100">
          Order Summary & Delivery Details
        </h3>

        {/* Delivery Address & ETA Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Shipping Destination
            </span>
            <p className="font-bold text-slate-900">{order.shippingAddress?.fullName}</p>
            <p className="text-slate-600">{order.shippingAddress?.phone}</p>
            <p className="text-slate-600">{order.shippingAddress?.address}</p>
            <p className="text-slate-600">
              {order.shippingAddress?.city}, {order.shippingAddress?.province}{' '}
              {order.shippingAddress?.postalCode}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Estimated Delivery
            </span>
            <p className="font-bold text-slate-900 text-sm">{order.estimatedDelivery || 'Today by 5:30 PM'}</p>
            <p className="text-slate-500 mt-1">
              Handled by <strong className="text-slate-800">{order.carrier || 'GrabExpress Phnom Penh'}</strong>
            </p>
            <p className="text-emerald-600 font-semibold mt-2">
              SMS notification will be sent upon dispatch
            </p>
          </div>
        </div>

        {/* Purchased Items List */}
        <div>
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block mb-3">
            Purchased Devices
          </span>
          <div className="divide-y divide-slate-100">
            {(order.items || []).map((item, idx) => {
              const cleanImg = productService.getCleanProductImage(item, item.selectedVariant || item.variant);
              return (
                <div key={idx} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-100/70 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                      <img src={cleanImg} alt={item.name} className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block">{item.name}</span>
                      <span className="text-slate-400">
                        Qty: {item.quantity} {item.selectedVariant ? `• ${item.selectedVariant}` : ''}
                      </span>
                    </div>
                  </div>
                  <div className="text-right font-extrabold text-slate-900 font-mono">
                    {formatUSD(item.price * item.quantity)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pricing Subtotals */}
        <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="font-semibold text-slate-900">{formatUSD(order.subtotal || order.total)}</span>
          </div>
          <div className="flex justify-between">
            <span>Express Delivery:</span>
            <span className="font-semibold text-slate-900">
              {order.shippingFee === 0 ? 'FREE' : formatUSD(order.shippingFee || 0)}
            </span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600 font-semibold">
              <span>Discount ({order.appliedCoupon}):</span>
              <span>-{formatUSD(order.discountAmount)}</span>
            </div>
          )}
          <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline text-sm font-bold text-slate-900">
            <span>Total Paid:</span>
            <div className="text-right">
              <span className="text-xl font-black text-slate-950 block">{formatUSD(order.total)}</span>
              <span className="text-xs text-slate-500 font-semibold">{formatKHR(order.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Modal Preview */}
      <Modal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        title="Official Tax Invoice"
        size="xl"
      >
        <Invoice order={order} onBack={() => setIsInvoiceOpen(false)} />
      </Modal>
    </div>
  );
}
