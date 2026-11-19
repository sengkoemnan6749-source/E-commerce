import React, { useState, useEffect } from 'react';
import { Search, Eye, Truck, FileText, CheckCircle2, ExternalLink, Send } from 'lucide-react';
import { formatOrderStatus } from '../../services/orderService';
import { adminService } from '../../services/adminService';
import { formatUSD, formatKHR } from '../../utils/formatPrice';
import { formatDate } from '../../utils/formatDate';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Invoice from '../../components/order/Invoice';
import { useToast, useLanguage } from '../../store/StoreContext';
import { translateOrderStatusLabel } from '../../utils/translations';
import { toSafeExternalUrl } from '../../utils/urlSecurity';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [orderTgStatus, setOrderTgStatus] = useState(null);
  const [tgModalOpen, setTgModalOpen] = useState(false);
  const [botTokenInput, setBotTokenInput] = useState('');
  const [tgBusy, setTgBusy] = useState(false);
  const { addToast } = useToast();
  const { language } = useLanguage();

  const loadOrderTgStatus = async () => {
    try {
      const data = await adminService.getOrderTelegramStatus();
      setOrderTgStatus(data);
    } catch {
      // ignore initial telegram check error
    }
  };

  const refreshOrders = async () => {
    try {
      const res = await adminService.getOrders({ limit: 100 });
      setOrders(res.orders || []);
    } catch (err) {
      addToast(err?.message || 'Failed to load orders.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshOrders();
    loadOrderTgStatus();
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        refreshOrders();
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);
    const intervalId = window.setInterval(handleFocus, 15000);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
      window.clearInterval(intervalId);
    };
  }, []);

  const handleSaveOrderBotToken = async (e) => {
    e.preventDefault();
    if (!botTokenInput.trim()) return;
    setTgBusy(true);
    try {
      const data = await adminService.configureOrderTelegramBot(botTokenInput.trim());
      setOrderTgStatus(data);
      setBotTokenInput('');
      addToast(
        data?.connected
          ? (language === 'km' ? `បានភ្ជាប់ @${data.botUsername} ជោគជ័យ!` : `Connected @${data.botUsername} successfully!`)
          : (language === 'km'
              ? `បានរក្សាទុក @${data?.botUsername} — សូមបើក Telegram រួចចុច Start បន្ទាប់មកចុច "ភ្ជាប់ Telegram"`
              : `Saved @${data?.botUsername} — open Telegram, tap Start, then click "Connect Telegram".`),
        'success'
      );
    } catch (err) {
      addToast(err?.message || (language === 'km' ? 'Token មិនត្រឹមត្រូវ' : 'Invalid bot token'), 'error');
    } finally {
      setTgBusy(false);
    }
  };

  const handleConnectOrderTg = async () => {
    setTgBusy(true);
    try {
      const data = await adminService.connectOrderTelegramBot();
      setOrderTgStatus(data);
      addToast(
        language === 'km' ? 'បានភ្ជាប់ Telegram Order Bot ជោគជ័យ!' : 'Order Telegram Bot connected!',
        'success'
      );
    } catch (err) {
      addToast(err?.message || (language === 'km' ? 'មិនអាចភ្ជាប់បានទេ — សូមចុច Start ក្នុង Bot ជាមុនសិន' : 'Could not connect — send /start to your bot first.'), 'error');
    } finally {
      setTgBusy(false);
    }
  };

  const handleTestOrderTg = async () => {
    setTgBusy(true);
    try {
      await adminService.testOrderTelegramBot();
      addToast(
        language === 'km' ? 'បានផ្ញើសារតេស្តចូល Telegram Order Bot!' : 'Test alert sent to Order Telegram Bot!',
        'success'
      );
    } catch (err) {
      addToast(err?.message || (language === 'km' ? 'ផ្ញើសារតេស្តមិនបានសម្រេច' : 'Failed to send test alert'), 'error');
    } finally {
      setTgBusy(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await adminService.updateOrderStatus(orderId, newStatus);
      window.dispatchEvent(new CustomEvent('techtonic:admin-updated'));
      await refreshOrders();
      addToast(
        language === 'km'
          ? `បានធ្វើបច្ចុប្បន្នភាពការបញ្ជាទិញ ${orderId} ទៅជា ${translateOrderStatusLabel(newStatus, 'km')}`
          : `Order ${orderId} updated to ${formatOrderStatus(newStatus)}`,
        'success'
      );
    } catch (err) {
      addToast(err?.message || 'Failed to update order status.', 'error');
    }
  };

  const filtered = orders.filter((o) => {
    const normalizedStatus = (o.status || '').toLowerCase().replace(/\s+/g, '_');
    if (statusFilter !== 'All' && normalizedStatus !== statusFilter.toLowerCase()) {
      return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const custName = o.customerName || o.customer?.fullName || '';
      const custPhone = o.customerPhone || o.customer?.phone || '';
      return (
        o.id.toLowerCase().includes(q) ||
        custName.toLowerCase().includes(q) ||
        custPhone.includes(q)
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

        <button
          type="button"
          onClick={() => setTgModalOpen(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              orderTgStatus?.connected
                ? 'bg-emerald-500'
                : orderTgStatus?.botConfigured
                ? 'bg-amber-500'
                : 'bg-slate-300'
            }`}
          />
          <Send className="w-3.5 h-3.5 text-blue-600" />
          <span>
            {orderTgStatus?.connected && orderTgStatus?.botUsername
              ? `@${orderTgStatus.botUsername}`
              : language === 'km'
              ? 'តភ្ជាប់ Order Telegram Bot'
              : 'Order Telegram Bot'}
          </span>
        </button>
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
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    {language === 'km' ? 'កំពុងផ្ទុកការបញ្ជាទិញ...' : 'Loading orders from database...'}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
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
                      <span className="font-semibold text-slate-900 block">{ord.customerName || ord.customer?.fullName || 'Customer'}</span>
                      <span className="text-[11px] text-slate-400">{ord.customerPhone}</span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-medium text-slate-800 block text-[11px]">
                        {ord.deliveryPartner || ord.tracking?.courier || 'Vireak Buntham (VET)'}
                      </span>
                      <a
                        href={toSafeExternalUrl(
                          ord.carrierWebsite,
                          ord.deliveryPartner?.includes('J&T')
                            ? 'https://www.jtexpresskh.com/'
                            : 'https://vireakbuntham.com/'
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
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
                      <span className="block">{formatUSD(ord.total)}</span>
                      {String(ord.paymentMethod || '').toLowerCase().includes('(khr)') && (
                        <span className="text-[11px] font-mono font-semibold text-emerald-600 block">
                          {formatKHR(ord.total)}
                        </span>
                      )}
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
                    href={toSafeExternalUrl(
                      selectedOrder.carrierWebsite,
                      selectedOrder.deliveryPartner?.includes('J&T')
                        ? 'https://www.jtexpresskh.com/'
                        : 'https://vireakbuntham.com/'
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
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

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>{language === 'km' ? 'មើលវិក្កយបត្រពេញលេញ' : 'View Full Invoice Sheet'}</span>
                </button>
                <a
                  href={`/orders/${encodeURIComponent(selectedOrder.id)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{language === 'km' ? 'តាមដានផ្ទាល់ (ទំព័រអតិថិជន)' : 'Open Live Tracking'}</span>
                </a>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
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

      {/* Order Telegram Bot Configuration Modal */}
      {tgModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setTgModalOpen(false)}
          title={language === 'km' ? 'កំណត់ Telegram Bot សម្រាប់ការបញ្ជាទិញ' : 'Order Telegram Bot Settings'}
          size="md"
        >
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-900">
                  {orderTgStatus?.connected
                    ? (language === 'km' ? 'បានភ្ជាប់រួចរាល់' : 'Connected')
                    : orderTgStatus?.botConfigured
                    ? (language === 'km' ? 'រង់ចាំចុច Start ក្នុង Telegram' : 'Waiting for /start in Telegram')
                    : (language === 'km' ? 'មិនទាន់កំណត់ Bot ថ្មីទេ' : 'Dedicated Order Bot Not Configured')}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {orderTgStatus?.botConfigured
                    ? `@${orderTgStatus.botUsername}${orderTgStatus.chatUsername ? ` • @${orderTgStatus.chatUsername}` : ''}`
                    : (language === 'km'
                        ? 'បច្ចុប្បន្នមិនទាន់មាន Order Bot ដាច់ដោយឡែកទេ — បង្កើតតាម @BotFather រួចបិទភ្ជាប់ Token ខាងក្រោម។'
                        : 'Create a dedicated bot with @BotFather (/newbot) and paste its HTTP API token below.')}
                </p>
              </div>
              {orderTgStatus?.botConfigured && orderTgStatus?.botUsername && (
                <a
                  href={`https://t.me/${orderTgStatus.botUsername}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 shrink-0"
                >
                  <span>@{orderTgStatus.botUsername}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <form onSubmit={handleSaveOrderBotToken} className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                {language === 'km' ? 'BotFather HTTP API Token' : 'BotFather HTTP API Token'}
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={botTokenInput}
                  onChange={(e) => setBotTokenInput(e.target.value)}
                  placeholder="123456789:AAH..."
                  className="flex-1 h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={tgBusy || !botTokenInput.trim()}
                  className="h-9 px-3.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer shrink-0"
                >
                  {language === 'km' ? 'រក្សាទុក Token' : 'Save Token'}
                </button>
              </div>
            </form>

            {orderTgStatus?.botConfigured && (
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] text-slate-500">
                  {language === 'km'
                    ? `១) បើក @${orderTgStatus.botUsername} ហើយចុច Start  ២) ចុច "ភ្ជាប់" ឬ "តេស្ត"`
                    : `1) Open @${orderTgStatus.botUsername} & tap Start  2) Click Connect or Test`}
                </p>
                <div className="flex items-center gap-2">
                  {!orderTgStatus?.connected ? (
                    <button
                      type="button"
                      disabled={tgBusy}
                      onClick={handleConnectOrderTg}
                      className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
                    >
                      {tgBusy
                        ? (language === 'km' ? 'កំពុងភ្ជាប់...' : 'Connecting...')
                        : (language === 'km' ? 'ភ្ជាប់ Telegram' : 'Connect Telegram')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={tgBusy}
                      onClick={handleTestOrderTg}
                      className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold disabled:opacity-50 cursor-pointer"
                    >
                      {language === 'km' ? 'តេស្ត Bot' : 'Test Alert'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
