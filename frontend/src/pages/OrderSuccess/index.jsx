import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Download, Truck, ShoppingBag, ArrowRight, Printer, Share2 } from 'lucide-react';
import { orderService } from '../../services/orderService';
import { productService } from '../../services/productService';
import { formatUSD, formatKHR } from '../../utils/formatPrice';
import { formatDate } from '../../utils/formatDate';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import VerifiedCheckmark from '../../components/common/VerifiedCheckmark';
import Invoice from '../../components/order/Invoice';
import { useLanguage } from '../../store/StoreContext';

export default function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const orderId = searchParams.get('orderId');
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  const [order, setOrder] = useState(() => {
    if (orderId) {
      return orderService.getOrderById(orderId);
    }
    const all = orderService.getOrders();
    return all.length > 0 ? all[0] : null;
  });

  useEffect(() => {
    if (!orderId) return;
    const local = orderService.getOrderById(orderId);
    if (local) {
      setOrder(local);
      return;
    }
    orderService.fetchOrderById(orderId).then((fetched) => {
      if (fetched) setOrder(fetched);
    }).catch(() => {});
  }, [orderId]);

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          {language === 'km' ? 'រកមិនឃើញការកុម្ម៉ង់ទេ' : 'Order Not Found'}
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          {language === 'km' ? 'យើងមិនអាចទាញយកលេខកូដកុម្ម៉ង់នេះបានទេ។' : 'We could not retrieve this order ID.'}
        </p>
        <Link to="/shop">
          <Button variant="primary">
            {language === 'km' ? 'បន្តទៅហាងទំនិញ' : 'Continue to Shop'}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      {/* Success Card Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 text-center mb-6">
        <div className="mb-4 flex justify-center">
          <VerifiedCheckmark size="md" />
        </div>

        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>{language === 'km' ? 'ការទូទាត់បានបញ្ជាក់' : 'Payment confirmed'}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
          {language === 'km' ? 'សូមអរគុណសម្រាប់ការកុម្ម៉ង់' : 'Thank you for your order'}
        </h1>

        <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
          {language === 'km'
            ? 'ការទូទាត់របស់អ្នកបានជោគជ័យ។ យើងកំពុងរៀបចំវេចខ្ចប់ និងត្រៀមដឹកជញ្ជូនជូនអ្នក។'
            : 'Your payment is confirmed and your items are now being prepared for dispatch.'}
        </p>

        {/* Order Identifier Box */}
        <div className="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-5 bg-[#fafafa] px-4 sm:px-5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-500 mb-6 max-w-full">
          <div className="break-all">
            {language === 'km' ? 'លេខយោងកុម្ម៉ង់៖' : 'Order Reference:'}{' '}
            <strong className="font-mono text-slate-900 font-semibold">{order.id}</strong>
          </div>
          <span className="hidden sm:block h-3.5 w-px bg-slate-200" />
          <div>
            {language === 'km' ? 'វិធីសាស្ត្រទូទាត់៖' : 'Payment Method:'}{' '}
            <strong className="font-medium text-slate-900">{order.paymentMethod || 'KHQR'}</strong>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate(`/orders/${order.id}`)}
          >
            <Truck className="w-4 h-4" />
            <span>{language === 'km' ? 'តាមដានស្ថានភាពកុម្ម៉ង់' : 'Track Order Status'}</span>
          </Button>

          <Button
            variant="outline"
            size="md"
            onClick={() => setIsInvoiceOpen(true)}
          >
            <Printer className="w-4 h-4" />
            <span>{language === 'km' ? 'ទាញយកវិក្កយបត្រ' : 'Download Invoice'}</span>
          </Button>

          <Link to="/shop">
            <Button variant="ghost" size="md">
              <ShoppingBag className="w-4 h-4" />
              <span>{language === 'km' ? 'បន្តទិញទំនិញ' : 'Continue Shopping'}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Order Details & Summary Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
        <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
          {language === 'km' ? 'សង្ខេបការកុម្ម៉ង់ និងព័ត៌មានដឹកជញ្ជូន' : 'Order Summary & Delivery Details'}
        </h3>

        {/* Delivery Address & ETA Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-[#fafafa] border border-slate-200/80">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              {language === 'km' ? 'គោលដៅដឹកជញ្ជូន' : 'Shipping Destination'}
            </span>
            <p className="font-semibold text-slate-900">{order.shippingAddress?.fullName}</p>
            <p className="text-slate-600">{order.shippingAddress?.phone}</p>
            <p className="text-slate-600">{order.shippingAddress?.address}</p>
            <p className="text-slate-600">
              {order.shippingAddress?.city}, {order.shippingAddress?.province}{' '}
              {order.shippingAddress?.postalCode}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#fafafa] border border-slate-200/80">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              {language === 'km' ? 'ការដឹកជញ្ជូនប៉ាន់ស្មាន' : 'Estimated Delivery'}
            </span>
            <p className="font-semibold text-slate-900 text-sm">
              {order.estimatedDelivery || (language === 'km' ? 'ថ្ងៃនេះមុនម៉ោង ៥:៣០ ល្ងាច' : 'Today by 5:30 PM')}
            </p>
            <p className="text-slate-500 mt-1">
              {language === 'km' ? 'ដឹកជញ្ជូនដោយ' : 'Handled by'}{' '}
              <strong className="text-slate-800">{order.carrier || 'GrabExpress Phnom Penh'}</strong>
            </p>
            <p className="text-slate-600 font-medium mt-2">
              {language === 'km'
                ? 'សារជូនដំណឹង SMS នឹងត្រូវបានផ្ញើពេលដឹកចេញ'
                : 'Notification will be sent upon dispatch'}
            </p>
          </div>
        </div>

        {/* Purchased Items List */}
        <div>
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block mb-3">
            {language === 'km' ? 'ឧបករណ៍ដែលបានទិញ' : 'Purchased Devices'}
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
                        {language === 'km' ? 'ចំនួន៖' : 'Qty:'} {item.quantity}{' '}
                        {item.selectedVariant ? `• ${item.selectedVariant}` : ''}
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
            <span>{language === 'km' ? 'តម្លៃទំនិញសរុប៖' : 'Subtotal:'}</span>
            <span className="font-semibold text-slate-900">{formatUSD(order.subtotal || order.total)}</span>
          </div>
          <div className="flex justify-between">
            <span>{language === 'km' ? 'ថ្លៃដឹកជញ្ជូនរហ័ស៖' : 'Express Delivery:'}</span>
            <span className="font-semibold text-slate-900">
              {order.shippingFee === 0
                ? language === 'km'
                  ? 'ឥតគិតថ្លៃ'
                  : 'FREE'
                : formatUSD(order.shippingFee || 0)}
            </span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600 font-semibold">
              <span>
                {language === 'km' ? 'បញ្ចុះតម្លៃ' : 'Discount'} ({order.appliedCoupon}):
              </span>
              <span>-{formatUSD(order.discountAmount)}</span>
            </div>
          )}
          <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline text-sm font-semibold text-slate-900">
            <span>{language === 'km' ? 'សរុបដែលបានទូទាត់៖' : 'Total Paid:'}</span>
            <div className="text-right">
              <span className="text-lg font-bold text-slate-900 tabular-nums block">{formatUSD(order.total)}</span>
              <span className="text-xs text-slate-500 font-medium tabular-nums">{formatKHR(order.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Modal Preview */}
      <Modal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        title={language === 'km' ? 'វិក្កយបត្រពន្ធផ្លូវការ' : 'Official Tax Invoice'}
        size="xl"
      >
        <Invoice order={order} onBack={() => setIsInvoiceOpen(false)} />
      </Modal>
    </div>
  );
}
