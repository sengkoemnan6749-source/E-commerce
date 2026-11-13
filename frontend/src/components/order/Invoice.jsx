import React, { useState } from 'react';
import {
  Printer,
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  Truck,
  Calendar,
  CreditCard,
  FileCheck2,
  Copy,
  Check,
  Package
} from 'lucide-react';
import { formatUSD, formatKHR } from '../../utils/formatPrice';
import { formatDate } from '../../utils/formatDate';
import { formatOrderStatus } from '../../services/orderService';
import Button from '../common/Button';
import { useLanguage } from '../../store/StoreContext';
import { translateOrderStatusLabel } from '../../utils/translations';

export default function Invoice({ order, onBack }) {
  const [copied, setCopied] = useState(false);
  const { language } = useLanguage();

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyId = () => {
    if (order.id) {
      navigator.clipboard.writeText(order.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Resolve customer & address info safely
  const address = order.shippingAddress || order.customer || {};
  const customerName = address.fullName || order.customerName || 'Sara Meng';
  const customerPhone = address.phone || order.customerPhone || '+855 12 345 678';
  const customerEmail = address.email || order.customerEmail || 'customer@techtonic.store';
  const fullAddress = address.address
    ? `${address.address}, ${address.city || ''} ${address.province || ''} ${address.postalCode || ''}`.trim()
    : 'Street 310, Building 24, BKK1, Phnom Penh 120101, Cambodia';

  // Calculations
  const subtotal = order.subtotal || order.total || 0;
  const shippingFee = order.shippingFee !== undefined ? order.shippingFee : 0;
  const discount = order.discount || order.discountAmount || 0;
  const grandTotal = order.total || (subtotal + shippingFee - discount);

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Top Action Bar (Hidden when printing) */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 print:hidden">
        {onBack ? (
          <Button variant="ghost" size="sm" onClick={onBack} className="text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span>{language === 'km' ? 'ត្រឡប់ទៅការកុម្ម៉ង់' : 'Back to Orders'}</span>
          </Button>
        ) : <div />}

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyId}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            title={language === 'km' ? 'ចម្លងលេខកូដកុម្ម៉ង់' : 'Copy Order ID'}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">
                  {language === 'km' ? 'បានចម្លង!' : 'Copied!'}
                </span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>{language === 'km' ? 'ចម្លងលេខកូដកុម្ម៉ង់' : 'Copy Order ID'}</span>
              </>
            )}
          </button>

          <Button variant="primary" size="sm" onClick={handlePrint} className="shadow-sm">
            <Printer className="w-4 h-4 mr-1.5" />
            <span>{language === 'km' ? 'បោះពុម្ព / រក្សាទុកជា PDF' : 'Print / Save as PDF'}</span>
          </Button>
        </div>
      </div>

      {/* Invoice Sheet */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 md:p-10 print:border-none print:shadow-none print:p-0 text-slate-800">
        
        {/* Top Header: Company info & Invoice Number */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-slate-200">
          {/* Company Branding */}
          <div className="space-y-1.5 max-w-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center text-lg font-black shadow-md shadow-blue-500/20">
                T
              </div>
              <div>
                <span className="text-xl font-black text-slate-900 tracking-tight block leading-tight">
                  TechTonic Store
                </span>
                <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider block">
                  {language === 'km' ? 'ហាងលក់បច្ចេកវិទ្យាផ្លូវការ' : 'Official Technology Retailer'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 italic pt-1">
              {language === 'km'
                ? '"រចនាឡើងសម្រាប់របៀបរស់នៅបែបឌីជីថលសម័យថ្មី"'
                : '"Engineered for the Modern Digital Lifestyle"'}
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              {language === 'km'
                ? '#271 មហាវិថីមុន្នីរ៉េត ទួលគោក រាជធានីភ្នំពេញ ព្រះរាជាណាចក្រកម្ពុជា'
                : '#271 Monireth Blvd, Toul Kork, Phnom Penh, Kingdom of Cambodia'}
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-500 pt-0.5">
              <span>{language === 'km' ? 'ទូរស័ព្ទ៖' : 'Tel:'} +855 23 888 999</span>
              <span>•</span>
              <span className="font-mono font-medium text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                VAT TIN: K009-902381204
              </span>
            </div>
          </div>

          {/* Invoice Reference & Status */}
          <div className="md:text-right space-y-2">
            <div className="inline-block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                {language === 'km' ? 'វិក្កយបត្រពន្ធផ្លូវការ' : 'Official Tax Invoice'}
              </span>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                {language === 'km' ? 'វិក្កយបត្រ' : 'INVOICE'}
              </h1>
            </div>

            <div>
              <span className="font-mono text-base font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2.5 py-1 rounded-lg inline-block whitespace-nowrap">
                {order.id}
              </span>
            </div>

            <div className="text-xs text-slate-500 space-y-0.5">
              <p>
                <span className="text-slate-400">
                  {language === 'km' ? 'ថ្ងៃចេញវិក្កយបត្រ៖' : 'Date Issued:'}
                </span>{' '}
                <strong className="text-slate-700">{formatDate(order.createdAt)}</strong>
              </p>
              <p>
                <span className="text-slate-400">
                  {language === 'km' ? 'ការទូទាត់៖' : 'Payment:'}
                </span>{' '}
                <span className="text-slate-700 font-medium">{order.paymentMethod || 'Bakong KHQR'}</span>
              </p>
            </div>

            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {order.paymentStatus || 'PAID'} •{' '}
                  {language === 'km' ? 'បានទូទាត់តាមប្រព័ន្ធបាគង NBC' : 'NBC Bakong Settled'}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Customer & Order Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
          {/* Recipient Details */}
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/70">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>{language === 'km' ? 'ចេញវិក្កយបត្រ និងដឹកជញ្ជូនទៅ' : 'Billed & Shipped To'}</span>
            </div>
            
            <p className="font-bold text-slate-900 text-sm">{customerName}</p>
            
            <div className="mt-2 space-y-1 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="font-medium text-slate-800">{customerPhone}</span>
              </div>
              {customerEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="text-slate-600">{customerEmail}</span>
                </div>
              )}
              <div className="pt-1 text-slate-600 leading-relaxed">
                {fullAddress}
              </div>
            </div>
          </div>

          {/* Fulfillment Details */}
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/70">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              <Truck className="w-3.5 h-3.5 text-blue-600" />
              <span>
                {language === 'km' ? 'ព័ត៌មានរៀបចំ និងការដឹកជញ្ជូន' : 'Fulfillment & Delivery Details'}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">
                  {language === 'km' ? 'ស្ថានភាពកុម្ម៉ង់៖' : 'Order Status:'}
                </span>
                <span className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-blue-100 text-blue-800 uppercase tracking-wide">
                  {translateOrderStatusLabel(formatOrderStatus(order.status || 'Confirmed'), language)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">
                  {language === 'km' ? 'ក្រុមហ៊ុនដឹកជញ្ជូន៖' : 'Carrier / Courier:'}
                </span>
                <span className="font-semibold text-slate-800">
                  {order.tracking?.courier || order.carrier || 'TechTonic Express Dispatch'}
                </span>
              </div>

              {order.tracking?.trackingCode && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">
                    {language === 'km' ? 'លេខកូដតាមដាន៖' : 'Tracking Number:'}
                  </span>
                  <span className="font-mono font-bold text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    {order.tracking.trackingCode}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-slate-500">
                  {language === 'km' ? 'រូបិយប័ណ្ណទូទាត់៖' : 'Billing Currency:'}
                </span>
                <span className="font-semibold text-slate-800">USD ($) / KHR (៛)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="my-6 border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
                <th className="py-3 px-4 w-12 text-center text-slate-500">#</th>
                <th className="py-3 px-4">{language === 'km' ? 'បរិយាយមុខទំនិញ' : 'Item Description'}</th>
                <th className="py-3 px-4 w-24 text-center">{language === 'km' ? 'ចំនួន' : 'Qty'}</th>
                <th className="py-3 px-6 w-36 text-right">{language === 'km' ? 'តម្លៃរាយ' : 'Unit Price'}</th>
                <th className="py-3 px-6 w-36 text-right">{language === 'km' ? 'សរុប' : 'Total'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {(order.items || []).map((item, idx) => {
                const itemVariant = item.variant || item.selectedVariant;
                const lineTotal = item.price * (item.quantity || 1);
                return (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">
                        {item.name}
                      </div>
                      {itemVariant && (
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-400" />
                          <span>
                            {language === 'km' ? 'ជម្រើស៖' : 'Variant:'} {itemVariant}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-xs">
                        {item.quantity || 1}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right font-mono font-medium text-slate-700 whitespace-nowrap">
                      {formatUSD(item.price)}
                    </td>
                    <td className="py-3.5 px-6 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {formatUSD(lineTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Bottom Section: Official Stamp & Totals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 items-start">
          
          {/* Official Verification Seal & Compliance Note */}
          <div className="border border-slate-200/80 bg-slate-50/50 rounded-xl p-4 text-xs space-y-2.5">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
              <FileCheck2 className="w-4 h-4 text-emerald-600" />
              <span>
                {language === 'km'
                  ? 'វិក្កយបត្រពន្ធអេឡិចត្រូនិចកម្ពុជាដែលបានបញ្ជាក់'
                  : 'Verified Cambodian Electronic Tax Invoice'}
              </span>
            </div>
            
            <p className="text-slate-500 text-[11px] leading-relaxed">
              {language === 'km'
                ? 'វិក្កយបត្រនេះត្រូវបានបង្កើតតាមប្រព័ន្ធអេឡិចត្រូនិចក្រោមការណែនាំរបស់អគ្គនាយកដ្ឋានពន្ធដារ (GDT)។ ផលិតផលទាំងអស់រួមបញ្ចូលការធានាពីក្រុមហ៊ុនផលិត និងពន្ធនាំចូលកម្ពុជា។'
                : 'This invoice is generated electronically under General Department of Taxation (GDT) guidelines. All products include genuine manufacturer warranty and Cambodia import duty.'}
            </p>

            <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px] text-slate-500">
              <span>
                {language === 'km' ? 'ប្រព័ន្ធទូទាត់បាគងជាតិ៖' : 'National Bakong Switch:'}{' '}
                <strong>{language === 'km' ? 'បានទូទាត់រួចរាល់' : 'Settled'}</strong>
              </span>
              <span className="font-mono text-emerald-700 font-semibold">REF: NBC-KHQR-OK</span>
            </div>
          </div>

          {/* Totals Breakdown */}
          <div className="bg-slate-50/90 border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex justify-between items-center text-xs text-slate-600">
              <span>{language === 'km' ? 'តម្លៃទំនិញសរុប៖' : 'Subtotal:'}</span>
              <span className="font-mono font-semibold text-slate-900 text-sm">
                {formatUSD(subtotal)}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-600">
              <span>{language === 'km' ? 'ថ្លៃដឹកជញ្ជូន៖' : 'Delivery / Shipping Fee:'}</span>
              <span className="font-semibold text-slate-900">
                {shippingFee === 0 ? (
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold text-xs">
                    {language === 'km' ? 'ឥតគិតថ្លៃ' : 'FREE'}
                  </span>
                ) : (
                  <span className="font-mono">{formatUSD(shippingFee)}</span>
                )}
              </span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between items-center text-xs text-emerald-700 font-medium">
                <span>{language === 'km' ? 'បញ្ចុះតម្លៃប្រូម៉ូសិន៖' : 'Promo Discount Applied:'}</span>
                <span className="font-mono font-bold">
                  -{formatUSD(discount)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center text-[11px] text-slate-400">
              <span>{language === 'km' ? 'អាករលើតម្លៃបន្ថែម (VAT 10%)៖' : 'Value Added Tax (VAT 10%):'}</span>
              <span className="italic">
                {language === 'km' ? 'រួមបញ្ចូលក្នុងតម្លៃ' : 'Included in price'}
              </span>
            </div>

            {/* Grand Total Divider */}
            <div className="pt-3 border-t-2 border-slate-200 flex justify-between items-baseline">
              <div>
                <span className="text-sm font-black text-slate-900 block uppercase tracking-wide">
                  {language === 'km' ? 'សរុបរួម' : 'Grand Total'}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {language === 'km' ? 'សរុបត្រូវទូទាត់ (ដុល្លារ និង រៀល)' : 'Total Payable (USD & KHR)'}
                </span>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black text-slate-950 font-mono tracking-tight block">
                  {formatUSD(grandTotal)}
                </span>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60 inline-block mt-0.5">
                  {formatKHR(grandTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Guarantee & Contact */}
        <div className="mt-8 pt-6 border-t border-dashed border-slate-200 text-center text-xs text-slate-500 space-y-1">
          <p className="font-medium text-slate-700">
            {language === 'km'
              ? 'សូមអរគុណសម្រាប់ការទិញទំនិញនៅ TechTonic Store កម្ពុជា!'
              : 'Thank you for shopping with TechTonic Store Cambodia!'}
          </p>
          <p className="text-[11px] text-slate-400">
            {language === 'km' ? (
              <>
                សម្រាប់ការប្តូរទំនិញ ការទាមទារធានា ឬជំនួយ សូមផ្ញើអ៊ីមែលមកកាន់{' '}
                <span className="text-blue-600 font-medium">support@techtonic.store</span> ឬទូរស័ព្ទមកកាន់{' '}
                <span className="text-slate-600 font-medium">+855 23 888 999</span> (ច័ន្ទ–អាទិត្យ ៨ព្រឹក–៨យប់)។
              </>
            ) : (
              <>
                For returns, warranty claims, or support, email{' '}
                <span className="text-blue-600 font-medium">support@techtonic.store</span> or call hotline{' '}
                <span className="text-slate-600 font-medium">+855 23 888 999</span> (Mon–Sun 8AM–8PM).
              </>
            )}
          </p>
        </div>

      </div>
    </div>
  );
}
