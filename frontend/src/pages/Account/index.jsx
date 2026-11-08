import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  MapPin,
  ShieldCheck,
  ArrowRight,
  Clock,
  Truck,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  FileText,
  Sparkles,
  ExternalLink,
  ShoppingBag
} from 'lucide-react';
import { useAuth } from '../../store/StoreContext';
import { orderService } from '../../services/orderService';
import { productService } from '../../services/productService';
import { formatUSD } from '../../utils/formatPrice';
import { formatDate } from '../../utils/formatDate';

export default function AccountOverview() {
  const { user } = useAuth();
  const orders = orderService.getOrders();

  const totalSpent = useMemo(() => {
    return orders.reduce((sum, ord) => sum + (Number(ord.total) || 0), 0);
  }, [orders]);

  const recentOrders = orders.slice(0, 3);
  const primaryAddress = user?.addresses?.[0] || user?.savedAddresses?.[0] || null;

  const getStatusBadge = (status = '') => {
    const s = status.toLowerCase();
    if (s.includes('deliver') && !s.includes('out')) {
      return {
        label: 'Delivered',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      };
    }
    if (s.includes('out') || s.includes('transit') || s.includes('shipped')) {
      return {
        label: status,
        className: 'bg-blue-50 text-blue-700 border-blue-200'
      };
    }
    return {
      label: status || 'Confirmed',
      className: 'bg-amber-50 text-amber-700 border-amber-200'
    };
  };

  return (
    <div className="space-y-10">
      
      {/* 1. TOP METRIC TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        
        {/* Total Orders Card */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Orders
            </span>
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {orders.length}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span>Completed purchases</span>
              <Link to="/account/orders" className="font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5">
                <span>View</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Total Spent Card */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Spent
            </span>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {formatUSD(totalSpent)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span>All confirmed orders</span>
              <span className="font-semibold text-emerald-700">Rewards Active</span>
            </div>
          </div>
        </div>

        {/* Warranty Status Card */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Warranty Status
            </span>
            <ShieldCheck className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              Active
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span>1-Year Official Coverage</span>
              <span className="font-semibold text-slate-700">Phnom Penh Flagship</span>
            </div>
          </div>
        </div>

      </div>

      {/* 2. RECENT ORDERS (Visual Cards with Thumbnails) */}
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Recent Orders</span>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                {orders.length} Total
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live fulfillment status, hardware serials, and delivery progress.
            </p>
          </div>

          <Link
            to="/account/orders"
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 group transition-colors"
          >
            <span>View All Orders</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-12 text-center bg-slate-50/80 rounded-3xl border border-slate-200">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">No hardware orders yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
              Browse our catalog of studio acoustics, titanium wearables, and GaN fast chargers.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all"
            >
              <span>Explore Hardware Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recentOrders.map((ord) => {
              const badge = getStatusBadge(ord.status);
              const items = ord.items && ord.items.length > 0
                ? ord.items
                : [
                    {
                      id: 'prod-001',
                      name: 'TechTonic Hardware Unit',
                      price: ord.total,
                      quantity: 1,
                      image: '/images/products/prod-001-main.png'
                    }
                  ];

              return (
                <div
                  key={ord.id}
                  className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 hover:border-blue-400/80 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col gap-4 group"
                >
                  {/* Top Row: Order ID, Date, Status & Total */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-100 gap-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-xs sm:text-sm font-extrabold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {ord.id}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                      <span className="text-xs text-slate-400">
                        Placed on {formatDate(ord.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <span className="text-xs text-slate-400 font-medium">Order Total:</span>
                      <span className="text-base sm:text-lg font-black text-slate-900">
                        {formatUSD(ord.total)}
                      </span>
                    </div>
                  </div>

                  {/* Middle Row: Product Thumbnails & Titles */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                      {items.map((item, idx) => {
                        const cleanImg = productService.getCleanProductImage(item);
                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-3 p-2 rounded-2xl bg-slate-50 border border-slate-200/70 hover:bg-slate-100/70 transition-colors"
                          >
                            <div className="w-12 h-12 rounded-xl bg-white border border-slate-200/80 p-1 flex items-center justify-center shrink-0 shadow-2xs">
                              <img
                                src={cleanImg}
                                alt={item.name}
                                className="w-full h-full object-contain drop-shadow-xs"
                              />
                            </div>
                            <div className="pr-2 max-w-[200px]">
                              <p className="text-xs font-bold text-slate-900 truncate">
                                {item.name}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                                <span className="font-semibold text-slate-700">
                                  {formatUSD(item.price)}
                                </span>
                                <span>•</span>
                                <span className="font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded">
                                  Qty: {item.quantity || 1}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Action Buttons for this order */}
                    <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                      <Link
                        to={`/orders/${ord.id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all active:scale-95"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Track Delivery</span>
                      </Link>

                      <Link
                        to="/account/invoices"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
                        title="Download Invoice"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Invoice</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. DEFAULT SHIPPING ADDRESS & VERIFIED LOCATION */}
      <div className="pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Primary Shipping Address</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                Verified Dispatch
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Default location used for 1-click checkout and express courier routing.
            </p>
          </div>

          <Link
            to="/account/addresses"
            className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
          >
            Manage Addresses &rarr;
          </Link>
        </div>

        {primaryAddress ? (
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-50/90 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900">
                    {primaryAddress.label || 'Work / Studio Lab'}
                  </span>
                  <span className="text-[10px] font-extrabold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                    DEFAULT
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-800">
                  {primaryAddress.fullName || user?.name || 'Sara Meng'} •{' '}
                  <span className="font-mono text-slate-600">
                    {primaryAddress.phone || user?.phone || '+855 12 888 999'}
                  </span>
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {primaryAddress.address}, {primaryAddress.city}, {primaryAddress.province}
                  {primaryAddress.postalCode && ` (Postal: ${primaryAddress.postalCode})`}
                </p>
              </div>
            </div>

            <Link
              to="/account/addresses"
              className="self-start sm:self-center px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 shadow-2xs transition-colors shrink-0"
            >
              Edit Details
            </Link>
          </div>
        ) : (
          <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 text-center">
            <p className="text-xs text-slate-500 mb-3">No default shipping address saved yet.</p>
            <Link
              to="/account/addresses"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Add Shipping Address</span>
            </Link>
          </div>
        )}
      </div>

      {/* 4. ACCOUNT SHORTCUTS */}
      <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/shop"
          className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 hover:shadow-2xs transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <span className="text-xs font-bold text-slate-900 block">Catalog Browse</span>
              <span className="text-[11px] text-slate-500">Explore products</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
        </Link>

        <Link
          to="/account/invoices"
          className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 hover:shadow-2xs transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <span className="text-xs font-bold text-slate-900 block">Tax Receipts</span>
              <span className="text-[11px] text-slate-500">Download PDF bills</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
        </Link>

        <a
          href="mailto:warranty@techtonic.dev"
          className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 hover:shadow-2xs transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <span className="text-xs font-bold text-slate-900 block">Warranty Claim</span>
              <span className="text-[11px] text-slate-500">Official Flagship Hub</span>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
        </a>
      </div>

    </div>
  );
}
