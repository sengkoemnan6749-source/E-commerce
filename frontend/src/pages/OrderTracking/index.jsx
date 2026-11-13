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
import { orderService, formatOrderStatus } from '../../services/orderService';
import { productService } from '../../services/productService';
import OrderStepper from '../../components/order/OrderStepper';
import DeliveryMap from './DeliveryMap';
import { formatUSD } from '../../utils/formatPrice';
import { formatDate } from '../../utils/formatDate';
import { useToast, useAuth, useLanguage } from '../../store/StoreContext';
import { translateOrderStatusLabel } from '../../utils/translations';

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
  const { language } = useLanguage();

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
      addToast(
        language === 'km'
          ? `កំពុងបង្ហាញការតាមដានសម្រាប់ការកុម្ម៉ង់ ${found.id}`
          : `Showing tracking for order ${found.id}`,
        'success'
      );
      navigate(`/orders/${found.id}`);
      setSearchInput('');
    } else {
      addToast(
        language === 'km'
          ? `រកមិនឃើញការកុម្ម៉ង់ "${q}" ទេ។ កំពុងបង្ហាញការកុម្ម៉ង់សាកល្បង។`
          : `Order "${q}" not found. Showing active demo order.`,
        'info'
      );
    }
  };

  // Copy tracking code to clipboard
  const handleCopyTracking = () => {
    const code = order.trackingNumber || 'VET-KH-889210';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setIsCopied(true);
      addToast(
        language === 'km'
          ? `បានចម្លងលេខកូដតាមដាន ${code} ទៅកាន់ក្ដារតម្បៀតខ្ទាស់!`
          : `Tracking code ${code} copied to clipboard!`,
        'success'
      );
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // Interactive status switcher for demonstration
  const handleUpdateStatus = (newStatus) => {
    const updated = orderService.updateOrderStatus(order.id, newStatus);
    setOrder({ ...updated });
    const statusLabel = translateOrderStatusLabel(formatOrderStatus(newStatus), language);
    addToast(
      language === 'km'
        ? `ស្ថានភាពកុម្ម៉ង់ត្រូវបានប្តូរទៅ៖ ${statusLabel}`
        : `Order status updated to: ${statusLabel}`,
      'info'
    );
  };

  // Status-dependent headline and descriptions
  const getStatusDisplay = () => {
    const s = (order.status || '').toLowerCase();
    if (s.includes('deliver') && !s.includes('out')) {
      return {
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dotColor: 'bg-emerald-500',
        headline: language === 'km' ? 'កញ្ចប់ទំនិញត្រូវបានប្រគល់ជោគជ័យ' : 'Package Delivered',
        etaText: language === 'km' ? 'បានប្រគល់ថ្ងៃនេះ ម៉ោង ៥:២៤ ល្ងាច' : 'Delivered Today at 5:24 PM',
        subtext:
          language === 'km'
            ? 'កញ្ចប់ទំនិញរបស់អ្នកត្រូវបានប្រគល់ដោយសុវត្ថិភាព និងចុះហត្ថលេខាដោយអតិថិជន Sara Meng។'
            : 'Your package was safely delivered and signed by customer Sara Meng.',
        alertBg: 'bg-emerald-50/70 border-emerald-200/80 text-emerald-900',
        alertIconColor: 'text-emerald-600',
      };
    }
    if (s.includes('out')) {
      return {
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        dotColor: 'bg-blue-600 animate-pulse',
        headline: language === 'km' ? 'កំពុងដឹកជញ្ជូន — មកដល់ថ្ងៃនេះ' : 'Out for Delivery — Arriving Today',
        etaText: order.estimatedDelivery || (language === 'km' ? 'ថ្ងៃនេះមុនម៉ោង ៥:៣០ ល្ងាច' : 'Today by 5:30 PM'),
        subtext:
          language === 'km'
            ? 'អ្នកដឹកជញ្ជូន Sokha Kong (Honda Dream 125) កំពុងធ្វើដំណើរទៅផ្លូវ 310, BKK1។'
            : 'Courier Sokha Kong (Honda Dream 125) is in transit to Street 310, BKK1.',
        alertBg: 'bg-blue-50/70 border-blue-200/80 text-blue-900',
        alertIconColor: 'text-blue-600',
      };
    }
    if (s.includes('ship')) {
      return {
        badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        dotColor: 'bg-indigo-600',
        headline: language === 'km' ? 'កំពុងដឹកជញ្ជូន — ចេញពីមជ្ឈមណ្ឌលកណ្ដាល' : 'In Transit — Departed Central Depot',
        etaText: order.estimatedDelivery || (language === 'km' ? 'ក្នុងរយៈពេល ២៤ ម៉ោង' : 'Within 24 Hours'),
        subtext:
          language === 'km'
            ? 'កញ្ចប់ទំនិញបានចេញពីមជ្ឈមណ្ឌលដឹកជញ្ជូនទួលគោក ហើយកំពុងធ្វើដំណើរ។'
            : 'Package departed Toul Kork Central Logistics Hub and is en route.',
        alertBg: 'bg-indigo-50/70 border-indigo-200/80 text-indigo-900',
        alertIconColor: 'text-indigo-600',
      };
    }
    if (s.includes('process')) {
      return {
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
        dotColor: 'bg-amber-500',
        headline: language === 'km' ? 'កំពុងរៀបចំ និងត្រួតពិនិត្យគុណភាព' : 'Processing & Quality Inspection',
        etaText: language === 'km' ? 'ប៉ាន់ស្មានដឹកចេញ៖ ថ្ងៃនេះ' : 'Estimated Dispatch: Today',
        subtext:
          language === 'km'
            ? 'ឧបករណ៍ត្រូវបានត្រួតពិនិត្យ បំពាក់បាកូដធានា និងវេចខ្ចប់រួចរាល់សម្រាប់ដឹកជញ្ជូន។'
            : 'Hardware verified, warranty barcode assigned, and package sealed for transit.',
        alertBg: 'bg-amber-50/70 border-amber-200/80 text-amber-900',
        alertIconColor: 'text-amber-600',
      };
    }
    return {
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
      dotColor: 'bg-blue-600',
      headline: language === 'km' ? 'បានបញ្ជាក់ការកុម្ម៉ង់' : 'Order Confirmed',
      etaText: language === 'km' ? 'ប៉ាន់ស្មានដឹកចេញ៖ ថ្ងៃស្អែក' : 'Estimated Dispatch: Tomorrow',
      subtext:
        language === 'km'
          ? 'បានទទួលការទូទាត់តាម Bakong KHQR រួចរាល់។ ការកុម្ម៉ង់កំពុងរង់ចាំក្រុមរៀបចំទំនិញ។'
          : 'Payment received via Bakong KHQR. Order queued for fulfillment team.',
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
        title:
          language === 'km'
            ? 'បានបញ្ជាក់ការកុម្ម៉ង់ និងផ្ទៀងផ្ទាត់ការទូទាត់'
            : 'Order Confirmed & Payment Verified',
        time: language === 'km' ? 'ថ្ងៃនេះ • ០៩:៣០ ព្រឹក' : 'Today • 09:30 AM',
        location:
          language === 'km'
            ? 'ហាងអនឡាញ TechTonic • បានទូទាត់តាម Bakong KHQR'
            : 'TechTonic Online Store • Bakong KHQR Paid',
        done: true,
      },
    ];

    if (s.includes('process') || s.includes('ship') || s.includes('out') || s.includes('deliver')) {
      milestones.unshift({
        title:
          language === 'km'
            ? 'បានរៀបចំកញ្ចប់ទំនិញ និងស្កេនត្រួតពិនិត្យគុណភាព'
            : 'Package Assembled & Quality Scanned',
        time: language === 'km' ? 'ថ្ងៃនេះ • ១១:១៥ ព្រឹក' : 'Today • 11:15 AM',
        location:
          language === 'km'
            ? 'មជ្ឈមណ្ឌលកណ្ដាល TechTonic ទួលគោក (ផ្លូវ 598)'
            : 'TechTonic Central Toul Kork Hub (St 598)',
        done: true,
      });
    }

    if (s.includes('ship') || s.includes('out') || s.includes('deliver')) {
      milestones.unshift({
        title:
          language === 'km'
            ? 'បានដឹកចេញជាមួយភ្នាក់ងារដឹកជញ្ជូន'
            : 'Dispatched with Logistics Courier',
        time: language === 'km' ? 'ថ្ងៃនេះ • ០១:៤៥ រសៀល' : 'Today • 01:45 PM',
        location:
          language === 'km'
            ? 'បានចេញដំណើរតាមរយៈក្រុម GrabExpress'
            : 'Departed via GrabExpress Fleet',
        done: true,
      });
    }

    if (s.includes('out') || s.includes('deliver')) {
      milestones.unshift({
        title:
          language === 'km'
            ? 'អ្នកដឹកជញ្ជូនកំពុងធ្វើដំណើរដំណាក់កាលចុងក្រោយ'
            : 'Courier In Transit for Final Mile Delivery',
        time: language === 'km' ? 'ថ្ងៃនេះ • ០៤:៣០ រសៀល' : 'Today • 04:30 PM',
        location:
          language === 'km'
            ? 'ជិតដល់មហាវិថីព្រះមុនីវង្ស និងផ្លូវ 310, BKK1'
            : 'Approaching Monivong Blvd & Street 310, BKK1',
        done: true,
      });
    }

    if (s.includes('deliver') && !s.includes('out')) {
      milestones.unshift({
        title:
          language === 'km'
            ? 'កញ្ចប់ទំនិញត្រូវបានប្រគល់ជោគជ័យ'
            : 'Package Successfully Delivered',
        time: language === 'km' ? 'ថ្ងៃនេះ • ០៥:២៤ ល្ងាច' : 'Today • 05:24 PM',
        location:
          language === 'km'
            ? 'អគារ 24, ផ្លូវ 310, BKK1 • ចុះហត្ថលេខាដោយ Sara Meng'
            : 'Building 24, St 310, BKK1 • Signed by Sara Meng',
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
              <span>
                {isAuthenticated
                  ? language === 'km'
                    ? 'ការកុម្ម៉ង់របស់ខ្ញុំ'
                    : 'My Orders'
                  : language === 'km'
                  ? 'ហាងទំនិញ'
                  : 'Storefront'}
              </span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-slate-500">
              {language === 'km' ? 'តាមដានការដឹកជញ្ជូនផ្ទាល់' : 'Live Delivery Tracking'}
            </span>
          </div>

          {/* Quick Search & Demo Switcher in one sleek row */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Compact Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder={
                  language === 'km'
                    ? 'ស្វែងរកលេខកុម្ម៉ង់ (ឧ. ORD-...)'
                    : 'Search order ID (e.g. ORD-...)'
                }
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-mono w-56 sm:w-64 shadow-xs"
              />
            </form>

            {/* Discreet Stage Switcher for Testing */}
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-xs">
              <span className="text-[11px] font-medium text-slate-500">
                {language === 'km' ? 'ដំណាក់កាលសាកល្បង៖' : 'Demo Stage:'}
              </span>
              <select
                value={(order.status || '').toLowerCase().replace(/\s+/g, '_')}
                onChange={(e) => handleUpdateStatus(e.target.value)}
                className="text-[11px] font-bold text-blue-600 bg-transparent border-none focus:outline-none cursor-pointer"
              >
                <option value="confirmed">
                  1. {translateOrderStatusLabel(formatOrderStatus('confirmed'), language)}
                </option>
                <option value="processing">
                  2. {translateOrderStatusLabel(formatOrderStatus('processing'), language)}
                </option>
                <option value="shipped">
                  3. {translateOrderStatusLabel(formatOrderStatus('shipped'), language)}
                </option>
                <option value="out_for_delivery">
                  4. {translateOrderStatusLabel(formatOrderStatus('out_for_delivery'), language)}
                </option>
                <option value="delivered">
                  5. {translateOrderStatusLabel(formatOrderStatus('delivered'), language)}
                </option>
              </select>
            </div>

            {/* Quick Demo Order Picker */}
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-xs">
              <span className="text-[11px] font-medium text-slate-500">
                {language === 'km' ? 'ការកុម្ម៉ង់សាកល្បង៖' : 'Demo Order:'}
              </span>
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
                    {ord.id} ({translateOrderStatusLabel(formatOrderStatus(ord.status), language)})
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
                  title={language === 'km' ? 'ចម្លងលេខកូដតាមដាន' : 'Copy Tracking Number'}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-600 font-semibold">
                        {language === 'km' ? 'បានចម្លង' : 'Copied'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>
                        {language === 'km' ? 'ចម្លងលេខកូដតាមដាន' : 'Copy Tracking Code'}
                      </span>
                    </>
                  )}
                </button>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {statusInfo.headline}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {language === 'km' ? 'ការដឹកជញ្ជូនប៉ាន់ស្មាន៖' : 'Estimated Delivery:'}{' '}
                <strong className="text-slate-800">{statusInfo.etaText}</strong>{' '}
                {language === 'km' ? '• បានកុម្ម៉ង់នៅថ្ងៃទី' : '• Placed on'} {formatDate(order.createdAt)}
              </p>
            </div>

            <div className="flex flex-col items-start md:items-end gap-1 shrink-0">
              <span className="text-xs text-slate-500">
                {language === 'km' ? 'ក្រុមហ៊ុនដឹកជញ្ជូន៖' : 'Courier:'}{' '}
                <strong className="text-slate-800 font-semibold">{order.deliveryPartner || 'GrabExpress Phnom Penh'}</strong>
              </span>
            </div>
          </div>

          {/* Stepper Component */}
          <div className="py-2">
            <OrderStepper currentStatus={order.status} />
          </div>
        </div>

        {/* 2-Column Responsive Body Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Column: Delivery Map + Activity Timeline (7 Columns) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Real Delivery Route Map */}
            <DeliveryMap orderStatus={order.status} shippingAddress={order.shippingAddress} />

            {/* Shipment Activity Timeline */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6">
              <div className="pb-4 border-b border-slate-100 mb-6">
                <h3 className="text-sm font-bold text-slate-900">
                  {language === 'km' ? 'ប្រវត្តិដំណាក់កាលដឹកជញ្ជូន' : 'Shipment Milestone History'}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'km'
                    ? 'កាលបរិច្ឆេទ និងពេលវេលាជាក់ស្តែងសម្រាប់ផ្លូវដឹកជញ្ជូនភ្នំពេញ'
                    : 'Real-time gateway timestamps for Phnom Penh delivery route'}
                </p>
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
                  <h3 className="text-sm font-bold text-slate-900">
                    {language === 'km' ? 'ទំនិញក្នុងកញ្ចប់' : 'Package Contents'}
                  </h3>
                </div>
                <span className="text-xs text-slate-500 font-semibold">
                  {(order.items || []).length} {language === 'km' ? 'មុខទំនិញ' : 'items'}
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
                            {language === 'km' ? 'ចំនួន៖' : 'Qty:'} {item.quantity}{' '}
                            {item.selectedVariant ? `• ${item.selectedVariant}` : ''}
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
                  <span>{language === 'km' ? 'តម្លៃទំនិញសរុប៖' : 'Subtotal:'}</span>
                  <span className="font-mono text-slate-900 font-medium">
                    {formatUSD((order.items || []).reduce((acc, i) => acc + (i.price * i.quantity), 0) || order.total)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>
                    {language === 'km' ? 'ដឹកជញ្ជូនរហ័សក្នុងភ្នំពេញ៖' : 'Phnom Penh Express Delivery:'}
                  </span>
                  <span className="font-semibold text-emerald-600">
                    {language === 'km' ? 'ឥតគិតថ្លៃ' : 'FREE'}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-100 text-sm font-bold text-slate-900">
                  <span>{language === 'km' ? 'ទឹកប្រាក់សរុបដែលបានទូទាត់៖' : 'Total Amount Paid:'}</span>
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
                <h3 className="text-sm font-bold text-slate-900">
                  {language === 'km' ? 'អាសយដ្ឋានដឹកជញ្ជូន' : 'Delivery Address'}
                </h3>
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
            </div>

            {/* Logistics Service Partner Card */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6">
              <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100">
                <Truck className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {language === 'km' ? 'ដៃគូដឹកជញ្ជូន' : 'Logistics Carrier'}
                </h3>
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
                  {language === 'km' ? 'កាលវិភាគ៖' : 'Schedule:'}{' '}
                  {order.estimatedDelivery || (language === 'km' ? 'ក្នុងរយៈពេល ២៤-៤៨ ម៉ោង' : 'Within 24-48 Hours')}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <a
                  href={order.carrierWebsite || (order.deliveryPartner?.includes('J&T') ? 'https://www.jtexpresskh.com/' : 'https://vireakbuntham.com/')}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
                >
                  <span>
                    {language === 'km' ? 'តាមដានលើគេហទំព័រដៃគូដឹកជញ្ជូន' : 'Track on Carrier Website'}
                  </span>
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
                <span>{language === 'km' ? 'ជំនួយ៖ Telegram @techtonic_kh' : 'Support: Telegram @techtonic_kh'}</span>
                <span className="font-mono text-slate-700 font-semibold">+855 23 999 888</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
