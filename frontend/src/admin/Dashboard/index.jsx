import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
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
  Calendar,
  CreditCard,
  QrCode,
  CheckCircle2,
  Package
} from 'lucide-react';
import { productService } from '../../services/productService';
import { orderService } from '../../services/orderService';
import { formatUSD, formatKHR } from '../../utils/formatPrice';
import { formatDate } from '../../utils/formatDate';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Invoice from '../../components/order/Invoice';
import { useToast } from '../../store/StoreContext';

// Timeframe datasets for interactive analytics
const TIMEFRAME_DATA = {
  'today': {
    label: 'Today (Last 24 Hours)',
    revenueMult: 0.05,
    ordersMult: 0.06,
    chartPoints: [
      { label: '00:00', revenue: 240, orders: 3 },
      { label: '04:00', revenue: 120, orders: 1 },
      { label: '08:00', revenue: 840, orders: 9 },
      { label: '12:00', revenue: 1650, orders: 18 },
      { label: '16:00', revenue: 2190, orders: 24 },
      { label: '20:00', revenue: 1480, orders: 15 }
    ]
  },
  '7d': {
    label: 'Last 7 Days',
    revenueMult: 0.25,
    ordersMult: 0.28,
    chartPoints: [
      { label: 'Mon', revenue: 4200, orders: 45 },
      { label: 'Tue', revenue: 5100, orders: 54 },
      { label: 'Wed', revenue: 4800, orders: 50 },
      { label: 'Thu', revenue: 6400, orders: 68 },
      { label: 'Fri', revenue: 7850, orders: 82 },
      { label: 'Sat', revenue: 8900, orders: 95 },
      { label: 'Sun', revenue: 6900, orders: 74 }
    ]
  },
  '30d': {
    label: 'Last 30 Days',
    revenueMult: 1,
    ordersMult: 1,
    chartPoints: [
      { label: 'Week 1', revenue: 26400, orders: 290 },
      { label: 'Week 2', revenue: 31200, orders: 345 },
      { label: 'Week 3', revenue: 34800, orders: 380 },
      { label: 'Week 4', revenue: 36050, orders: 405 }
    ]
  },
  'ytd': {
    label: 'Year-to-Date (2026)',
    revenueMult: 4.2,
    ordersMult: 4.1,
    chartPoints: [
      { label: 'Apr', revenue: 18400, orders: 210 },
      { label: 'May', revenue: 22100, orders: 245 },
      { label: 'Jun', revenue: 24800, orders: 275 },
      { label: 'Jul', revenue: 31200, orders: 340 },
      { label: 'Aug', revenue: 36500, orders: 395 },
      { label: 'Sep', revenue: 42900, orders: 460 }
    ]
  }
};

