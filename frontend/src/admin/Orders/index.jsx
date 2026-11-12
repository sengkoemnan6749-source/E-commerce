import React, { useState } from 'react';
import { Search, Eye, Truck, FileText, CheckCircle2, ExternalLink } from 'lucide-react';
import { orderService, formatOrderStatus } from '../../services/orderService';
import { formatUSD } from '../../utils/formatPrice';
import { formatDate } from '../../utils/formatDate';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Invoice from '../../components/order/Invoice';
import { useToast } from '../../store/StoreContext';

export default function AdminOrders() {
  const [orders, setOrders] = useState(orderService.getOrders());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const { addToast } = useToast();

  const refreshOrders = () => {
    setOrders(orderService.getOrders());
  };

  const handleStatusChange = (orderId, newStatus) => {
    orderService.updateOrderStatus(orderId, newStatus);
    refreshOrders();
    addToast(`Order ${orderId} updated to ${formatOrderStatus(newStatus)}`, 'success');
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Orders Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit fulfillment workflows, courier handoffs, and manage payment statuses.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200/90 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by order ID, customer name, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="All">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Courier Service</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(ord)}
                      className="hover:underline"
                    >
                      {ord.id}
                    </button>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 block">{ord.customerName}</span>
                    <span className="text-[10px] text-slate-400">{ord.customerPhone}</span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-800 block text-[11px]">
                      {ord.deliveryPartner || ord.tracking?.courier || 'Vireak Buntham (VET)'}
                    </span>
                    <a
                      href={ord.carrierWebsite || (ord.deliveryPartner?.includes('J&T') ? 'https://www.jtexpresskh.com/' : 'https://vireakbuntham.com/')}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-blue-600 hover:underline inline-flex items-center gap-1 font-mono"
                    >
                      <span>{ord.trackingNumber || ord.tracking?.trackingCode || 'VET-KH-889210'}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </td>

                  <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                    {formatDate(ord.createdAt)}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-800 block">
                      {ord.paymentMethod || 'KHQR'}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold uppercase">
                      {ord.paymentStatus || 'PAID'}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                    {formatUSD(ord.total)}
                  </td>

                  <td className="py-3.5 px-4">
                    <select
                      value={ord.status.toLowerCase().replace(/\s+/g, '_')}
                      onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                      className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    >
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="out_for_delivery">Out for Delivery</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(ord)}
                      className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                      title="View Order Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedOrder(null)}
          title={`Order Details: ${selectedOrder.id}`}
          size="lg"
        >
          <div className="space-y-6 text-xs">
            {/* Customer & Address Header */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Customer & Contact
                </span>
                <p className="font-bold text-slate-900 text-sm">{selectedOrder.customerName}</p>
                <p className="text-slate-600">{selectedOrder.customerPhone}</p>
                <p className="text-slate-500">{selectedOrder.customerEmail || 'customer@techtonic.store'}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Delivery Destination & Courier
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
                      Tracking: {selectedOrder.trackingNumber || selectedOrder.tracking?.trackingCode || 'VET-KH-889210'}
                    </span>
                  </div>
                  <a
                    href={selectedOrder.carrierWebsite || (selectedOrder.deliveryPartner?.includes('J&T') ? 'https://www.jtexpresskh.com/' : 'https://vireakbuntham.com/')}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 underline"
                  >
                    <span>Carrier Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Line items list */}
            <div>
              <span className="font-bold text-slate-900 uppercase text-[10px] tracking-wider block mb-2">
                Purchased Hardware Items
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
                          Qty: {item.quantity} {item.selectedVariant ? `• ${item.selectedVariant}` : ''}
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
                <span>Subtotal:</span>
                <span className="font-semibold">{formatUSD(selectedOrder.subtotal || selectedOrder.total)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span className="font-semibold">{selectedOrder.shippingFee === 0 ? 'FREE' : formatUSD(selectedOrder.shippingFee || 0)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-200">
                <span>Grand Total:</span>
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
                <span>View Full Invoice Sheet</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800"
              >
                Close
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
          title="Print Tax Invoice"
          size="xl"
        >
          <Invoice order={selectedOrder} onBack={() => setShowInvoiceModal(false)} />
        </Modal>
      )}
    </div>
  );
}
