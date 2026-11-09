import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Truck,
  ArrowLeft,
  MapPin,
  Phone,
  ShieldCheck,
  Clock,
  CheckCircle2,
  ExternalLink,
  Search,
  Copy,
  Package,
  Calendar,
  CreditCard,
  ChevronDown,
  Navigation,
  Headphones,
  Check
} from 'lucide-react';
import { orderService } from '../../services/orderService';
import { productService } from '../../services/productService';
import OrderStepper from '../../components/order/OrderStepper';
import DeliveryMap from './DeliveryMap';
import { formatUSD } from '../../utils/formatPrice';
import { formatDate } from '../../utils/formatDate';
import { useToast, useAuth } from '../../store/StoreContext';

const FALLBACK_ORDER = {
  id: 'ORD-20260924-0001',
  status: 'Out for Delivery',
  createdAt: '2026-09-24T09:30:00.000Z',
  customerName: 'Sara Meng',
  customerPhone: '+855 12 345 678',
  shippingAddress: {
    fullName: 'Sara Meng',
    phone: '+855 12 345 678',
    address: 'Street 310, Building 24, BKK1',
    city: 'Phnom Penh',
    province: 'Phnom Penh',
    postalCode: '120101'
  },
  items: [
    {
      id: 'prod-001',
      name: 'TechTonic ANC Pro Headphones',
      price: 109.99,
      quantity: 1,
      selectedVariant: 'Titanium Black'
    }
  ],
  total: 109.99,
  deliveryPartner: 'Vireak Buntham Express (VET)',
  trackingNumber: 'VET-KH-889210',
  carrier: 'GrabExpress Delivery Phnom Penh',
  estimatedDelivery: 'Today by 5:30 PM'
};

