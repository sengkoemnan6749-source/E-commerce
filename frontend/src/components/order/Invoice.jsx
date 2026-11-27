import React, { useState } from 'react';
import { Printer, ArrowLeft, Phone, Mail, Globe, Send, Copy, Check } from 'lucide-react';
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
      navigator.clipboard?.writeText(order.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const address = order.shippingAddress || order.customer || {};
  const customerName = address.fullName || order.customerName || '-';
  const customerPhone = address.phone || order.customerPhone || '-';
  const customerEmail = address.email || order.customerEmail || '';
  const fullAddress = [address.address, address.city, address.province, address.postalCode]
    .filter(Boolean)
    .join(', ') || '-';

  const items = Array.isArray(order.items) ? order.items : [];
  const blankRowCount = Math.max(0, 7 - items.length);

  const subtotal = order.subtotal ?? order.total ?? 0;
  const shippingFee = order.shippingFee !== undefined ? order.shippingFee : 0;
  const discount = order.discount || order.discountAmount || 0;
  const grandTotal = order.total ?? (subtotal + shippingFee - discount);
  const trackingCode = order.tracking?.trackingCode || order.trackingNumber || '';
  const courierName = order.tracking?.courier || order.carrier || order.deliveryPartner || 'Vireak Buntham Express';

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Top Action Bar (Hidden when printing) */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 print:hidden">
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition cursor-pointer"
            title={language === 'km' ? 'ចម្លងលេខកូដកុម្ម៉ង់' : 'Copy Order ID'}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-slate-900 font-semibold">
                  {language === 'km' ? 'បានចម្លង' : 'Copied'}
                </span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>{language === 'km' ? 'ចម្លងលេខកូដ' : 'Copy Order ID'}</span>
              </>
            )}
          </button>

          <Button variant="secondary" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4" />
            <span>{language === 'km' ? 'បោះពុម្ព / រក្សាទុក PDF' : 'Print / Save PDF'}</span>
          </Button>
        </div>
      </div>

      {/* Ruled Formal Paper Invoice Sheet */}
      <div
        className="bg-white border border-slate-300 shadow-sm p-4 sm:p-9 print:border-none print:shadow-none print:p-0 text-slate-900"
        style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
      >
        {/* Header: Brand Logo + Address Strip Left | Ruled Customer Details Right */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left: Website Logo & Shop Info Box */}
          <div className="md:col-span-6 space-y-3">
            <div className="flex items-center gap-2.5">
              <img
                src="/images/logo/techtonic-crest.png"
                alt="TechTonic Crest"
                className="w-11 h-11 object-contain drop-shadow-[0_1px_1px_rgba(15,23,42,0.22)] shrink-0"
              />
              <div>
                <img
                  src="/images/logo/techtonic-script-orange.png"
                  alt="TechTonic"
                  className="h-7 w-auto object-contain drop-shadow-[0_1px_1px_rgba(15,23,42,0.25)]"
                />
                <span className="block text-[10px] font-bold uppercase tracking-[0.26em] text-slate-700 mt-0.5">
                  {language === 'km' ? 'ហាងលក់បច្ចេកវិទ្យាផ្លូវការ' : 'OFFICIAL HARDWARE STORE'}
                </span>
              </div>
            </div>

            <div className="bg-slate-100 border-l-4 border-[#0f172a] px-3.5 py-2.5 text-xs text-slate-800 space-y-0.5 leading-relaxed">
              <div>
                <span className="font-semibold">
                  {language === 'km' ? 'អាសយដ្ឋាន៖ ' : 'Address: '}
                </span>
                {language === 'km'
                  ? '#271 មហាវិថីមុន្នីរ៉េត ទួលគោក ភ្នំពេញ'
                  : '#271 Monireth Blvd, Toul Kork, Phnom Penh'}
              </div>
              <div>
                <span className="font-semibold">Email: </span>support@techtonic.store
              </div>
              <div>
                <span className="font-semibold">Tel: </span>+855 23 888 999
                <span className="mx-2 text-slate-400">·</span>
                <span className="font-mono text-[11px]">VAT TIN: K009-902381204</span>
              </div>
            </div>
          </div>

          {/* Right: Clean Ruled Customer Info Lines */}
          <div className="md:col-span-6 space-y-2.5 pt-1 text-xs">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-slate-700 shrink-0 w-20">
                {language === 'km' ? 'អតិថិជន៖' : 'Name:'}
              </span>
              <span className="flex-1 border-b border-slate-400 pb-0.5 font-semibold text-slate-900 truncate">
                {customerName}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-slate-700 shrink-0 w-20">
                {language === 'km' ? 'ទូរស័ព្ទ៖' : 'Phone:'}
              </span>
              <span className="flex-1 border-b border-slate-400 pb-0.5 font-mono text-slate-900">
                {customerPhone}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-slate-700 shrink-0 w-20">
                {language === 'km' ? 'កាលបរិច្ឆេទ៖' : 'Date:'}
              </span>
              <span className="flex-1 border-b border-slate-400 pb-0.5 text-slate-900">
                {formatDate(order.createdAt)}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-slate-700 shrink-0 w-20">
                {language === 'km' ? 'លេខវិក្កយបត្រ៖' : 'Invoice No:'}
              </span>
              <span className="flex-1 border-b border-slate-400 pb-0.5 font-mono font-bold text-slate-900">
                {order.id}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-slate-700 shrink-0 w-20">
                {language === 'km' ? 'ទីតាំងដឹក៖' : 'Address:'}
              </span>
              <span className="flex-1 border-b border-slate-400 pb-0.5 text-slate-800 leading-snug break-words">
                {fullAddress}
              </span>
            </div>
          </div>
        </div>

        {/* Full-Width Solid Accent Rule */}
        <div className="mt-5 mb-4">
          <div className="h-2.5 w-full bg-[#0f172a]" />
        </div>

        {/* Centered Underlined Document Title */}
        <div className="text-center mb-4">
          <h1 className="inline-block text-lg sm:text-xl font-bold uppercase tracking-[0.2em] text-slate-900 border-b-2 border-slate-900 pb-0.5">
            {language === 'km' ? 'វិក្កយបត្រផ្លូវការ' : 'OFFICIAL INVOICE'}
          </h1>
        </div>

        {/* Ledger Table + Totals Wrapper with Centered Website Logo Watermark */}
        <div className="relative">
          {/* Background Website Logo Watermark */}
          <div
            aria-hidden="true"
            className="pointer-events-none select-none absolute inset-x-0 top-10 bottom-28 z-0 flex flex-col items-center justify-center overflow-hidden"
          >
            <img
              src="/images/logo/techtonic-crest.png"
              alt=""
              className="w-56 sm:w-64 h-auto object-contain opacity-[0.11] -rotate-12 grayscale-[15%]"
            />
            <img
              src="/images/logo/techtonic-script-orange.png"
              alt=""
              className="w-40 sm:w-48 h-auto object-contain opacity-[0.10] -rotate-12 -mt-2 grayscale-[15%]"
            />
          </div>

          {/* Foreground Ruled Grid */}
          <div className="relative z-10">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-400 text-xs sm:text-sm bg-transparent">
                <thead>
                  <tr className="bg-[#0f172a] text-white uppercase tracking-wider text-[11px] font-bold">
                    <th className="py-2.5 px-3 w-16 sm:w-20 text-center border-r border-slate-600">
                      {language === 'km' ? 'ចំនួន' : 'QTY'}
                    </th>
                    <th className="py-2.5 px-4 text-left border-r border-slate-600">
                      {language === 'km' ? 'បរិយាយមុខទំនិញ' : 'DESCRIPTION'}
                    </th>
                    <th className="py-2.5 px-4 w-28 sm:w-32 text-right border-r border-slate-600">
                      {language === 'km' ? 'តម្លៃរាយ' : 'UNIT PRICE'}
                    </th>
                    <th className="py-2.5 px-4 w-28 sm:w-32 text-right">
                      {language === 'km' ? 'សរុប' : 'TOTAL'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const qty = Number(item?.quantity) || 1;
                    const unitPrice = Number(item?.price) || 0;
                    const lineTotal = unitPrice * qty;
                    const itemVariant = item?.variant || item?.selectedVariant;
                    return (
                      <tr key={idx} className="bg-transparent">
                        <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-900 border border-slate-400 align-top">
                          {qty}
                        </td>
                        <td className="py-2.5 px-4 border border-slate-400 align-top">
                          <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                            {item?.name || 'Item'}
                          </div>
                          {itemVariant && (
                            <div className="text-[11px] text-slate-600 mt-0.5">
                              {language === 'km' ? 'ជម្រើស៖' : 'Variant:'} {itemVariant}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-800 border border-slate-400 whitespace-nowrap align-top">
                          {formatUSD(unitPrice)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900 border border-slate-400 whitespace-nowrap align-top">
                          {formatUSD(lineTotal)}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Ruled empty ledger lines so short orders keep full receipt structure */}
                  {Array.from({ length: blankRowCount }).map((_, idx) => (
                    <tr key={`blank-${idx}`} className="h-8 sm:h-9 bg-transparent">
                      <td className="border border-slate-400" />
                      <td className="border border-slate-400" />
                      <td className="border border-slate-400" />
                      <td className="border border-slate-400" />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Remarks Left + Bordered Totals Table Right */}
            <div className="flex flex-col sm:flex-row items-stretch justify-between gap-4 sm:gap-0">
              {/* Left: Payment & Compliance Remarks */}
              <div className="flex-1 pt-3.5 pr-0 sm:pr-4 text-xs text-slate-700 space-y-1">
                <p className="font-bold text-slate-900">
                  {language === 'km' ? 'ការទូទាត់ និងព័ត៌មានបន្ថែម៖' : 'Remarks / Payment Details:'}
                </p>
                <p>
                  {language === 'km' ? 'វិធីសាស្ត្រទូទាត់៖ ' : 'Payment: '}
                  <span className="font-semibold text-slate-900">
                    {order.paymentMethod || 'Bakong KHQR'} ({order.paymentStatus || 'PAID'})
                  </span>
                </p>
                <p>
                  {language === 'km' ? 'ស្ថានភាព៖ ' : 'Status: '}
                  <span className="font-semibold text-slate-900">
                    {translateOrderStatusLabel(formatOrderStatus(order.status || 'Confirmed'), language)}
                  </span>
                  {customerEmail ? ` · ${customerEmail}` : ''}
                </p>
                <p>
                  {language === 'km' ? 'ដឹកជញ្ជូន៖ ' : 'Courier: '}
                  <span className="font-medium text-slate-900">{courierName}</span>
                  {trackingCode ? (
                    <span className="font-mono text-slate-700"> ({trackingCode})</span>
                  ) : null}
                </p>
                <p className="text-[11px] text-slate-500 pt-1">
                  {language === 'km'
                    ? 'រួមបញ្ចូលពន្ធ VAT 10% និងការធានាផ្លូវការ · REF: NBC-KHQR-OK'
                    : 'VAT 10% included · Official manufacturer warranty · REF: NBC-KHQR-OK'}
                </p>
              </div>

              {/* Right: Bordered Totals Box Matching Table Widths */}
              <div className="w-full sm:w-64 shrink-0 border-t border-slate-400 sm:border-t-0">
                <table className="w-full border-collapse text-xs bg-transparent">
                  <tbody>
                    <tr>
                      <td className="py-2 px-3 w-28 sm:w-32 text-right font-semibold text-slate-700 border-x border-b border-slate-400 sm:border-l">
                        {language === 'km' ? 'តម្លៃរាយសរុប' : 'Subtotal'}
                      </td>
                      <td className="py-2 px-4 w-28 sm:w-32 text-right font-mono font-semibold text-slate-900 border-r border-b border-slate-400 whitespace-nowrap">
                        {formatUSD(subtotal)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-right font-semibold text-slate-700 border-x border-b border-slate-400">
                        {language === 'km' ? 'ថ្លៃដឹកជញ្ជូន' : 'Delivery'}
                      </td>
                      <td className="py-2 px-4 text-right font-mono font-semibold text-slate-900 border-r border-b border-slate-400 whitespace-nowrap">
                        {shippingFee === 0 ? (language === 'km' ? 'ឥតគិតថ្លៃ' : 'FREE') : formatUSD(shippingFee)}
                      </td>
                    </tr>
                    {discount > 0 && (
                      <tr>
                        <td className="py-2 px-3 text-right font-semibold text-slate-700 border-x border-b border-slate-400">
                          {language === 'km' ? 'បញ្ចុះតម្លៃ' : 'Discount'}
                        </td>
                        <td className="py-2 px-4 text-right font-mono font-semibold text-slate-900 border-r border-b border-slate-400 whitespace-nowrap">
                          -{formatUSD(discount)}
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 border-x border-b border-slate-400">
                        {language === 'km' ? 'សរុប (USD)' : 'Total ($)'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-sm font-bold text-slate-950 border-r border-b border-slate-400 whitespace-nowrap">
                        {formatUSD(grandTotal)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-right font-semibold text-slate-700 border-x border-b border-slate-400">
                        {language === 'km' ? 'សរុប (KHR)' : 'Total (៛)'}
                      </td>
                      <td className="py-2 px-4 text-right font-mono font-semibold text-slate-900 border-r border-b border-slate-400 whitespace-nowrap">
                        {formatKHR(grandTotal)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Dual Signature Lines */}
            <div className="grid grid-cols-2 gap-6 sm:gap-16 pt-8 sm:pt-12 pb-6 px-2 sm:px-6 text-center text-xs">
              <div>
                <div className="border-t border-slate-700 pt-1.5 font-semibold text-slate-800">
                  {language === 'km' ? 'ហត្ថលេខាអតិថិជន' : "Customer's Sign"}
                </div>
              </div>
              <div>
                <div className="border-t border-slate-700 pt-1.5 font-semibold text-slate-800">
                  {language === 'km' ? 'តំណាងហាង TechTonic Store' : 'For: TechTonic Store'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Dark Store Contact Bar */}
        <div className="bg-[#0f172a] text-white px-4 py-2.5 flex flex-wrap items-center justify-center sm:justify-between gap-x-5 gap-y-1.5 text-[11px] font-medium">
          <span className="inline-flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5 text-slate-300" />
            <span>@techtonic_order_2026_bot</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-slate-300" />
            <span>+855 23 888 999</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-slate-300" />
            <span>support@techtonic.store</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-slate-300" />
            <span>techtonic.store</span>
          </span>
        </div>

        {/* Bottom Tagline */}
        <div className="pt-2.5 text-center text-[11px] font-bold tracking-[0.2em] uppercase text-slate-800">
          {language === 'km' ? 'សូមអរគុណសម្រាប់ការគាំទ្រហាងយើងខ្ញុំ' : 'THANKS FOR YOUR BUSINESS'}
        </div>
      </div>
    </div>
  );
}
