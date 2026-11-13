import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Plus,
  ArrowUpRight,
  Eye,
  Download,
  CreditCard,
  QrCode,
  Package
} from 'lucide-react';
import { productService } from '../../services/productService';
import { adminService } from '../../services/adminService';
import { formatUSD, formatKHR } from '../../utils/formatPrice';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Invoice from '../../components/order/Invoice';
import { useToast, useLanguage } from '../../store/StoreContext';
import { translateCategory, translateOrderStatusLabel } from '../../utils/translations';

const TIMEFRAME_META = {
  today: { label: 'Today (Last 24 Hours)', labelKm: 'ថ្ងៃនេះ (២៤ ម៉ោងចុងក្រោយ)' },
  '7d': { label: 'Last 7 Days', labelKm: '៧ ថ្ងៃចុងក្រោយ' },
  '30d': { label: 'Last 30 Days', labelKm: '៣០ ថ្ងៃចុងក្រោយ' },
  ytd: { label: 'Year-to-Date', labelKm: 'ពីដើមឆ្នាំមកទល់បច្ចុប្បន្ន' }
};

export default function AdminDashboard() {
  const { addToast } = useToast();
  const { language } = useLanguage();
  const location = useLocation();
  const adminBase = location.pathname.toLowerCase().startsWith('/techtonicadmin') ? '/TechTonicAdmin' : '/admin';

  const [products, setProducts] = useState(() => productService.getProducts());
  const [orders, setOrders] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);

  const [timeframe, setTimeframe] = useState('30d');
  const [chartMetric, setChartMetric] = useState('revenue'); // 'revenue' | 'orders'
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedOrderModal, setSelectedOrderModal] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const activeMeta = TIMEFRAME_META[timeframe] || TIMEFRAME_META['30d'];
  const activeTimeframeLabel = language === 'km' ? activeMeta.labelKm : activeMeta.label;

  const loadLiveDashboard = useCallback(async (showFeedback = false) => {
    setIsRefreshing(true);
    try {
      const [stats, ordersRes] = await Promise.all([
        adminService.getDashboard(),
        adminService.getOrders({ limit: 100 }),
        productService.syncFromBackend()
      ]);
      setDashboardStats(stats);
      setOrders(ordersRes.orders || stats?.recentOrders || []);
      setProducts(productService.getProducts());
      if (showFeedback) {
        addToast(
          language === 'km'
            ? 'បានផ្ទុកទិន្នន័យផ្ទាំងគ្រប់គ្រងឡើងវិញដោយជោគជ័យ។'
            : 'Dashboard data refreshed from Firestore.',
          'info'
        );
      }
    } catch (err) {
      if (showFeedback) {
        addToast(err?.message || 'Failed to refresh dashboard data.', 'error');
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [addToast, language]);

  useEffect(() => {
    loadLiveDashboard(false);
  }, [loadLiveDashboard]);

  const refreshData = () => {
    loadLiveDashboard(true);
  };

  // Filter live orders by selected timeframe
  const timeframeOrders = useMemo(() => {
    const now = Date.now();
    let cutoff = 0;
    if (timeframe === 'today') cutoff = now - 24 * 60 * 60 * 1000;
    else if (timeframe === '7d') cutoff = now - 7 * 24 * 60 * 60 * 1000;
    else if (timeframe === '30d') cutoff = now - 30 * 24 * 60 * 60 * 1000;
    else if (timeframe === 'ytd') cutoff = new Date(new Date().getFullYear(), 0, 1).getTime();

    return orders.filter((o) => {
      if (String(o.status || '').toLowerCase() === 'cancelled') return false;
      const t = new Date(o.createdAt || 0).getTime();
      return !cutoff || Number.isNaN(t) || t >= cutoff;
    });
  }, [orders, timeframe]);

  const totalCalculatedRevenue = useMemo(() => {
    return Math.round(
      timeframeOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0) * 100
    ) / 100;
  }, [timeframeOrders]);

  const totalCalculatedOrders = timeframeOrders.length;

  const averageOrderValue = useMemo(() => {
    return totalCalculatedOrders > 0
      ? (totalCalculatedRevenue / totalCalculatedOrders).toFixed(2)
      : '0.00';
  }, [totalCalculatedRevenue, totalCalculatedOrders]);

  const lowStockProducts = useMemo(() => {
    if (Array.isArray(dashboardStats?.lowStockProducts)) {
      return dashboardStats.lowStockProducts;
    }
    return products.filter((p) => Number(p.stock ?? 0) <= 10);
  }, [dashboardStats, products]);

  // Real chart buckets computed from live orders
  const chartPoints = useMemo(() => {
    const bucketCount = timeframe === '7d' ? 7 : 6;
    const now = Date.now();
    const spanMs =
      timeframe === 'today'
        ? 24 * 60 * 60 * 1000
        : timeframe === '7d'
          ? 7 * 24 * 60 * 60 * 1000
          : timeframe === '30d'
            ? 30 * 24 * 60 * 60 * 1000
            : Math.max(24 * 60 * 60 * 1000, now - new Date(new Date().getFullYear(), 0, 1).getTime());

    const stepMs = spanMs / bucketCount;
    const startMs = now - spanMs;
    const buckets = Array.from({ length: bucketCount }, (_, idx) => {
      const bucketTime = new Date(startMs + stepMs * (idx + 1));
      const label =
        timeframe === 'today'
          ? bucketTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : bucketTime.toLocaleDateString([], { month: 'short', day: 'numeric' });
      return { label, revenue: 0, orders: 0 };
    });

    timeframeOrders.forEach((o) => {
      const ts = new Date(o.createdAt || now).getTime();
      const idx = Math.min(
        bucketCount - 1,
        Math.max(0, Math.floor(((Number.isNaN(ts) ? now : ts) - startMs) / stepMs))
      );
      buckets[idx].orders += 1;
      buckets[idx].revenue = Math.round((buckets[idx].revenue + (Number(o.total) || 0)) * 100) / 100;
    });

    return buckets;
  }, [timeframeOrders, timeframe]);

  // Real Revenue by Category computed from live order items
  const categoryBreakdown = useMemo(() => {
    const productById = new Map(products.map((p) => [String(p.id), p]));
    const colorPool = ['bg-blue-600', 'bg-indigo-600', 'bg-emerald-600', 'bg-amber-500'];
    const totals = new Map();

    timeframeOrders.forEach((o) => {
      (o.items || []).forEach((item) => {
        const prod = productById.get(String(item.productId || item.id));
        const catName = item.category || prod?.category || prod?.categoryName || 'Hardware';
        const lineTotal = (Number(item.price) || 0) * (Number(item.quantity) || 1);
        totals.set(catName, (totals.get(catName) || 0) + lineTotal);
      });
    });

    if (totals.size === 0) {
      return [
        'Audio & Acoustics',
        'Workspace Peripherals',
        'Smart Wearables',
        'Power & Mobile'
      ].map((name, i) => ({ name, amount: 0, pct: 0, color: colorPool[i % colorPool.length] }));
    }

    const grand = Array.from(totals.values()).reduce((s, v) => s + v, 0) || 1;
    return Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name, amount], i) => ({
        name,
        amount,
        pct: Math.round((amount / grand) * 100),
        color: colorPool[i % colorPool.length]
      }));
  }, [timeframeOrders, products]);

  // Real Payment Methods breakdown from live orders
  const paymentStats = useMemo(() => {
    let khqrRev = 0;
    let khqrCount = 0;
    let cardRev = 0;
    let cardCount = 0;
    timeframeOrders.forEach((o) => {
      const m = String(o.paymentMethod || '').toLowerCase();
      const amt = Number(o.total) || 0;
      if (m.includes('khqr') || m.includes('bakong')) {
        khqrCount += 1;
        khqrRev += amt;
      } else {
        cardCount += 1;
        cardRev += amt;
      }
    });
    const totalAmt = khqrRev + cardRev;
    return {
      khqrRev,
      khqrPct: totalAmt > 0 ? ((khqrRev / totalAmt) * 100).toFixed(1) : '0.0',
      cardRev,
      cardPct: totalAmt > 0 ? ((cardRev / totalAmt) * 100).toFixed(1) : '0.0',
    };
  }, [timeframeOrders]);

  // Quick Restock Handler -> persists to Firestore via adminService
  const handleQuickRestock = async (productId, amount = 10) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    const newStock = (Number(prod.stock) || 0) + amount;
    try {
      await adminService.updateProduct(productId, { ...prod, stock: newStock });
      await loadLiveDashboard(false);
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('techtonic:admin-updated'));
      addToast(
        language === 'km'
          ? `បានបន្ថែមស្តុក ${prod.name} (+${amount} គ្រឿង)។ ស្តុកសរុប៖ ${newStock}`
          : `Restocked ${prod.name} (+${amount} units). Total stock: ${newStock}`,
        'success'
      );
    } catch (err) {
      addToast(err?.message || 'Failed to update stock.', 'error');
    }
  };

  // Order Quick Status Update -> persists to Firestore via adminService
  const handleQuickStatusChange = async (orderId, newStatus) => {
    try {
      await adminService.updateOrderStatus(orderId, newStatus);
      await loadLiveDashboard(false);
      addToast(
        language === 'km'
          ? `បានប្ដូរស្ថានភាពការបញ្ជាទិញ ${orderId} ទៅជា ${translateOrderStatusLabel(newStatus, 'km')}`
          : `Order ${orderId} status updated to ${translateOrderStatusLabel(newStatus, 'en')}`,
        'success'
      );
    } catch (err) {
      addToast(err?.message || 'Failed to update order status.', 'error');
    }
  };

  // SVG Chart Dimensions & Spline Coordinates
  const maxVal = Math.max(1, ...chartPoints.map((p) => (chartMetric === 'revenue' ? p.revenue : p.orders)));
  const minVal = Math.min(...chartPoints.map((p) => (chartMetric === 'revenue' ? p.revenue : p.orders))) * 0.8;

  const svgWidth = 800;
  const svgHeight = 240;
  const paddingX = 40;
  const paddingY = 30;

  const pointsCoordinates = useMemo(() => {
    return chartPoints.map((pt, idx) => {
      const x = paddingX + (idx / (chartPoints.length - 1)) * (svgWidth - paddingX * 2);
      const val = chartMetric === 'revenue' ? pt.revenue : pt.orders;
      const normalized = (val - minVal) / Math.max(1, maxVal - minVal);
      const y = svgHeight - paddingY - normalized * (svgHeight - paddingY * 2);
      return { x, y, data: pt };
    });
  }, [chartPoints, chartMetric, maxVal, minVal]);

  const pathD = useMemo(() => {
    if (pointsCoordinates.length === 0) return '';
    return pointsCoordinates.reduce((acc, pt, i, arr) => {
      if (i === 0) return `M ${pt.x},${pt.y}`;
      const prev = arr[i - 1];
      const cx = (prev.x + pt.x) / 2;
      return `${acc} C ${cx},${prev.y} ${cx},${pt.y} ${pt.x},${pt.y}`;
    }, '');
  }, [pointsCoordinates]);

  const areaD = useMemo(() => {
    if (pointsCoordinates.length === 0) return '';
    const firstX = pointsCoordinates[0].x;
    const lastX = pointsCoordinates[pointsCoordinates.length - 1].x;
    const bottomY = svgHeight - paddingY;
    return `${pathD} L ${lastX},${bottomY} L ${firstX},${bottomY} Z`;
  }, [pathD, pointsCoordinates]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8 font-sans">
      {/* 1. CLEAN EXECUTIVE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {language === 'km' ? 'ផ្ទាំងគ្រប់គ្រង' : 'Dashboard'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {language === 'km'
              ? 'សកម្មភាពលក់ ការវិភាគចំណូល និងការបំពេញការបញ្ជាទិញក្នុងហាង។'
              : 'Store performance, revenue breakdown, and order fulfillment.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe Switcher Tabs */}
          <div className="flex items-center rounded-xl bg-slate-100 border border-slate-200/70 p-1">
            {[
              { id: 'today', label: language === 'km' ? 'ថ្ងៃនេះ' : 'Today' },
              { id: '7d', label: language === 'km' ? '៧ ថ្ងៃ' : '7D' },
              { id: '30d', label: language === 'km' ? '៣០ ថ្ងៃ' : '30D' },
              { id: 'ytd', label: language === 'km' ? 'ប្រចាំឆ្នាំ' : 'YTD' }
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTimeframe(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  timeframe === t.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Sync Refresh Button */}
          <button
            type="button"
            onClick={refreshData}
            className="h-9 w-9 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200/90 flex items-center justify-center transition-colors cursor-pointer"
            title={language === 'km' ? 'ផ្ទុកទិន្នន័យឡើងវិញ' : 'Refresh Data'}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          {/* Export Report Trigger */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExportModalOpen(true)}
            className="text-slate-700 border-slate-200/90 bg-white hover:bg-slate-50"
          >
            <Download className="w-4 h-4 mr-1.5 text-slate-500" />
            <span>{language === 'km' ? 'នាំចេញ' : 'Export'}</span>
          </Button>

          {/* Quick Add Product */}
          <Link to={`${adminBase}/products`}>
            <Button variant="primary" size="sm">
              <Plus className="w-4 h-4 mr-1.5" />
              <span>{language === 'km' ? 'បន្ថែមផលិតផល' : 'Add Product'}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. FOUR CLEAN, ACTIONABLE METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Revenue */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 flex flex-col justify-between hover:border-slate-300/80 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">
              {language === 'km' ? 'ចំណូលសរុប' : 'Total Revenue'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200/70 text-slate-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight">
              {formatUSD(totalCalculatedRevenue)}
            </div>
            <div className="text-[11px] text-slate-400 tabular-nums mt-0.5">
              ≈ {formatKHR(totalCalculatedRevenue)}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium mt-3 pt-2.5 border-t border-slate-100">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>
              {language === 'km' ? `ទិន្នន័យផ្ទាល់ (${activeTimeframeLabel})` : `Live Firestore (${activeTimeframeLabel})`}
            </span>
          </div>
        </div>

        {/* Metric 2: Orders Volume */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 flex flex-col justify-between hover:border-slate-300/80 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">
              {language === 'km' ? 'ការបញ្ជាទិញសរុប' : 'Total Orders'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200/70 text-slate-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight">
              {totalCalculatedOrders.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {language === 'km'
                ? `ការបញ្ជាទិញចំនួន ${dashboardStats?.summary?.pendingOrdersCount ?? orders.filter(o => ['confirmed', 'processing', 'pending'].includes(String(o.status || '').toLowerCase())).length} កំពុងរង់ចាំចាត់ចែង`
                : `${dashboardStats?.summary?.pendingOrdersCount ?? orders.filter(o => ['confirmed', 'processing', 'pending'].includes(String(o.status || '').toLowerCase())).length} orders pending fulfillment`}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium mt-3 pt-2.5 border-t border-slate-100">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {language === 'km'
                ? `អតិថិជនសរុប ${dashboardStats?.summary?.totalCustomers ?? 0} នាក់`
                : `${dashboardStats?.summary?.totalCustomers ?? 0} registered customers`}
            </span>
          </div>
        </div>

        {/* Metric 3: Average Order Value (AOV) */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 flex flex-col justify-between hover:border-slate-300/80 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">
              {language === 'km' ? 'តម្លៃមធ្យមក្នុងមួយការបញ្ជាទិញ' : 'Avg Order Value'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200/70 text-slate-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight">
              ${averageOrderValue}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {language === 'km' ? 'ក្នុងការទូទាត់ជោគជ័យនីមួយៗ' : 'Per completed checkout'}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium mt-3 pt-2.5 border-t border-slate-100">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {language === 'km'
                ? `បញ្ជាទិញបានប្រគល់ ${dashboardStats?.summary?.deliveredOrdersCount ?? 0}`
                : `${dashboardStats?.summary?.deliveredOrdersCount ?? 0} delivered orders`}
            </span>
          </div>
        </div>

        {/* Metric 4: Inventory Alert */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 flex flex-col justify-between hover:border-slate-300/80 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">
              {language === 'km' ? 'ការព្រមានស្តុកទំនិញ' : 'Inventory Alert'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200/70 text-slate-600 flex items-center justify-center">
              <AlertTriangle className={`w-4 h-4 ${lowStockProducts.length > 0 ? 'text-amber-500' : 'text-slate-500'}`} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight">
              {language === 'km' ? `${lowStockProducts.length} ផលិតផល` : `${lowStockProducts.length} Products`}
            </div>
            <div className={`text-[11px] font-medium mt-0.5 ${lowStockProducts.length > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
              {language === 'km' ? 'ត្រូវការបំពេញស្តុក (≤ ៥ គ្រឿង)' : 'Require restock (≤ 5 units)'}
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mt-3 pt-2.5 border-t border-slate-100">
            <span>
              {language === 'km' ? `សកម្ម ${products.length} ក្នុងកាតាឡុក` : `${products.length} active in catalog`}
            </span>
            <Link to={`${adminBase}/products`} className="text-blue-600 font-semibold hover:underline">
              {language === 'km' ? 'ត្រួតពិនិត្យ →' : 'Audit →'}
            </Link>
          </div>
        </div>
      </div>

      {/* 3. REVENUE & ORDERS ACTIVITY CHART + INSIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Timeline Curve (8 cols) */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {language === 'km' ? 'សកម្មភាពលក់ និងការបញ្ជាទិញ' : 'Sales & Order Activity'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'km'
                  ? `ទិន្នន័យហិរញ្ញវត្ថុសម្រាប់ ${activeTimeframeLabel}។`
                  : `Financial performance for ${activeTimeframeLabel}.`}
              </p>
            </div>

            {/* Metric Toggle: Revenue vs Orders */}
            <div className="flex items-center rounded-lg bg-slate-100 p-1 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setChartMetric('revenue')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  chartMetric === 'revenue'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {language === 'km' ? 'ចំណូល ($)' : 'Revenue ($)'}
              </button>
              <button
                type="button"
                onClick={() => setChartMetric('orders')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  chartMetric === 'orders'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {language === 'km' ? 'ការបញ្ជាទិញ' : 'Orders'}
              </button>
            </div>
          </div>

          {/* SVG Spline Chart */}
          <div className="relative w-full h-56 pt-2 select-none">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0.2, 0.5, 0.8].map((ratio) => {
                const y = svgHeight - paddingY - ratio * (svgHeight - paddingY * 2);
                return (
                  <line
                    key={ratio}
                    x1={paddingX}
                    y1={y}
                    x2={svgWidth - paddingX}
                    y2={y}
                    stroke="#f1f5f9"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Shaded Area */}
              {areaD && <path d={areaD} fill="url(#chartGradient)" />}

              {/* Smooth Stroke Line */}
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Interactive Data Points */}
              {pointsCoordinates.map((pt, idx) => (
                <g key={idx}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredPoint === idx ? 6 : 4}
                    fill={hoveredPoint === idx ? '#1d4ed8' : '#2563eb'}
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="transition-all cursor-pointer"
                    onMouseEnter={() => setHoveredPoint(idx)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  {/* X-axis Label */}
                  <text
                    x={pt.x}
                    y={svgHeight - 8}
                    textAnchor="middle"
                    className="text-[10px] font-semibold fill-slate-400"
                  >
                    {language === 'km' && pt.data.labelKm ? pt.data.labelKm : pt.data.label}
                  </text>
                </g>
              ))}
            </svg>

            {/* Hover Tooltip Box */}
            {hoveredPoint !== null && (
              <div
                className="absolute pointer-events-none p-2.5 rounded-xl bg-slate-900 text-white text-xs shadow-xl z-20 -translate-x-1/2 -translate-y-full mb-2"
                style={{
                  left: `${(pointsCoordinates[hoveredPoint].x / svgWidth) * 100}%`,
                  top: `${(pointsCoordinates[hoveredPoint].y / svgHeight) * 100}%`
                }}
              >
                <div className="text-[10px] text-slate-400 font-semibold">
                  {language === 'km' && pointsCoordinates[hoveredPoint].data.labelKm
                    ? pointsCoordinates[hoveredPoint].data.labelKm
                    : pointsCoordinates[hoveredPoint].data.label}
                </div>
                <div className="font-mono font-bold text-sm text-blue-400">
                  {chartMetric === 'revenue'
                    ? formatUSD(pointsCoordinates[hoveredPoint].data.revenue)
                    : `${pointsCoordinates[hoveredPoint].data.orders} ${language === 'km' ? 'ការបញ្ជាទិញ' : 'orders'}`}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Category Distribution & Payment Channels (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Category Share Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900">
                {language === 'km' ? 'ចំណូលតាមប្រភេទផលិតផល' : 'Revenue by Category'}
              </h2>
              <span className="text-[11px] text-slate-400 font-mono font-medium">
                {language === 'km' ? '៣០ ថ្ងៃ' : '30 Days'}
              </span>
            </div>

            <div className="space-y-3.5">
              {categoryBreakdown.map((c) => (
                <div key={c.name} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-700 font-medium">
                      {translateCategory(c.name, language)}
                    </span>
                    <span className="font-mono font-bold text-slate-900">{formatUSD(c.amount)} ({c.pct}%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${c.color} rounded-full`} style={{ width: `${c.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Gateway Breakdown */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900">
                {language === 'km' ? 'វិធីសាស្ត្រទូទាត់' : 'Payment Methods'}
              </h2>
              <span className="text-[11px] text-emerald-600 font-medium">
                {language === 'km' ? 'បានទូទាត់រួចរាល់' : 'Settled'}
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-white text-slate-700 border border-slate-200/80">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-900 block">
                      {language === 'km' ? 'KHQR បាគង' : 'KHQR Bakong'}
                    </span>
                    <span className="text-[10px] text-slate-500">ABA, Wing, ACLEDA, Sathapana</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs tabular-nums font-bold text-slate-900 block">{paymentStats.khqrPct}%</span>
                  <span className="text-[10px] text-slate-500 tabular-nums">{formatUSD(paymentStats.khqrRev)}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-white text-slate-700 border border-slate-200/80">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-900 block">
                      {language === 'km' ? 'កាតឥណទាន / ឥណពន្ធ' : 'Credit / Debit Card'}
                    </span>
                    <span className="text-[10px] text-slate-500">Visa, MasterCard, JCB</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs tabular-nums font-bold text-slate-900 block">{paymentStats.cardPct}%</span>
                  <span className="text-[10px] text-slate-500 tabular-nums">{formatUSD(paymentStats.cardRev)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. BEST-SELLING PRODUCTS */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {language === 'km' ? 'ផលិតផលលក់ដាច់បំផុត' : 'Best-Selling Products'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'km'
                ? 'ចំណាត់ថ្នាក់តាមចំនួនគ្រឿងដែលបានបញ្ជាទិញក្នុងខែនេះ។'
                : 'Ranked by total units ordered this month.'}
            </p>
          </div>
          <Link to={`${adminBase}/products`} className="text-xs font-bold text-blue-600 hover:text-blue-700">
            {language === 'km' ? 'មើលផលិតផលទាំងអស់ →' : 'View All Products →'}
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {products.slice(0, 4).map((p, idx) => (
            <div
              key={p.id}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="relative shrink-0">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-12 h-12 rounded-xl object-contain bg-white border border-slate-200 p-1"
                  />
                  <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center">
                    #{idx + 1}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-bold text-slate-900 truncate">{p.name}</h3>
                  <span className="text-[10px] text-slate-500 font-medium block">
                    {translateCategory(p.category, language)}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-900 mt-0.5 block">
                    {formatUSD(p.price)}
                  </span>
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500">
                  {language === 'km' ? 'ស្តុក៖' : 'Stock:'}
                </span>
                <span
                  className={`font-bold tabular-nums text-[11px] ${
                    p.stock <= 5 ? 'text-amber-600' : 'text-emerald-600'
                  }`}
                >
                  {language === 'km' ? `${p.stock} គ្រឿង` : `${p.stock} units`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. BOTTOM ROW: RECENT ORDERS & LOW STOCK RESTOCK */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Orders with Inline Status Switcher (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {language === 'km' ? 'ការបញ្ជាទិញថ្មីៗ' : 'Recent Orders'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'km'
                  ? 'ធ្វើបច្ចុប្បន្នភាពដំណាក់កាលដឹកជញ្ជូនភ្លាមៗ។'
                  : 'Update shipment stages instantly.'}
              </p>
            </div>
            <Link to={`${adminBase}/orders`} className="text-xs font-bold text-blue-600 hover:text-blue-700">
              {language === 'km' ? 'ទំព័រការបញ្ជាទិញ →' : 'Orders Page →'}
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">{language === 'km' ? 'លេខកូដកុម្ម៉ង់' : 'Order ID'}</th>
                  <th className="py-2.5 px-3">{language === 'km' ? 'អតិថិជន' : 'Customer'}</th>
                  <th className="py-2.5 px-3">{language === 'km' ? 'សរុប' : 'Total'}</th>
                  <th className="py-2.5 px-3">{language === 'km' ? 'ស្ថានភាព' : 'Status'}</th>
                  <th className="py-2.5 px-3 text-right">{language === 'km' ? 'សកម្មភាព' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.slice(0, 5).map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-blue-600">
                      <button
                        type="button"
                        onClick={() => setSelectedOrderModal(o)}
                        className="hover:underline cursor-pointer"
                      >
                        {o.id}
                      </button>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-900 block truncate max-w-[130px]">
                        {o.customerName || o.customer?.fullName || 'Customer'}
                      </span>
                      <span className="text-[10px] text-slate-400">{o.paymentMethod}</span>
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {formatUSD(o.total)}
                    </td>

                    <td className="py-3 px-3">
                      <select
                        value={o.status.toLowerCase().replace(/\s+/g, '_')}
                        onChange={(e) => handleQuickStatusChange(o.id, e.target.value)}
                        className="text-xs font-medium bg-white text-slate-700 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-2xs"
                      >
                        <option value="confirmed">{translateOrderStatusLabel('Confirmed', language)}</option>
                        <option value="processing">{translateOrderStatusLabel('Processing', language)}</option>
                        <option value="shipped">{translateOrderStatusLabel('Shipped', language)}</option>
                        <option value="out_for_delivery">{translateOrderStatusLabel('Out for Delivery', language)}</option>
                        <option value="delivered">{translateOrderStatusLabel('Delivered', language)}</option>
                      </select>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedOrderModal(o)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                        title={language === 'km' ? 'មើលព័ត៌មានលម្អិត' : 'View Details'}
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

        {/* Low Stock Replenishment Action Panel (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>{language === 'km' ? 'ការព្រមានស្តុកទាប' : 'Low Stock Alert'}</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === 'km'
                    ? 'មុខទំនិញដែលត្រូវការបញ្ជាទិញបំពេញស្តុកជាបន្ទាន់។'
                    : 'Items requiring immediate reorder.'}
                </p>
              </div>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                {language === 'km' ? `សល់តិច ${lowStockProducts.length}` : `${lowStockProducts.length} low`}
              </span>
            </div>

            <div className="space-y-3">
              {lowStockProducts.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-10 h-10 rounded-xl object-contain bg-white border border-slate-200 p-0.5 shrink-0"
                    />
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-slate-900 truncate max-w-[140px]">
                        {p.name}
                      </h3>
                      <span className="text-[10px] text-amber-600 font-mono font-bold block">
                        {language === 'km' ? `នៅសល់ ${p.stock} គ្រឿង` : `${p.stock} units left`}
                      </span>
                    </div>
                  </div>

                  {/* Restock Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleQuickRestock(p.id, 10)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-700 hover:bg-blue-600 hover:text-white border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                      title={language === 'km' ? 'បន្ថែម ១០ គ្រឿង' : 'Add 10 units'}
                    >
                      +10
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickRestock(p.id, 50)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-700 hover:bg-emerald-600 hover:text-white border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                      title={language === 'km' ? 'បន្ថែម ៥០ គ្រឿង' : 'Add 50 units'}
                    >
                      +50
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              {language === 'km' ? 'គ្រប់គ្រងបញ្ជីស្តុកពេញលេញក្នុងទំព័រផលិតផល' : 'Manage full stock list in Products'}
            </span>
            <Link to={`${adminBase}/products`} className="text-blue-600 font-bold hover:underline">
              {language === 'km' ? 'កាតាឡុកស្តុកទំនិញ →' : 'Inventory Catalog →'}
            </Link>
          </div>
        </div>
      </div>

      {/* Order Inspection Modal */}
      {selectedOrderModal && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedOrderModal(null)}
          title={`${language === 'km' ? 'ការបញ្ជាទិញ៖' : 'Order:'} ${selectedOrderModal.id}`}
          size="xl"
        >
          <Invoice order={selectedOrderModal} onBack={() => setSelectedOrderModal(null)} />
        </Modal>
      )}

      {/* Financial Export Modal */}
      {isExportModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsExportModalOpen(false)}
          title={language === 'km' ? 'នាំចេញរបាយការណ៍លក់' : 'Export Sales Report'}
        >
          <div className="space-y-4 text-xs font-sans">
            <p className="text-slate-600">
              {language === 'km'
                ? 'ទាញយករបាយការណ៍ CSV សម្រាប់ត្រួតពិនិត្យការលក់ និងគណនេយ្យស្តុកទំនិញ៖'
                : 'Download CSV report for sales audit and inventory accounting:'}
            </p>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 font-mono text-[11px]">
              <div className="flex justify-between">
                <span>{language === 'km' ? 'រយៈពេល៖' : 'Period:'}</span>
                <strong className="text-slate-900">{activeTimeframeLabel}</strong>
              </div>
              <div className="flex justify-between">
                <span>{language === 'km' ? 'ចំណូលសរុប៖' : 'Total Revenue:'}</span>
                <strong className="text-blue-600">{formatUSD(totalCalculatedRevenue)}</strong>
              </div>
              <div className="flex justify-between">
                <span>{language === 'km' ? 'ការបញ្ជាទិញសរុប៖' : 'Total Orders:'}</span>
                <strong className="text-slate-900">
                  {language === 'km' ? `${totalCalculatedOrders} ការបញ្ជាទិញ` : `${totalCalculatedOrders} orders`}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>{language === 'km' ? 'ពន្ធប៉ាន់ស្មាន (10%)៖' : 'Estimated Tax (10%):'}</span>
                <strong className="text-slate-900">{formatUSD(totalCalculatedRevenue * 0.1)}</strong>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsExportModalOpen(false)}>
                {language === 'km' ? 'បោះបង់' : 'Cancel'}
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  const rows = [
                    ['Order ID', 'Customer', 'Status', 'Payment Method', 'Total (USD)', 'Created At'],
                    ...timeframeOrders.map((o) => [
                      o.id,
                      o.customerName || o.customer?.fullName || 'Customer',
                      o.status,
                      o.paymentMethod,
                      Number(o.total || 0).toFixed(2),
                      o.createdAt || ''
                    ])
                  ];
                  const csvContent = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `techtonic-sales-${timeframe}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                  setIsExportModalOpen(false);
                  addToast(
                    language === 'km'
                      ? 'បានទាញយករបាយការណ៍ CSV ដោយជោគជ័យ។'
                      : 'Export report CSV successfully downloaded.',
                    'success'
                  );
                }}
              >
                <Download className="w-4 h-4 mr-1.5" />
                <span>{language === 'km' ? 'ទាញយក CSV' : 'Download CSV'}</span>
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
