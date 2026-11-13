import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck, FileText, Search, Package } from 'lucide-react';
import { orderService, getOrderStatusMeta } from '../../../services/orderService';
import { productService } from '../../../services/productService';
import { formatUSD } from '../../../utils/formatPrice';
import { formatDate } from '../../../utils/formatDate';
import { useLanguage } from '../../../store/StoreContext';
import { translateOrderStatusLabel } from '../../../utils/translations';
import Modal from '../../../components/common/Modal';
import Invoice from '../../../components/order/Invoice';

export default function AccountOrders() {
  const { language } = useLanguage();
  const orders = orderService.getOrders();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);

  const filteredOrders = orders.filter((ord) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      ord.id.toLowerCase().includes(q) ||
      (ord.status || '').toLowerCase().includes(q) ||
      (ord.items || []).some((i) => i.name.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 mb-6 gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {language === 'km' ? 'ប្រវត្តិការកុម្ម៉ង់' : 'Order History'}
          </h2>
          <p className="text-xs text-slate-500">
            {language === 'km'
              ? 'តាមដានការកុម្ម៉ង់កន្លងមក ដំណើរការដឹកជញ្ជូន និងមើលវិក្កយបត្រផ្លូវការ។'
              : 'Track past hardware orders, shipping progress, and access official tax invoices.'}
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={language === 'km' ? 'ស្វែងរកតាមលេខកូដកុម្ម៉ង់ ឬឈ្មោះទំនិញ...' : 'Search by order ID or item...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            {language === 'km' ? 'រកមិនឃើញការកុម្ម៉ង់ទេ' : 'No orders found'}
          </h3>
          <p className="text-xs text-slate-500">
            {language === 'km'
              ? 'មិនមានការទិញណាត្រូវនឹងការស្វែងរករបស់អ្នកឡើយ។'
              : 'No purchases matching your search query.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3">{language === 'km' ? 'លេខកូដកុម្ម៉ង់' : 'Order ID'}</th>
                <th className="py-3 px-3">{language === 'km' ? 'កាលបរិច្ឆេទ' : 'Date'}</th>
                <th className="py-3 px-3">{language === 'km' ? 'មុខទំនិញ' : 'Items'}</th>
                <th className="py-3 px-3">{language === 'km' ? 'សរុប' : 'Total'}</th>
                <th className="py-3 px-3">{language === 'km' ? 'ស្ថានភាព' : 'Status'}</th>
                <th className="py-3 px-3 text-right">{language === 'km' ? 'សកម្មភាព' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-3 font-mono font-bold text-blue-600">
                    <Link to={`/orders/${ord.id}`} className="hover:underline">
                      {ord.id}
                    </Link>
                  </td>
                  <td className="py-3.5 px-3 text-slate-500 whitespace-nowrap">
                    {formatDate(ord.createdAt)}
                  </td>
                  <td className="py-3.5 px-3 text-slate-700">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-100/80 border border-slate-200/80 p-1 flex items-center justify-center shrink-0">
                        <img
                          src={productService.getCleanProductImage(ord.items?.[0])}
                          alt={ord.items?.[0]?.name || 'Hardware'}
                          className="w-full h-full object-contain drop-shadow-xs"
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 block truncate max-w-[200px]">
                          {ord.items?.[0]?.name || (language === 'km' ? 'ផលិតផល TechTonic' : 'TechTonic Hardware')}
                        </span>
                        {(ord.items?.length || 1) > 1 ? (
                          <span className="text-[11px] font-medium text-blue-600">
                            {language === 'km' ? `+${ord.items.length - 1} មុខទំនិញទៀត` : `+${ord.items.length - 1} more items`}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            {language === 'km' ? '១ មុខទំនិញ' : '1 Item'}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 font-bold text-slate-900 font-mono whitespace-nowrap">
                    {formatUSD(ord.total)}
                  </td>
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    {(() => {
                      const statusMeta = getOrderStatusMeta(ord.status);
                      return (
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${statusMeta.textClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotClass}`} />
                          {translateOrderStatusLabel(statusMeta.label, language)}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="py-3.5 px-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/orders/${ord.id}`}
                        className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        title={language === 'km' ? 'តាមដានការដឹកជញ្ជូន' : 'Track shipment'}
                      >
                        <Truck className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => setSelectedInvoiceOrder(ord)}
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                        title={language === 'km' ? 'មើលវិក្កយបត្រពន្ធ' : 'View Tax Invoice'}
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invoice Modal */}
      {selectedInvoiceOrder && (
        <Modal
          isOpen={!!selectedInvoiceOrder}
          onClose={() => setSelectedInvoiceOrder(null)}
          title={language === 'km' ? 'វិក្កយបត្រពន្ធ' : 'Tax Invoice'}
          size="xl"
        >
          <Invoice order={selectedInvoiceOrder} onBack={() => setSelectedInvoiceOrder(null)} />
        </Modal>
      )}
    </div>
  );
}