export default function AdminDashboard() {
  const { addToast } = useToast();
  const [products, setProducts] = useState(productService.getProducts());
  const [orders, setOrders] = useState(orderService.getOrders());

  // Dashboard state
  const [timeframe, setTimeframe] = useState('30d');
  const [chartMetric, setChartMetric] = useState('revenue'); // 'revenue' | 'orders'
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedOrderModal, setSelectedOrderModal] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const activeTimeframe = TIMEFRAME_DATA[timeframe] || TIMEFRAME_DATA['30d'];

  const refreshData = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setProducts(productService.getProducts());
      setOrders(orderService.getOrders());
      setIsRefreshing(false);
      addToast('Dashboard data refreshed successfully.', 'info');
    }, 350);
  };

  // Metrics Calculations
  const baseRevenue = 128450;
  const totalCalculatedRevenue = useMemo(() => {
    const rawSum = orders.reduce((sum, o) => sum + (o.total || 0), baseRevenue);
    return Math.round(rawSum * activeTimeframe.revenueMult);
  }, [orders, activeTimeframe]);

  const totalCalculatedOrders = useMemo(() => {
    return Math.round((1420 + orders.length) * activeTimeframe.ordersMult);
  }, [orders, activeTimeframe]);

  const averageOrderValue = useMemo(() => {
    return (totalCalculatedRevenue / Math.max(1, totalCalculatedOrders)).toFixed(2);
  }, [totalCalculatedRevenue, totalCalculatedOrders]);

  const lowStockProducts = products.filter((p) => p.stock <= 5);

  // Quick Restock Handler
  const handleQuickRestock = (productId, amount = 10) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    const newStock = (prod.stock || 0) + amount;
    productService.updateProduct(productId, { ...prod, stock: newStock });
    setProducts(productService.getProducts());
    addToast(`Restocked ${prod.name} (+${amount} units). Total stock: ${newStock}`, 'success');
  };

  // Order Quick Status Update
  const handleQuickStatusChange = (orderId, newStatus) => {
    orderService.updateOrderStatus(orderId, newStatus);
    setOrders(orderService.getOrders());
    addToast(`Order ${orderId} status updated to ${newStatus}`, 'success');
  };

  // SVG Chart Dimensions & Spline Coordinates
  const chartPoints = activeTimeframe.chartPoints;
  const maxVal = Math.max(...chartPoints.map((p) => (chartMetric === 'revenue' ? p.revenue : p.orders)));
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* 1. CLEAN EXECUTIVE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Store performance, revenue breakdown, and order fulfillment.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Timeframe Switcher Tabs */}
          <div className="flex items-center rounded-xl bg-white border border-slate-200 p-1 shadow-2xs">
            {[
              { id: 'today', label: 'Today' },
              { id: '7d', label: '7D' },
              { id: '30d', label: '30D' },
              { id: 'ytd', label: 'YTD' }
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTimeframe(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timeframe === t.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
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
            className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          {/* Export Report Trigger */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExportModalOpen(true)}
            className="text-slate-700 border-slate-300 bg-white hover:bg-slate-50 shadow-2xs"
          >
            <Download className="w-4 h-4 mr-1.5 text-blue-600" />
            <span>Export</span>
          </Button>

          {/* Quick Add Product */}
          <Link to="/admin/products">
            <Button variant="primary" size="sm" className="shadow-xs shadow-blue-500/20">
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Add Product</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. FOUR CLEAN, ACTIONABLE METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Revenue */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Total Revenue
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {formatUSD(totalCalculatedRevenue)}
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              ≈ {formatKHR(totalCalculatedRevenue)}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold mt-3 pt-2.5 border-t border-slate-100">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+14.2% vs previous period</span>
          </div>
        </div>

        {/* Metric 2: Orders Volume */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Total Orders
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {totalCalculatedOrders.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {orders.filter(o => o.status === 'confirmed' || o.status === 'processing').length} orders pending fulfillment
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold mt-3 pt-2.5 border-t border-slate-100">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+8.4% volume growth</span>
          </div>
        </div>

        {/* Metric 3: Average Order Value (AOV) */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Avg Order Value
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              ${averageOrderValue}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Per completed checkout
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-purple-600 font-semibold mt-3 pt-2.5 border-t border-slate-100">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+$5.20 vs last month</span>
          </div>
        </div>

        {/* Metric 4: Inventory Alert */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Inventory Alert
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {lowStockProducts.length} Products
            </div>
            <div className="text-[11px] text-amber-600 font-semibold mt-0.5">
              Require restock (≤ 5 units)
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mt-3 pt-2.5 border-t border-slate-100">
            <span>{products.length} active in catalog</span>
            <Link to="/admin/products" className="text-blue-600 font-bold hover:underline">
              Audit →
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
                Sales & Order Activity
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Financial performance for {activeTimeframe.label}.
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
                Revenue ($)
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
                Orders
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
                    {pt.data.label}
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
                  {pointsCoordinates[hoveredPoint].data.label}
                </div>
                <div className="font-mono font-bold text-sm text-blue-400">
                  {chartMetric === 'revenue'
                    ? formatUSD(pointsCoordinates[hoveredPoint].data.revenue)
                    : `${pointsCoordinates[hoveredPoint].data.orders} orders`}
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
                Revenue by Category
              </h2>
              <span className="text-[11px] text-slate-400 font-mono font-medium">30 Days</span>
            </div>

            <div className="space-y-3.5">
              {[
                { name: 'Audio & Acoustics', pct: 38, amount: '$48,200', color: 'bg-blue-600' },
                { name: 'Workspace Peripherals', pct: 25, amount: '$32,400', color: 'bg-indigo-600' },
                { name: 'Smart Wearables', pct: 22, amount: '$28,100', color: 'bg-emerald-600' },
                { name: 'Power & Mobile', pct: 15, amount: '$19,750', color: 'bg-amber-500' }
              ].map((c) => (
                <div key={c.name} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-700 font-medium">{c.name}</span>
                    <span className="font-mono font-bold text-slate-900">{c.amount} ({c.pct}%)</span>
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
                Payment Methods
              </h2>
              <span className="text-[11px] text-emerald-600 font-medium">Settled</span>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-red-50 text-red-600 border border-red-200">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">KHQR Bakong</span>
                    <span className="text-[10px] text-slate-500">ABA, Wing, ACLEDA, Sathapana</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-slate-900 block">68.2%</span>
                  <span className="text-[10px] text-slate-500 font-mono">$87,346</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Credit / Debit Card</span>
                    <span className="text-[10px] text-slate-500">Visa, MasterCard, JCB</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-slate-900 block">31.8%</span>
                  <span className="text-[10px] text-slate-500 font-mono">$41,104</span>
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
              Best-Selling Products
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ranked by total units ordered this month.
            </p>
          </div>
          <Link to="/admin/products" className="text-xs font-bold text-blue-600 hover:text-blue-700">
            View All Products →
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
                    {p.category}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-900 mt-0.5 block">
                    {formatUSD(p.price)}
                  </span>
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500">Stock:</span>
                <span
                  className={`font-bold font-mono text-[11px] ${
                    p.stock <= 5 ? 'text-amber-600' : 'text-emerald-600'
                  }`}
                >
                  {p.stock} units
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
              <h2 className="text-base font-bold text-slate-900">Recent Orders</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Update shipment stages instantly.
              </p>
            </div>
            <Link to="/admin/orders" className="text-xs font-bold text-blue-600 hover:text-blue-700">
              Orders Page →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Order ID</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Total</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
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
                        {o.customerName}
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
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedOrderModal(o)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                        title="View Details"
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
                  <span>Low Stock Alert</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Items requiring immediate reorder.
                </p>
              </div>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                {lowStockProducts.length} low
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
                        {p.stock} units left
                      </span>
                    </div>
                  </div>

                  {/* Restock Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleQuickRestock(p.id, 10)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-700 hover:bg-blue-600 hover:text-white border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                      title="Add 10 units"
                    >
                      +10
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickRestock(p.id, 50)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-700 hover:bg-emerald-600 hover:text-white border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                      title="Add 50 units"
                    >
                      +50
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Manage full stock list in Products</span>
            <Link to="/admin/products" className="text-blue-600 font-bold hover:underline">
              Inventory Catalog →
            </Link>
          </div>
        </div>
      </div>

      {/* Order Inspection Modal */}
      {selectedOrderModal && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedOrderModal(null)}
          title={`Order: ${selectedOrderModal.id}`}
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
          title="Export Sales Report"
        >
          <div className="space-y-4 text-xs font-sans">
            <p className="text-slate-600">
              Download CSV report for sales audit and inventory accounting:
            </p>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 font-mono text-[11px]">
              <div className="flex justify-between">
                <span>Period:</span>
                <strong className="text-slate-900">{activeTimeframe.label}</strong>
              </div>
              <div className="flex justify-between">
                <span>Total Revenue:</span>
                <strong className="text-blue-600">{formatUSD(totalCalculatedRevenue)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Total Orders:</span>
                <strong className="text-slate-900">{totalCalculatedOrders} orders</strong>
              </div>
              <div className="flex justify-between">
                <span>Estimated Tax (10%):</span>
                <strong className="text-slate-900">{formatUSD(totalCalculatedRevenue * 0.1)}</strong>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsExportModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setIsExportModalOpen(false);
                  addToast('Export report CSV successfully downloaded.', 'success');
                }}
              >
                <Download className="w-4 h-4 mr-1.5" />
                <span>Download CSV</span>
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
