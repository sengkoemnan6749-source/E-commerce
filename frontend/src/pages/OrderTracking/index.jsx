import React, { useState, useEffect, useRef } from 'react';
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

export default function OrderTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { isAuthenticated } = useAuth();
  const { language } = useLanguage();

  const [searchInput, setSearchInput] = useState('');
  const [lookupContact, setLookupContact] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const lastLookupRef = useRef({});

  const [order, setOrder] = useState(() => {
    if (id) {
      return orderService.getOrderById(id);
    }
    return orderService.getOrders()[0] || null;
  });

  // Load real order from backend when route param id or auth state changes
  useEffect(() => {
    let active = true;
    const load = async () => {
      if (id) {
        const cached = orderService.getOrderById(id);
        if (cached && active) setOrder(cached);
        setLoadingOrder(!cached);
        try {
          const fetched = await orderService.fetchOrderById(id, lastLookupRef.current);
          if (active && fetched) setOrder(fetched);
        } catch {
          // Guests without auth may need email/phone lookup below
        } finally {
          if (active) setLoadingOrder(false);
        }
        return;
      }

      if (isAuthenticated) {
        setLoadingOrder(true);
        try {
          const myOrders = await orderService.fetchMyOrders();
          if (active) setOrder(myOrders[0] || null);
        } catch {
          if (active) setOrder(orderService.getOrders()[0] || null);
        } finally {
          if (active) setLoadingOrder(false);
        }
      }
    };
    load();
    return () => { active = false; };
  }, [id, isAuthenticated]);

  // Real-time status sync (tab focus + 5s live polling while visible and not final)
  useEffect(() => {
    const activeId = id || order?.id;
    if (!activeId && !isAuthenticated) return undefined;

    let stopped = false;
    const refreshLiveOrder = async () => {
      if (stopped || document.visibilityState !== 'visible') return;
      try {
        if (activeId) {
          const fresh = await orderService.fetchOrderById(activeId, lastLookupRef.current);
          if (!stopped && fresh) {
            setOrder(fresh);
          }
        } else if (isAuthenticated) {
          const myOrders = await orderService.fetchMyOrders();
          if (!stopped && myOrders[0]) {
            setOrder(myOrders[0]);
          }
        }
      } catch {
        // Silent background refresh
      }
    };

    const handleVisible = () => {
      if (document.visibilityState === 'visible') {
        refreshLiveOrder();
      }
    };

    window.addEventListener('focus', refreshLiveOrder);
    document.addEventListener('visibilitychange', handleVisible);

    const statusKey = String(order?.status || '').toLowerCase();
    const isFinal =
      (statusKey.includes('deliver') && !statusKey.includes('out')) ||
      statusKey.includes('cancel');

    const handleStorageSync = (e) => {
      if (e.key === 'techtonic_order_sync_ping' || e.key === 'techtonic_orders') {
        refreshLiveOrder();
      }
    };
    window.addEventListener('storage', handleStorageSync);

    let channel = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        channel = new BroadcastChannel('techtonic-order-sync');
        channel.onmessage = () => refreshLiveOrder();
      } catch {
        channel = null;
      }
    }

    const intervalId = window.setInterval(refreshLiveOrder, isFinal ? 12000 : 5000);

    return () => {
      stopped = true;
      window.removeEventListener('focus', refreshLiveOrder);
      document.removeEventListener('visibilitychange', handleVisible);
      window.removeEventListener('storage', handleStorageSync);
      if (channel) channel.close();
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [id, order?.id, order?.status, isAuthenticated]);

  // Handle manual order search
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    const q = searchInput.trim();
    if (!q) return;

    setLoadingOrder(true);
    try {
      const contact = lookupContact.trim();
      const lookup = contact.includes('@')
        ? { email: contact }
        : contact
          ? { phone: contact }
          : {};
      lastLookupRef.current = lookup;

      const found = (await orderService.fetchOrderById(q, lookup)) || orderService.getOrderById(q);
      if (found) {
        setOrder(found);
        addToast(
          language === 'km'
            ? `កំពុងបង្ហាញការតាមដានសម្រាប់ការកុម្ម៉ង់ ${found.id}`
            : `Showing tracking for order ${found.id}`,
          'success'
        );
        navigate(`/orders/${encodeURIComponent(found.id)}`);
        setSearchInput('');
      } else {
        addToast(
          language === 'km'
            ? `រកមិនឃើញការកុម្ម៉ង់ "${q}" ទេ។`
            : `Order "${q}" not found.`,
          'error'
        );
      }
    } catch (err) {
      addToast(
        err?.message || (language === 'km' ? `រកមិនឃើញការកុម្ម៉ង់ "${q}" ទេ។` : `Order "${q}" not found.`),
        'error'
      );
    } finally {
      setLoadingOrder(false);
    }
  };

  // Copy tracking code to clipboard
  const handleCopyTracking = () => {
    const code = order?.trackingNumber || order?.id || '';
    if (!code) return;
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

  // Status-dependent headline and descriptions
  const getStatusDisplay = () => {
    const s = (order.status || '').toLowerCase();
    const courierLabel = order.tracking?.courier || order.carrier || order.deliveryPartner || 'TechTonic Fleet';
    const savedEvents = Array.isArray(order.tracking?.events) ? order.tracking.events : [];
    const deliveredEvt = [...savedEvents].reverse().find((e) => {
      const k = String(e?.status || '').toLowerCase();
      return k.includes('deliver') && !k.includes('out');
    });

    if (s.includes('deliver') && !s.includes('out')) {
      const deliveredAt = formatEventTime(deliveredEvt?.timestamp || order.updatedAt || order.createdAt);
      return {
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dotColor: 'bg-emerald-500',
        headline: language === 'km' ? 'កញ្ចប់ទំនិញត្រូវបានប្រគល់ជោគជ័យ' : 'Package Delivered',
        etaText: language === 'km' ? `បានប្រគល់នៅ ${deliveredAt}` : `Delivered on ${deliveredAt}`,
        subtext:
          language === 'km'
            ? `កញ្ចប់ទំនិញរបស់អ្នកត្រូវបានប្រគល់ដោយសុវត្ថិភាពជូនអតិថិជន ${order.customerName || ''}។`
            : `Your package was safely delivered to ${order.customerName || 'the recipient'}.`,
        alertBg: 'bg-emerald-50/70 border-emerald-200/80 text-emerald-900',
        alertIconColor: 'text-emerald-600',
      };
    }
    if (s.includes('out')) {
      return {
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        dotColor: 'bg-blue-600 animate-pulse',
        headline: language === 'km' ? 'កំពុងដឹកជញ្ជូន — មកដល់ថ្ងៃនេះ' : 'Out for Delivery — Arriving Today',
        etaText: order.tracking?.estimatedDelivery || order.estimatedDelivery || (language === 'km' ? 'ថ្ងៃនេះ' : 'Expected Today'),
        subtext:
          language === 'km'
            ? `អ្នកដឹកជញ្ជូន (${courierLabel}) កំពុងធ្វើដំណើរទៅ ${order.shippingAddress?.address || order.shippingAddress?.city || ''}។`
            : `${courierLabel} is in transit to ${order.shippingAddress?.address || order.shippingAddress?.city || 'your address'}.`,
        alertBg: 'bg-blue-50/70 border-blue-200/80 text-blue-900',
        alertIconColor: 'text-blue-600',
      };
    }
    if (s.includes('ship')) {
      return {
        badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        dotColor: 'bg-indigo-600',
        headline: language === 'km' ? 'កំពុងដឹកជញ្ជូន — ចេញពីមជ្ឈមណ្ឌលកណ្ដាល' : 'In Transit — Departed Central Depot',
        etaText: order.tracking?.estimatedDelivery || order.estimatedDelivery || (language === 'km' ? 'ក្នុងរយៈពេល ២៤ ម៉ោង' : 'Within 24 Hours'),
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

  const formatEventTime = (raw) => {
    const dateLabel = formatDate(raw);
    if (!raw) return dateLabel;
    const parsed = raw?._seconds ? new Date(raw._seconds * 1000) : new Date(raw);
    if (Number.isNaN(parsed.getTime())) return dateLabel;
    const timeLabel = parsed.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return `${dateLabel} • ${timeLabel}`;
  };

  const dedupeLocationText = (raw) => {
    const seen = new Set();
    return String(raw || '')
      .split(',')
      .map((s) => s.trim())
      .filter((part) => {
        if (!part || seen.has(part.toLowerCase())) return false;
        seen.add(part.toLowerCase());
        return true;
      })
      .join(', ');
  };

  // Dynamic milestone activity timeline (uses real saved tracking events & fills any skipped steps cleanly)
  const getMilestones = () => {
    const savedEvents = Array.isArray(order.tracking?.events) ? order.tracking.events : [];
    const s = String(order.status || '').toLowerCase();
    const courierLabel = order.tracking?.courier || order.carrier || order.deliveryPartner || 'TechTonic Fleet';
    const cityLabel =
      dedupeLocationText([order.shippingAddress?.city, order.shippingAddress?.province].filter(Boolean).join(', ')) ||
      'Phnom Penh';
    const fullAddrLabel =
      dedupeLocationText(
        [order.shippingAddress?.address, order.shippingAddress?.city, order.shippingAddress?.province]
          .filter(Boolean)
          .join(', ')
      ) || cityLabel;

    const findSaved = (matcher) =>
      [...savedEvents].reverse().find((e) => matcher(String(e?.status || '').toLowerCase()));

    if (s.includes('cancel')) {
      const cancelEvt = findSaved((k) => k.includes('cancel'));
      return [
        {
          title: language === 'km' ? 'ការកុម្ម៉ង់ត្រូវបានបោះបង់' : 'Order Cancelled',
          time: formatEventTime(cancelEvt?.timestamp || order.updatedAt || order.createdAt),
          location: dedupeLocationText(cancelEvt?.location || 'TechTonic Support Desk'),
          done: true,
        },
        {
          title:
            language === 'km'
              ? 'បានបញ្ជាក់ការកុម្ម៉ង់ និងផ្ទៀងផ្ទាត់ការទូទាត់'
              : 'Order Confirmed & Payment Verified',
          time: formatEventTime(findSaved((k) => k.includes('confirm'))?.timestamp || order.createdAt),
          location:
            language === 'km'
              ? `ហាងអនឡាញ TechTonic • ${order.paymentMethod || 'KHQR'}`
              : `TechTonic Online Store • ${order.paymentMethod || 'KHQR'}`,
          done: true,
        },
      ];
    }

    const confirmEvt = findSaved((k) => k.includes('confirm'));
    const processEvt = findSaved((k) => k.includes('process'));
    const shipEvt = findSaved((k) => k.includes('ship'));
    const outEvt = findSaved((k) => k.includes('out'));
    const deliverEvt = findSaved((k) => k.includes('deliver') && !k.includes('out'));

    const fallbackTime = formatEventTime(
      deliverEvt?.timestamp ||
        outEvt?.timestamp ||
        shipEvt?.timestamp ||
        processEvt?.timestamp ||
        order.updatedAt ||
        order.createdAt
    );

    const milestones = [
      {
        title:
          s.includes('pending') && !confirmEvt
            ? language === 'km'
              ? 'បានបង្កើតការកុម្ម៉ង់ (រង់ចាំបញ្ជាក់)'
              : 'Order Placed (Pending Confirmation)'
            : language === 'km'
            ? 'បានបញ្ជាក់ការកុម្ម៉ង់ និងផ្ទៀងផ្ទាត់ការទូទាត់'
            : 'Order Confirmed & Payment Verified',
        time: formatEventTime(confirmEvt?.timestamp || order.createdAt),
        location: dedupeLocationText(
          confirmEvt?.location ||
            (language === 'km'
              ? `ហាងអនឡាញ TechTonic • ${order.paymentMethod || 'KHQR'}`
              : `TechTonic Online Store • ${order.paymentMethod || 'KHQR'}`)
        ),
        done: true,
      },
    ];

    if (s.includes('process') || s.includes('ship') || s.includes('out') || s.includes('deliver')) {
      milestones.unshift({
        title:
          language === 'km'
            ? 'បានរៀបចំកញ្ចប់ទំនិញ និងស្កេនត្រួតពិនិត្យគុណភាព'
            : 'Package Assembled & Quality Scanned',
        time: processEvt?.timestamp ? formatEventTime(processEvt.timestamp) : fallbackTime,
        location: dedupeLocationText(
          processEvt?.location ||
            (language === 'km'
              ? 'មជ្ឈមណ្ឌលកណ្ដាល TechTonic ទួលគោក (ផ្លូវ 598)'
              : 'TechTonic Central Toul Kork Hub (St 598)')
        ),
        done: true,
      });
    }

    if (s.includes('ship') || s.includes('out') || s.includes('deliver')) {
      milestones.unshift({
        title: language === 'km' ? 'បានដឹកចេញជាមួយភ្នាក់ងារដឹកជញ្ជូន' : 'Dispatched with Logistics Courier',
        time: shipEvt?.timestamp ? formatEventTime(shipEvt.timestamp) : fallbackTime,
        location: dedupeLocationText(shipEvt?.location || courierLabel),
        done: true,
      });
    }

    if (s.includes('out') || s.includes('deliver')) {
      milestones.unshift({
        title:
          language === 'km'
            ? 'អ្នកដឹកជញ្ជូនកំពុងធ្វើដំណើរដំណាក់កាលចុងក្រោយ'
            : 'Courier In Transit for Final Mile Delivery',
        time: outEvt?.timestamp ? formatEventTime(outEvt.timestamp) : fallbackTime,
        location: dedupeLocationText(outEvt?.location || cityLabel),
        done: true,
      });
    }

    if (s.includes('deliver') && !s.includes('out')) {
      milestones.unshift({
        title: language === 'km' ? 'កញ្ចប់ទំនិញត្រូវបានប្រគល់ជោគជ័យ' : 'Package Successfully Delivered',
        time: formatEventTime(deliverEvt?.timestamp || order.updatedAt || order.createdAt),
        location: dedupeLocationText(deliverEvt?.location || fullAddrLabel),
        done: true,
      });
    }

    return milestones;
  };

  if (!order) {
    return (
      <div className="bg-[#f8fafc] min-h-screen py-12 sm:py-16">
        <div className="max-w-xl mx-auto px-4">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
              <Package className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 mb-2">
              {language === 'km' ? 'តាមដានការកុម្ម៉ង់របស់អ្នក' : 'Track Your Order'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mb-6">
              {loadingOrder
                ? (language === 'km' ? 'កំពុងទាញយកទិន្នន័យការកុម្ម៉ង់...' : 'Loading order tracking details...')
                : (language === 'km'
                    ? 'បញ្ចូលលេខកូដកុម្ម៉ង់ (និងអ៊ីមែល ឬលេខទូរសព្ទប្រសិនបើមិនទាន់ចូលគណនី) ដើម្បីពិនិត្យស្ថានភាពដឹកជញ្ជូនពិតប្រាកដ។'
                    : 'Enter your order ID (and email or phone if checking out as guest) to view live delivery progress.')}
            </p>
            <form onSubmit={handleSearchSubmit} className="space-y-3 text-left">
              <input
                type="text"
                required
                placeholder={language === 'km' ? 'លេខកូដកុម្ម៉ង់ (ឧ. ORD-...)' : 'Order ID (e.g. ORD-...)'}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              {!isAuthenticated && (
                <input
                  type="text"
                  placeholder={language === 'km' ? 'អ៊ីមែល ឬលេខទូរសព្ទ (សម្រាប់ភ្ញៀវ)' : 'Email or phone number (for guest lookup)'}
                  value={lookupContact}
                  onChange={(e) => setLookupContact(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              )}
              <button
                type="submit"
                disabled={loadingOrder}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors cursor-pointer disabled:opacity-60"
              >
                {loadingOrder
                  ? (language === 'km' ? 'កំពុងស្វែងរក...' : 'Searching...')
                  : (language === 'km' ? 'ស្វែងរកការកុម្ម៉ង់' : 'Track Order')}
              </button>
            </form>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <Link to={isAuthenticated ? '/account/orders' : '/shop'} className="text-xs font-semibold text-blue-600 hover:underline">
                {isAuthenticated
                  ? (language === 'km' ? 'ត្រឡប់ទៅការកុម្ម៉ង់របស់ខ្ញុំ' : 'Back to My Orders')
                  : (language === 'km' ? 'បន្តទៅហាងទំនិញ' : 'Continue Shopping')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusDisplay();
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

          {/* Quick Order Lookup Search */}
          <div className="flex flex-wrap items-center gap-2.5">
            <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2">
              <div className="relative">
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
              </div>
              {!isAuthenticated && (
                <input
                  type="text"
                  placeholder={language === 'km' ? 'អ៊ីមែល/ទូរសព្ទ' : 'Email or phone'}
                  value={lookupContact}
                  onChange={(e) => setLookupContact(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600 w-40 shadow-xs"
                />
              )}
            </form>
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
                <strong className="text-slate-800 font-semibold">
                  {order.tracking?.courier || order.carrier || order.deliveryPartner || 'GrabExpress Phnom Penh'}
                </strong>
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

              <div
                className={`relative pl-6 space-y-6 border-l-2 ml-3 ${
                  String(order.status || '').toLowerCase().includes('cancel')
                    ? 'border-rose-200'
                    : 'border-blue-200'
                }`}
              >
                {milestones.map((item, idx) => {
                  const isCancelled = String(order.status || '').toLowerCase().includes('cancel');
                  const dotClass =
                    idx === 0
                      ? isCancelled
                        ? 'bg-rose-600 border-white ring-4 ring-rose-100'
                        : 'bg-blue-600 border-white ring-4 ring-blue-100'
                      : 'bg-blue-600 border-white';
                  return (
                  <div key={idx} className="relative">
                    {/* Node Circle */}
                    <div className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 ${dotClass}`} />
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span
                        className={`text-xs font-bold ${
                          idx === 0 ? (isCancelled ? 'text-rose-600' : 'text-blue-600') : 'text-slate-900'
                        }`}
                      >
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
                  );
                })}
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
