import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  MapPin,
  ShieldCheck,
  ArrowRight,
  Truck,
  ChevronRight,
  TrendingUp,
  FileText,
  ExternalLink,
  ShoppingBag
} from 'lucide-react';
import { useAuth } from '../../store/StoreContext';
import { orderService, getOrderStatusMeta } from '../../services/orderService';
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
            <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span>All confirmed orders</span>
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

      {/* 2. RECENT ORDERS */}
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Recent Orders
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Your latest orders and delivery status.
            </p>
          </div>

          <Link
            to="/account/orders"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
          >
            <span>View All Orders</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-10 text-center bg-white rounded-2xl border border-slate-200">
            <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-900">No orders yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
              When you place an order, it will appear here with delivery updates and invoices.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <span>Browse Store</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recentOrders.map((ord) => {
              const statusMeta = getOrderStatusMeta(ord.status);
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
                  className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-colors flex flex-col gap-4"
                >
                  {/* Top Row: Order ID, Status Dot, Date & Total */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-100 gap-2">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      <span className="font-mono text-sm font-bold text-slate-900">
                        {ord.id}
                      </span>
                      <span className="text-slate-300">&middot;</span>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${statusMeta.textClass}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotClass}`} />
                        {statusMeta.label}
                      </span>
                      <span className="text-slate-300 hidden sm:inline">&middot;</span>
                      <span className="text-xs text-slate-500">
                        Placed on {formatDate(ord.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2">
                      <span className="text-xs text-slate-500">Total</span>
                      <span className="text-base font-bold text-slate-900 tabular-nums">
                        {formatUSD(ord.total)}
                      </span>
                    </div>
                  </div>

                  {/* Middle Row: Flat Product Items & Clean Actions */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                      {items.map((item, idx) => {
                        const cleanImg = productService.getCleanProductImage(item);
                        return (
                          <div key={idx} className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 p-1 flex items-center justify-center shrink-0">
                              <img
                                src={cleanImg}
                                alt={item.name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div className="min-w-0 max-w-[220px]">
                              <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                                {item.name}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                                {formatUSD(item.price)} &middot; Qty: {item.quantity || 1}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      <Link
                        to={`/orders/${ord.id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Track Delivery</span>
                      </Link>

                      <Link
                        to="/account/invoices"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 transition-colors"
                        title="View Invoice"
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

      {/* 3. DEFAULT SHIPPING ADDRESS */}
      <div className="pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Primary Shipping Address
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Default address used at checkout.
            </p>
          </div>

          <Link
            to="/account/addresses"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Manage Addresses &rarr;
          </Link>
        </div>

        {primaryAddress ? (
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <MapPin className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">
                    {primaryAddress.label || 'Work / Studio'}
                  </span>
                  <span className="text-xs text-slate-400">&middot;</span>
                  <span className="text-xs font-medium text-slate-500">
                    Default
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-700">
                  {primaryAddress.fullName || user?.name || 'Sara Meng'} &middot;{' '}
                  <span className="font-mono text-slate-600">
                    {primaryAddress.phone || user?.phone || '+855 12 888 999'}
                  </span>
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {primaryAddress.address}, {primaryAddress.city}, {primaryAddress.province}
                  {primaryAddress.postalCode && ` (Postal: ${primaryAddress.postalCode})`}
                </p>
              </div>
            </div>

            <Link
              to="/account/addresses"
              className="self-start sm:self-center px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 transition-colors shrink-0"
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
