import React, { useState } from 'react';
import { Search, Eye, Truck, FileText, CheckCircle2, ExternalLink } from 'lucide-react';
import { orderService, formatOrderStatus } from '../../services/orderService';
import { formatUSD } from '../../utils/formatPrice';
import { formatDate } from '../../utils/formatDate';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Invoice from '../../components/order/Invoice';
import { useToast, useLanguage } from '../../store/StoreContext';
import { translateOrderStatusLabel } from '../../utils/translations';

export default function AdminOrders() {
  const [orders, setOrders] = useState(orderService.getOrders());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const { addToast } = useToast();
  const { language } = useLanguage();

  const refreshOrders = () => {
    setOrders(orderService.getOrders());
  };

  const handleStatusChange = (orderId, newStatus) => {
    orderService.updateOrderStatus(orderId, newStatus);
    refreshOrders();
    addToast(
      language === 'km'
        ? `បានធ្វើបច្ចុប្បន្នភាពការបញ្ជាទិញ ${orderId} ទៅជា ${translateOrderStatusLabel(newStatus, 'km')}`
        : `Order ${orderId} updated to ${formatOrderStatus(newStatus)}`,
      'success'
    );
  };

  const filtered = orders.filter((o) => {
    const normalizedStatus = (o.status || '').toLowerCase().replace(/\s+/g, '_');
    if (statusFilter !== 'All' && normalizedStatus !== statusFilter.toLowerCase()) {
      return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        o.id.toLowerCase().includes(q) ||
        o.customerName?.toLowerCase().includes(q) ||
        o.customerPhone?.includes(q)
      );
    }
    return true;
  });

  const statusTabs = [
    { id: 'All', label: language === 'km' ? 'ទាំងអស់' : 'All' },
    { id: 'confirmed', label: translateOrderStatusLabel('Confirmed', language) },
    { id: 'processing', label: translateOrderStatusLabel('Processing', language) },
    { id: 'shipped', label: translateOrderStatusLabel('Shipped', language) },
    { id: 'out_for_delivery', label: translateOrderStatusLabel('Out for Delivery', language) },
    { id: 'delivered', label: translateOrderStatusLabel('Delivered', language) }
  ];

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {language === 'km' ? 'ការគ្រប់គ្រងការបញ្ជាទិញ' : 'Orders Management'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {language === 'km'
              ? 'ត្រួតពិនិត្យដំណើរការរៀបចំទំនិញ ការប្រគល់ជូនអ្នកដឹកជញ្ជូន និងគ្រប់គ្រងស្ថានភាពទូទាត់។'
              : 'Audit fulfillment workflows, courier handoffs, and manage payment statuses.'}
          </p>
        </div>
      </div>

      {/* Unified Orders Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
        {/* Toolbar: 1-Click Status Filter Pills + Search */}
        <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
            {statusTabs.map((tab) => {
              const active = statusFilter === tab.id;
              const count =
                tab.id === 'All'
                  ? orders.length
                  : orders.filter(
                      (o) => (o.status || '').toLowerCase().replace(/\s+/g, '_') === tab.id
                    ).length;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    active
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                  }`}
                >
                  {tab.label} ({count})
                </button>
              );
            })}
          </div>

          <div className="relative w-full lg:w-72 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={
                language === 'km'
                  ? 'ស្វែងរកតាមលេខកូដ ឈ្មោះ ឬទូរស័ព្ទ...'
                  : 'Search order ID, name, or phone...'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200/90 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/70 text-slate-500 font-semibold">
                <th className="py-3 px-4">{language === 'km' ? 'លេខកូដកុម្ម៉ង់' : 'Order ID'}</th>
                <th className="py-3 px-4">{language === 'km' ? 'អតិថិជន' : 'Customer'}</th>
                <th className="py-3 px-4">{language === 'km' ? 'សេវាដឹកជញ្ជូន' : 'Courier Service'}</th>
                <th className="py-3 px-4">{language === 'km' ? 'កាលបរិច្ឆេទ' : 'Date'}</th>
                <th className="py-3 px-4">{language === 'km' ? 'ការទូទាត់' : 'Payment'}</th>
                <th className="py-3 px-4">{language === 'km' ? 'សរុប' : 'Total'}</th>
                <th className="py-3 px-4">{language === 'km' ? 'ស្ថានភាព' : 'Status'}</th>
                <th className="py-3 px-4 text-right">{language === 'km' ? 'សកម្មភាព' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Truck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium text-slate-700">
                      {language === 'km' ? 'រកមិនឃើញការបញ្ជាទិញឡើយ' : 'No orders match your filter'}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('All');
                      }}
                      className="mt-2 text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                    >
                      {language === 'km' ? 'សម្អាតតម្រង' : 'Clear filters'}
                    </button>
                  </td>
                </tr>
              ) : (
                filtered.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-blue-600 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(ord)}
                        className="hover:underline cursor-pointer"
                      >
                        {ord.id}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-900 block">{ord.customerName}</span>
                      <span className="text-[11px] text-slate-400">{ord.customerPhone}</span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-medium text-slate-800 block text-[11px]">
                        {ord.deliveryPartner || ord.tracking?.courier || 'Vireak Buntham (VET)'}
                      </span>
                      <a
                        href={ord.carrierWebsite || (ord.deliveryPartner?.includes('J&T') ? 'https://www.jtexpresskh.com/' : 'https://vireakbuntham.com/')}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-blue-600 hover:underline inline-flex items-center gap-1 font-mono"
                      >
                        <span>{ord.trackingNumber || ord.tracking?.trackingCode || 'VET-KH-889210'}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {formatDate(ord.createdAt)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-medium text-slate-800 block">
                        {ord.paymentMethod || 'KHQR'}
                      </span>
                      <span className="text-[11px] text-emerald-600 font-semibold">
                        {language === 'km'
                          ? (ord.paymentStatus || 'PAID').toUpperCase() === 'PAID'
                            ? 'បានទូទាត់'
                            : (ord.paymentStatus || 'PAID').toUpperCase() === 'PENDING'
                              ? 'រង់ចាំទូទាត់'
                              : ord.paymentStatus
                          : ord.paymentStatus || 'PAID'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                      {formatUSD(ord.total)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <select
                        value={ord.status.toLowerCase().replace(/\s+/g, '_')}
                        onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                        className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                      >
                        <option value="confirmed">{translateOrderStatusLabel('Confirmed', language)}</option>
                        <option value="processing">{translateOrderStatusLabel('Processing', language)}</option>
                        <option value="shipped">{translateOrderStatusLabel('Shipped', language)}</option>
                        <option value="out_for_delivery">{translateOrderStatusLabel('Out for Delivery', language)}</option>
                        <option value="delivered">{translateOrderStatusLabel('Delivered', language)}</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(ord)}
                        className="p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        title={language === 'km' ? 'មើលព័ត៌មានលម្អិតការបញ្ជាទិញ' : 'View Order Details'}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedOrder(null)}
          title={`${language === 'km' ? 'ព័ត៌មានលម្អិតការបញ្ជាទិញ៖' : 'Order Details:'} ${selectedOrder.id}`}
          size="lg"
        >
          <div className="space-y-6 text-xs">
            {/* Customer & Address Header */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  {language === 'km' ? 'អតិថិជន និងព័ត៌មានទំនាក់ទំនង' : 'Customer & Contact'}
                </span>
                <p className="font-bold text-slate-900 text-sm">{selectedOrder.customerName}</p>
                <p className="text-slate-600">{selectedOrder.customerPhone}</p>
                <p className="text-slate-500">{selectedOrder.customerEmail || 'customer@techtonic.store'}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  {language === 'km' ? 'ទីតាំងដឹកជញ្ជូន និងក្រុមហ៊ុនដឹកជញ្ជូន' : 'Delivery Destination & Courier'}
                </span>
                <p className="text-slate-800">{selectedOrder.shippingAddress?.address || 'Street 310, BKK1'}</p>
                <p className="text-slate-600 text-xs">
                  {selectedOrder.shippingAddress?.city || 'Phnom Penh'}, {selectedOrder.shippingAddress?.province || 'Phnom Penh'}
                </p>
                <div className="mt-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">
                      {selectedOrder.deliveryPartner || selectedOrder.tracking?.courier || 'Vireak Buntham (VET)'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {language === 'km' ? 'លេខតាមដាន៖' : 'Tracking:'} {selectedOrder.trackingNumber || selectedOrder.tracking?.trackingCode || 'VET-KH-889210'}
                    </span>
                  </div>
                  <a
                    href={selectedOrder.carrierWebsite || (selectedOrder.deliveryPartner?.includes('J&T') ? 'https://www.jtexpresskh.com/' : 'https://vireakbuntham.com/')}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 underline"
                  >
                    <span>{language === 'km' ? 'តំណភ្ជាប់តាមដាន' : 'Carrier Link'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Line items list */}
            <div>
              <span className="font-bold text-slate-900 uppercase text-[10px] tracking-wider block mb-2">
                {language === 'km' ? 'បញ្ជីទំនិញដែលបានបញ្ជាទិញ' : 'Purchased Hardware Items'}
              </span>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {(selectedOrder.items || []).map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-10 h-10 rounded-lg object-cover bg-slate-50 border border-slate-200"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block">{item.name}</span>
                        <span className="text-slate-400">
                          {language === 'km' ? 'ចំនួន៖' : 'Qty:'} {item.quantity} {item.selectedVariant ? `• ${item.selectedVariant}` : ''}
                        </span>
                      </div>
                    </div>
                    <div className="text-right font-mono font-bold text-slate-900">
                      {formatUSD(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Totals */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex justify-between">
                <span>{language === 'km' ? 'តម្លៃទំនិញសរុប៖' : 'Subtotal:'}</span>
                <span className="font-semibold">{formatUSD(selectedOrder.subtotal || selectedOrder.total)}</span>
              </div>
              <div className="flex justify-between">
                <span>{language === 'km' ? 'ថ្លៃដឹកជញ្ជូន៖' : 'Shipping:'}</span>
                <span className="font-semibold">
                  {selectedOrder.shippingFee === 0
                    ? language === 'km'
                      ? 'ឥតគិតថ្លៃ'
                      : 'FREE'
                    : formatUSD(selectedOrder.shippingFee || 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-200">
                <span>{language === 'km' ? 'សរុបរួម៖' : 'Grand Total:'}</span>
                <span className="font-mono text-base text-blue-600">{formatUSD(selectedOrder.total)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setShowInvoiceModal(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-blue-600"
              >
                <FileText className="w-4 h-4" />
                <span>{language === 'km' ? 'មើលវិក្កយបត្រពេញលេញ' : 'View Full Invoice Sheet'}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800"
              >
                {language === 'km' ? 'បិទ' : 'Close'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Nested Full Tax Invoice Modal */}
      {showInvoiceModal && selectedOrder && (
        <Modal
          isOpen={true}
          onClose={() => setShowInvoiceModal(false)}
          title={language === 'km' ? 'បោះពុម្ពវិក្កយបត្រពន្ធ' : 'Print Tax Invoice'}
          size="xl"
        >
          <Invoice order={selectedOrder} onBack={() => setShowInvoiceModal(false)} />
        </Modal>
      )}
    </div>
  );
}