export default function OrderTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { isAuthenticated } = useAuth();

  const allOrders = useMemo(() => {
    const list = orderService.getOrders();
    return list.length > 0 ? list : [FALLBACK_ORDER];
  }, []);

  const [searchInput, setSearchInput] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const [order, setOrder] = useState(() => {
    if (id) {
      const found = orderService.getOrderById(id);
      if (found) return found;
    }
    return orderService.getOrders()[0] || FALLBACK_ORDER;
  });

  // Keep order synchronized whenever the route param id changes
  useEffect(() => {
    if (id) {
      const found = orderService.getOrderById(id);
      if (found) {
        setOrder(found);
        return;
      }
    }
    const first = orderService.getOrders()[0];
    if (first) {
      setOrder(first);
    }
  }, [id]);

  // Handle manual order search
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchInput.trim();
    if (!q) return;

    const found = orderService.getOrderById(q);
    if (found) {
      setOrder(found);
      addToast(`Showing tracking for order ${found.id}`, 'success');
      navigate(`/orders/${found.id}`);
      setSearchInput('');
    } else {
      addToast(`Order "${q}" not found. Showing active demo order.`, 'info');
    }
  };

  // Copy tracking code to clipboard
  const handleCopyTracking = () => {
    const code = order.trackingNumber || 'VET-KH-889210';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setIsCopied(true);
      addToast(`Tracking code ${code} copied to clipboard!`, 'success');
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // Interactive status switcher for demonstration
  const handleUpdateStatus = (newStatus) => {
    const updated = orderService.updateOrderStatus(order.id, newStatus);
    setOrder({ ...updated });
    addToast(`Order status updated to: ${newStatus}`, 'info');
  };

  // Status-dependent headline and descriptions
  const getStatusDisplay = () => {
    const s = (order.status || '').toLowerCase();
    if (s.includes('deliver') && !s.includes('out')) {
      return {
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dotColor: 'bg-emerald-500',
        headline: 'Package Delivered',
        etaText: 'Delivered Today at 5:24 PM',
        subtext: 'Your package was safely delivered and signed by customer Sara Meng.',
        alertBg: 'bg-emerald-50/70 border-emerald-200/80 text-emerald-900',
        alertIconColor: 'text-emerald-600',
      };
    }
    if (s.includes('out')) {
      return {
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        dotColor: 'bg-blue-600 animate-pulse',
        headline: 'Out for Delivery — Arriving Today',
        etaText: order.estimatedDelivery || 'Today by 5:30 PM',
        subtext: 'Courier Sokha Kong (Honda Dream 125) is in transit to Street 310, BKK1.',
        alertBg: 'bg-blue-50/70 border-blue-200/80 text-blue-900',
        alertIconColor: 'text-blue-600',
      };
    }
    if (s.includes('ship')) {
      return {
        badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        dotColor: 'bg-indigo-600',
        headline: 'In Transit — Departed Central Depot',
        etaText: order.estimatedDelivery || 'Within 24 Hours',
        subtext: 'Package departed Toul Kork Central Logistics Hub and is en route.',
        alertBg: 'bg-indigo-50/70 border-indigo-200/80 text-indigo-900',
        alertIconColor: 'text-indigo-600',
      };
    }
    if (s.includes('process')) {
      return {
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
        dotColor: 'bg-amber-500',
        headline: 'Processing & Quality Inspection',
        etaText: 'Estimated Dispatch: Today',
        subtext: 'Hardware verified, warranty barcode assigned, and package sealed for transit.',
        alertBg: 'bg-amber-50/70 border-amber-200/80 text-amber-900',
        alertIconColor: 'text-amber-600',
      };
    }
    return {
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
      dotColor: 'bg-blue-600',
      headline: 'Order Confirmed',
      etaText: 'Estimated Dispatch: Tomorrow',
      subtext: 'Payment received via Bakong KHQR. Order queued for fulfillment team.',
      alertBg: 'bg-slate-50 border-slate-200 text-slate-800',
      alertIconColor: 'text-slate-600',
    };
  };

  const statusInfo = getStatusDisplay();

  // Dynamic milestone activity timeline
  const getMilestones = () => {
    const s = (order.status || '').toLowerCase();
    const milestones = [
      {
        title: 'Order Confirmed & Payment Verified',
        time: 'Today • 09:30 AM',
        location: 'TechTonic Online Store • Bakong KHQR Paid',
        done: true,
      },
    ];

    if (s.includes('process') || s.includes('ship') || s.includes('out') || s.includes('deliver')) {
      milestones.unshift({
        title: 'Package Assembled & Quality Scanned',
        time: 'Today • 11:15 AM',
        location: 'TechTonic Central Toul Kork Hub (St 598)',
        done: true,
      });
    }

    if (s.includes('ship') || s.includes('out') || s.includes('deliver')) {
      milestones.unshift({
        title: 'Dispatched with Logistics Courier',
        time: 'Today • 01:45 PM',
        location: 'Departed via GrabExpress Fleet',
        done: true,
      });
    }

    if (s.includes('out') || s.includes('deliver')) {
      milestones.unshift({
        title: 'Courier In Transit for Final Mile Delivery',
        time: 'Today • 04:30 PM',
        location: 'Approaching Monivong Blvd & Street 310, BKK1',
        done: true,
      });
    }

    if (s.includes('deliver') && !s.includes('out')) {
      milestones.unshift({
        title: 'Package Successfully Delivered',
        time: 'Today • 05:24 PM',
        location: 'Building 24, St 310, BKK1 • Signed by Sara Meng',
        done: true,
      });
    }

    return milestones;
  };

  const milestones = getMilestones();

  return (
    <div className="bg-[#f8fafc] min-h-screen py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Header & Context Actions Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 mb-6">
          <div className="flex items-center gap-3">
            <Link
              to={isAuthenticated ? '/account/orders' : '/shop'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:text-blue-600 hover:border-blue-300 transition-colors shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{isAuthenticated ? 'My Orders' : 'Storefront'}</span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-slate-500">Live Delivery Tracking</span>
          </div>

          {/* Quick Search & Demo Switcher in one sleek row */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Compact Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search order ID (e.g. ORD-...)"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-mono w-56 sm:w-64 shadow-xs"
              />
            </form>

            {/* Discreet Stage Switcher for Testing */}
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-xs">
              <span className="text-[11px] font-medium text-slate-500">Demo Stage:</span>
              <select
                value={(order.status || '').toLowerCase().replace(/\s+/g, '_')}
                onChange={(e) => handleUpdateStatus(e.target.value)}
                className="text-[11px] font-bold text-blue-600 bg-transparent border-none focus:outline-none cursor-pointer"
              >
                <option value="confirmed">1. Confirmed</option>
                <option value="processing">2. Processing</option>
                <option value="shipped">3. Shipped</option>
                <option value="out_for_delivery">4. Out for Delivery</option>
                <option value="delivered">5. Delivered</option>
              </select>
            </div>

            {/* Quick Demo Order Picker */}
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-xs">
              <span className="text-[11px] font-medium text-slate-500">Demo Order:</span>
              <select
                value={order.id}
                onChange={(e) => {
                  const targetOrder = allOrders.find((o) => o.id === e.target.value);
                  if (targetOrder) {
                    setOrder(targetOrder);
                    navigate(`/orders/${targetOrder.id}`);
                  }
                }}
                className="text-[11px] font-bold text-slate-700 bg-transparent border-none focus:outline-none cursor-pointer font-mono"
              >
                {allOrders.map((ord) => (
                  <option key={ord.id} value={ord.id}>
                    {ord.id} ({ord.status})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Hero Order Header & Shipment Stepper Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-slate-100">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-md">
                  {order.id}
                </span>
                <button
                  type="button"
                  onClick={handleCopyTracking}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-blue-600 transition"
                  title="Copy Tracking Number"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-600 font-semibold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Tracking Code</span>
                    </>
                  )}
                </button>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {statusInfo.headline}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Estimated Delivery: <strong className="text-slate-800">{statusInfo.etaText}</strong> • Placed on {formatDate(order.createdAt)}
              </p>
            </div>

            <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
              <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border ${statusInfo.badgeColor} shadow-xs`}>
                <span className={`w-2 h-2 rounded-full ${statusInfo.dotColor}`} />
                <span className="capitalize">{order.status || 'Processing'}</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Partner: {order.deliveryPartner || 'GrabExpress Phnom Penh'}
              </span>
            </div>
          </div>

          {/* Stepper Component */}
          <div className="py-2">
            <OrderStepper currentStatus={order.status} />
          </div>

          {/* Live Status Callout Banner */}
          <div className={`mt-3 p-4 rounded-2xl border flex items-start sm:items-center gap-3 text-xs ${statusInfo.alertBg}`}>
            <Clock className={`w-4 h-4 flex-shrink-0 mt-0.5 sm:mt-0 ${statusInfo.alertIconColor}`} />
            <div className="flex-1">
              <strong className="block sm:inline font-bold mr-1">Live Shipment Status:</strong>
              <span>{statusInfo.subtext}</span>
            </div>
          </div>
        </div>

        {/* 2-Column Responsive Body Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Column: Map + Activity Timeline (7 Columns) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Live Phnom Penh Courier Delivery Map */}
            <DeliveryMap orderStatus={order.status} shippingAddress={order.shippingAddress} />

            {/* Shipment Activity Timeline */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Shipment Milestone History</h3>
                  <p className="text-xs text-slate-500">Real-time gateway timestamps for Phnom Penh delivery route</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {milestones.length} Events Logged
                </span>
              </div>

              <div className="relative pl-6 space-y-6 border-l-2 border-slate-100 ml-3">
                {milestones.map((item, idx) => (
                  <div key={idx} className="relative">
                    {/* Node Circle */}
                    <div className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 ${idx === 0 ? 'bg-blue-600 border-white ring-4 ring-blue-100' : 'bg-slate-300 border-white'}`} />
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className={`text-xs font-bold ${idx === 0 ? 'text-blue-600' : 'text-slate-900'}`}>
                        {item.title}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 font-medium">
                        {item.time}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{item.location}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Column: Items + Address + Courier Partner (5 Columns) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Package Contents Card */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">Package Contents</h3>
                </div>
                <span className="text-xs text-slate-500 font-semibold">
                  {(order.items || []).length} items
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {(order.items || []).map((item, idx) => {
                  const cleanImg = productService.getCleanProductImage(item, item.selectedVariant || item.variant);
                  return (
                    <div key={idx} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200/80 p-1 flex-shrink-0 flex items-center justify-center">
                          <img src={cleanImg} alt={item.name} className="w-full h-full object-contain" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 block truncate">
                            {item.name}
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            Qty: {item.quantity} {item.selectedVariant ? `• ${item.selectedVariant}` : ''}
                          </span>
                        </div>
                      </div>
                      <span className="font-bold text-slate-900 font-mono text-right shrink-0">
                        {formatUSD(item.price * item.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Price Breakdown */}
              <div className="pt-4 mt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono text-slate-900 font-medium">
                    {formatUSD((order.items || []).reduce((acc, i) => acc + (i.price * i.quantity), 0) || order.total)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Phnom Penh Express Delivery:</span>
                  <span className="font-semibold text-emerald-600">FREE</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-100 text-sm font-bold text-slate-900">
                  <span>Total Amount Paid:</span>
                  <span className="text-base text-blue-600 font-mono">
                    {formatUSD(order.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Recipient Information Card */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6">
              <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100">
                <MapPin className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Delivery Address</h3>
              </div>
              <div className="space-y-1.5 text-xs text-slate-700">
                <p className="font-extrabold text-sm text-slate-900">
                  {order.shippingAddress?.fullName || order.customerName || 'Sara Meng'}
                </p>
                <p className="flex items-center gap-1.5 text-slate-500">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{order.shippingAddress?.phone || order.customerPhone || '+855 12 345 678'}</span>
                </p>
                <p className="text-slate-600 pt-1 leading-relaxed">
                  {order.shippingAddress?.address || 'Street 310, Building 24, BKK1'},{' '}
                  {order.shippingAddress?.city || 'Phnom Penh'},{' '}
                  {order.shippingAddress?.province || 'Cambodia'} {order.shippingAddress?.postalCode || '120101'}
                </p>
              </div>

              <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Contactless delivery protocol verified</span>
              </div>
            </div>

            {/* Logistics Service Partner Card */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">Logistics Carrier</h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active Partner
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-extrabold text-slate-900">
                    {order.deliveryPartner || 'Vireak Buntham Express (VET)'}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200 shadow-2xs">
                    {order.trackingNumber || 'VET-KH-889210'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Schedule: {order.estimatedDelivery || 'Within 24-48 Hours'}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <a
                  href={order.carrierWebsite || (order.deliveryPartner?.includes('J&T') ? 'https://www.jtexpresskh.com/' : 'https://vireakbuntham.com/')}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
                >
                  <span>Track on Carrier Website</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <div className="flex items-center gap-2 pt-1">
                  <a
                    href="https://vireakbuntham.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 text-center py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-slate-600 transition"
                  >
                    VET Express
                  </a>
                  <a
                    href="https://www.jtexpresskh.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 text-center py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-slate-600 transition"
                  >
                    J&T Express
                  </a>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Support: Telegram @techtonic_kh</span>
                <span className="font-mono text-slate-700 font-semibold">+855 23 999 888</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
