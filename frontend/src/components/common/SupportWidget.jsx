import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Headphones,
  X,
  Send,
  Package,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth, useLanguage } from '../../store/StoreContext';

function isStoreHoursOpen() {
  try {
    const now = new Date();
    const phnomPenhHour = Number(
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Phnom_Penh',
        hour: 'numeric',
        hour12: false,
      }).format(now)
    );
    return phnomPenhHour >= 8 && phnomPenhHour < 21;
  } catch {
    const h = new Date().getHours();
    return h >= 8 && h < 21;
  }
}

export default function SupportWidget() {
  const { user, isAuthenticated } = useAuth();
  const { language } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const [topic, setTopic] = useState('order');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [orderCode, setOrderCode] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedTicket, setSubmittedTicket] = useState(null);

  const storeOpen = isStoreHoursOpen();

  // Smart auto-fill for authenticated users
  useEffect(() => {
    if (isAuthenticated && user) {
      setName((prev) => prev || user.fullName || user.name || '');
      setContact((prev) => prev || user.email || '');
    }
  }, [isAuthenticated, user]);

  // Listen for "Contact Support" button clicks elsewhere in the storefront
  useEffect(() => {
    const openHandler = () => setIsOpen(true);
    window.addEventListener('techtonic:open-support', openHandler);
    return () => window.removeEventListener('techtonic:open-support', openHandler);
  }, []);

  const topics = [
    { value: 'order', km: 'ការកម្ម៉ង់ & ដឹកជញ្ជូន', en: 'Order & Delivery' },
    { value: 'warranty', km: 'ការធានា (Warranty)', en: 'Warranty Claim' },
    { value: 'product', km: 'សួរព័ត៌មានទំនិញ', en: 'Product Advice' },
    { value: 'payment', km: 'ការទូទាត់ KHQR', en: 'Payment / KHQR' },
    { value: 'other', km: 'ផ្សេងៗ', en: 'Other' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (name.trim().length < 2) {
      setError(language === 'km' ? 'សូមបញ្ចូលឈ្មោះរបស់អ្នក' : 'Please enter your name.');
      return;
    }
    if (contact.trim().length < 3) {
      setError(
        language === 'km'
          ? 'សូមបញ្ចូល Telegram (@username) ឬ អ៊ីមែល'
          : 'Please enter your Telegram (@username) or email.'
      );
      return;
    }
    if (message.trim().length < 5) {
      setError(language === 'km' ? 'សូមសរសេរសំណួររបស់អ្នកឱ្យបានច្បាស់' : 'Please write a short message.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/support/tickets', {
        name: name.trim(),
        contact: contact.trim(),
        topic,
        orderCode: topic === 'order' ? orderCode.trim() : '',
        message: message.trim(),
      });
      setSubmittedTicket(res?.data || { id: 'TT-SUP' });
      setMessage('');
      setOrderCode('');
    } catch (err) {
      setError(
        err?.message ||
          (language === 'km'
            ? 'មិនអាចផ្ញើសារបានទេ សូមសាកល្បងម្តងទៀត ឬទាក់ទងតាម Telegram។'
            : 'Unable to send message right now. Please try Telegram.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40">
      {/* Support Pop-up Card */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Customer Support"
          className="mb-3 w-[340px] sm:w-[376px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl border border-slate-200/90 shadow-2xl shadow-slate-900/15 overflow-hidden animate-fadeIn"
        >
          {/* Header */}
          <div className="px-4 py-3.5 bg-slate-900 text-white flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                <Headphones className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold leading-tight truncate">
                  {language === 'km' ? 'មជ្ឈមណ្ឌលជំនួយ TechTonic' : 'TechTonic Support'}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-300 mt-0.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      storeOpen ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  />
                  <span className="truncate">
                    {storeOpen
                      ? language === 'km'
                        ? 'កំពុងបម្រើការ · 8AM – 9PM'
                        : 'Online now · 8AM – 9PM'
                      : language === 'km'
                      ? 'ក្រៅម៉ោង · ផ្ញើសារទុកបាន'
                      : 'After hours · Leave a message'}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close support popup"
              className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Instant Shortcuts */}
          <div className="p-3 bg-slate-50 border-b border-slate-100 grid grid-cols-2 gap-2">
            <a
              href="https://t.me/techtonic_kh"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-xl bg-white hover:bg-sky-50 border border-slate-200/80 hover:border-sky-300 text-slate-700 hover:text-sky-700 transition-colors"
            >
              <Send className="w-3.5 h-3.5 text-sky-600" />
              <span className="text-[11px] font-bold">Telegram</span>
            </a>

            <Link
              to="/track"
              onClick={() => setIsOpen(false)}
              className="flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-xl bg-white hover:bg-blue-50 border border-slate-200/80 hover:border-blue-300 text-slate-700 hover:text-blue-700 transition-colors"
            >
              <Package className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-[11px] font-bold">
                {language === 'km' ? 'តាមដានកម្ម៉ង់' : 'Track Order'}
              </span>
            </Link>
          </div>

          {/* Message Body */}
          <div className="p-4">
            {submittedTicket ? (
              <div className="py-4 text-center space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {language === 'km' ? 'បានទទួលសំណួររបស់អ្នកហើយ' : 'Message received'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {language === 'km'
                      ? 'ក្រុមការងារ TechTonic នឹងទាក់ទងទៅវិញក្នុងពេលឆាប់ៗ។'
                      : 'Our Phnom Penh team will respond shortly.'}
                  </p>
                  {submittedTicket.id && (
                    <div className="mt-2 inline-block px-2.5 py-1 rounded-lg bg-slate-100 text-[11px] font-mono font-bold text-slate-700">
                      {submittedTicket.id}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSubmittedTicket(null)}
                  className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  {language === 'km' ? 'ផ្ញើសំណួរផ្សេងទៀត' : 'Send another message'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-2.5">
                {error && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-medium flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      {language === 'km' ? 'ឈ្មោះ *' : 'Name *'}
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={language === 'km' ? 'ឈ្មោះអ្នក' : 'Your name'}
                      className="w-full h-9 px-2.5 rounded-lg bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-600 text-xs text-slate-900 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      {language === 'km' ? 'Telegram / អ៊ីមែល *' : 'Telegram / Email *'}
                    </label>
                    <input
                      type="text"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="@username / you@gmail.com"
                      className="w-full h-9 px-2.5 rounded-lg bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-600 text-xs text-slate-900 outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {language === 'km' ? 'ប្រធានបទ' : 'Topic'}
                  </label>
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-600 text-xs text-slate-900 outline-hidden"
                  >
                    {topics.map((item) => (
                      <option key={item.value} value={item.value}>
                        {language === 'km' ? item.km : item.en}
                      </option>
                    ))}
                  </select>
                </div>

                {topic === 'order' && (
                  <div>
                    <input
                      type="text"
                      value={orderCode}
                      onChange={(e) => setOrderCode(e.target.value)}
                      placeholder={language === 'km' ? 'លេខកូដកម្ម៉ង់ (ស្រេចចិត្ត) ឧ. TT-1001' : 'Order ID (optional) e.g. TT-1001'}
                      className="w-full h-9 px-2.5 rounded-lg bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-600 text-xs text-slate-900 outline-hidden"
                    />
                  </div>
                )}

                <div>
                  <textarea
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      language === 'km'
                        ? 'សរសេរសំណួរ ឬ បញ្ហារបស់អ្នកនៅទីនេះ...'
                        : 'How can we help you today?'
                    }
                    className="w-full p-2.5 rounded-lg bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-600 text-xs text-slate-900 outline-hidden resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-9 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>
                    {submitting
                      ? language === 'km'
                        ? 'កំពុងផ្ញើ...'
                        : 'Sending...'
                      : language === 'km'
                      ? 'ផ្ញើទៅផ្នែកជំនួយ'
                      : 'Send Message'}
                  </span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={language === 'km' ? 'ទាក់ទងផ្នែកជំនួយ' : 'Contact support'}
        className="ml-auto flex items-center gap-2 h-11 px-4 rounded-full bg-slate-900 hover:bg-blue-600 text-white border border-slate-700/80 shadow-lg shadow-slate-900/20 transition-all cursor-pointer active:scale-95"
      >
        {isOpen ? (
          <X className="w-4 h-4 shrink-0" />
        ) : (
          <Headphones className="w-4 h-4 shrink-0 text-blue-400 group-hover:text-white" />
        )}
        <span className="text-xs font-bold">
          {isOpen
            ? language === 'km'
              ? 'បិទ'
              : 'Close'
            : language === 'km'
            ? 'ជំនួយ'
            : 'Support'}
        </span>
      </button>
    </div>
  );
}

