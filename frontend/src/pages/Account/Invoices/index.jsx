import React, { useState } from 'react';
import { FileText, Printer, Download, Eye, ExternalLink } from 'lucide-react';
import { orderService } from '../../../services/orderService';
import { formatUSD } from '../../../utils/formatPrice';
import { formatDate } from '../../../utils/formatDate';
import { useLanguage } from '../../../store/StoreContext';
import Modal from '../../../components/common/Modal';
import Invoice from '../../../components/order/Invoice';
import Button from '../../../components/common/Button';

export default function AccountInvoices() {
  const { language } = useLanguage();
  const orders = orderService.getOrders();
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  return (
    <div>
      <div className="pb-4 border-b border-slate-100 mb-6">
        <h2 className="text-lg font-bold text-slate-900">
          {language === 'km' ? 'វិក្កយបត្រ & បង្កាន់ដៃ' : 'Invoices & Receipts'}
        </h2>
        <p className="text-xs text-slate-500">
          {language === 'km'
            ? 'វិក្កយបត្រលក់ផ្លូវការស្របតាមស្តង់ដារ VAT សម្រាប់គណនេយ្យ និងការកាត់បន្ថយពន្ធក្រុមហ៊ុន។'
            : 'Official VAT-compliant sales invoices for accounting and company tax deductions.'}
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <p className="text-xs text-slate-500">
            {language === 'km' ? 'មិនទាន់មានវិក្កយបត្រត្រូវបានបង្កើតនៅឡើយទេ។' : 'No invoices generated yet.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3">{language === 'km' ? 'លេខវិក្កយបត្រ' : 'Invoice Number'}</th>
                <th className="py-3 px-3">{language === 'km' ? 'កាលបរិច្ឆេទកុម្ម៉ង់' : 'Order Date'}</th>
                <th className="py-3 px-3">{language === 'km' ? 'វិធីសាស្ត្រទូទាត់' : 'Payment Method'}</th>
                <th className="py-3 px-3">{language === 'km' ? 'ទឹកប្រាក់សរុប' : 'Total Amount'}</th>
                <th className="py-3 px-3 text-right">{language === 'km' ? 'សកម្មភាព' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-3 font-mono font-bold text-slate-900">
                    INV-{ord.id.replace('#ORD-', '')}
                  </td>
                  <td className="py-3.5 px-3 text-slate-500">{formatDate(ord.createdAt)}</td>
                  <td className="py-3.5 px-3 text-slate-700">{ord.paymentMethod || 'KHQR'}</td>
                  <td className="py-3.5 px-3 font-bold text-slate-900 font-mono">
                    {formatUSD(ord.total)}
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedInvoice(ord)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{language === 'km' ? 'មើលវិក្កយបត្រ' : 'View Invoice'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invoice Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={`${language === 'km' ? 'វិក្កយបត្រ' : 'Invoice'} INV-${selectedInvoice.id.replace('#ORD-', '')}`}
          size="xl"
        >
          <Invoice order={selectedInvoice} onBack={() => setSelectedInvoice(null)} />
        </Modal>
      )}
    </div>
  );
}
