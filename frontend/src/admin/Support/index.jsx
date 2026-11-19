import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Phone,
  Package,
  Send,
  Bell,
  Mail,
  StickyNote,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useLanguage, useToast } from '../../store/StoreContext';

const STATUS_STYLES = {
  open: {
    border: 'border-l-[3px] border-l-rose-500',
    text: 'text-rose-600',
    icon: AlertCircle,
  },
  in_progress: {
    border: 'border-l-[3px] border-l-amber-500',
    text: 'text-amber-700',
    icon: Clock,
  },
  resolved: {
    border: 'border-l-[3px] border-l-emerald-500',
    text: 'text-emerald-700',
    icon: CheckCircle2,
  },
};

const TOPIC_LABELS = {
  order: { km: 'ការកម្ម៉ង់', en: 'Order' },
  warranty: { km: 'ការធានា', en: 'Warranty' },
  product: { km: 'ទំនិញ', en: 'Product' },
  payment: { km: 'ការទូទាត់', en: 'Payment' },
  other: { km: 'ផ្សេងៗ', en: 'Other' },
};

function buildContactAction(rawContact, ticketId) {
  const c = String(rawContact || '').trim();
  if (!c) return { href: null, kind: 'text' };
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c)) {
    const subj = encodeURIComponent(`TechTonic Support (${ticketId})`);
    return { href: `mailto:${c}?subject=${subj}`, kind: 'email' };
  }
  if (/^@[a-zA-Z0-9_]{3,32}$/.test(c)) {
    return { href: `https://t.me/${c.slice(1)}`, kind: 'telegram', external: true };
  }
  const digits = c.replace(/[^\d+]/g, '');
  if (digits.length >= 7) {
    return { href: `tel:${digits}`, kind: 'phone' };
  }
  return { href: null, kind: 'text' };
}

export default function AdminSupport() {
  const { language } = useLanguage();
  const { addToast } = useToast();

  const [tickets, setTickets] = useState([]);
  const [openCount, setOpenCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [tgStatus, setTgStatus] = useState(null);
  const [tgBusy, setTgBusy] = useState(false);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const [data, tg] = await Promise.all([
        adminService.getSupportTickets({
          status: statusFilter === 'all' ? '' : statusFilter,
          limit: 150,
        }),
        adminService.getTelegramStatus().catch(() => null),
      ]);
      setTickets(Array.isArray(data?.items) ? data.items : []);
      setOpenCount(Number(data?.openCount || 0));
      if (tg) setTgStatus(tg);
    } catch (err) {
      addToast(err?.message || 'Unable to load support tickets', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, addToast]);

  const handleConnectTelegram = async () => {
    setTgBusy(true);
    try {
      const status = await adminService.connectTelegramBot();
      setTgStatus(status);
      addToast(
        language === 'km'
          ? 'ភ្ជាប់ Telegram Bot ដោយជោគជ័យ! សូមពិនិត្យសារសាកល្បងក្នុង Telegram របស់អ្នក។'
          : 'Telegram Bot connected! Check Telegram for the welcome alert.',
        'success'
      );
    } catch (err) {
      addToast(
        err?.message ||
          (language === 'km'
            ? 'សូមបើក @techtonic_support_bot ក្នុង Telegram រួចចុច Start ជាមុនសិន'
            : 'Open @techtonic_support_bot in Telegram and tap Start first.'),
        'error'
      );
    } finally {
      setTgBusy(false);
    }
  };

  const handleTestTelegram = async () => {
    setTgBusy(true);
    try {
      await adminService.testTelegramBot();
      addToast(
        language === 'km' ? 'បានផ្ញើសារសាកល្បងទៅ Telegram ហើយ!' : 'Test alert sent to Telegram!',
        'success'
      );
    } catch (err) {
      addToast(err?.message || 'Unable to send test alert', 'error');
    } finally {
      setTgBusy(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const handleStatusChange = async (id, nextStatus) => {
    setUpdatingId(id);
    try {
      await adminService.updateSupportTicket(id, { status: nextStatus });
      addToast(
        language === 'km' ? 'បានធ្វើបច្ចុប្បន្នភាពស្ថានភាពសំណួរ' : 'Support ticket updated',
        'success'
      );
      window.dispatchEvent(new CustomEvent('techtonic:admin-updated'));
      await loadTickets();
    } catch (err) {
      addToast(err?.message || 'Failed to update ticket', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveNote = async (id) => {
    setUpdatingId(id);
    try {
      await adminService.updateSupportTicket(id, { adminNote: noteDraft.trim() });
      addToast(
        language === 'km' ? 'បានរក្សាទុកកំណត់ចំណាំ' : 'Internal note saved',
        'success'
      );
      setEditingNoteId(null);
      setNoteDraft('');
      await loadTickets();
    } catch (err) {
      addToast(err?.message || 'Failed to save note', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = tickets.filter((t) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      String(t.id || '').toLowerCase().includes(q) ||
      String(t.name || '').toLowerCase().includes(q) ||
      String(t.contact || '').toLowerCase().includes(q) ||
      String(t.message || '').toLowerCase().includes(q) ||
      String(t.orderCode || '').toLowerCase().includes(q)
    );
  });

  const formatTime = (iso) => {
    if (!iso) return '-';
    try {
      return new Date(iso).toLocaleString(language === 'km' ? 'km-KH' : 'en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {language === 'km' ? 'ប្រអប់សារជំនួយអតិថិជន' : 'Customer Support Inbox'}
            </h1>
            {openCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 tabular-nums">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                {openCount} {language === 'km' ? 'ថ្មី' : 'open'}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {language === 'km'
              ? 'សំណួរ និងសារជំនួយដែលអតិថិជនផ្ញើមកពី Contact Pop-up នៅលើហាង។'
              : 'Customer inquiries submitted through the storefront support form.'}
          </p>
        </div>

        <button
          type="button"
          onClick={loadTickets}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{language === 'km' ? 'ផ្ទុកឡើងវិញ' : 'Refresh'}</span>
        </button>
      </div>

      {/* Telegram Notification Bar */}
      {tgStatus?.botConfigured && (
        <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-[#229ED9] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#229ED9] text-white flex items-center justify-center shrink-0">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs sm:text-sm font-semibold text-slate-900">
                  {language === 'km' ? 'ការជូនដំណឹងតាម Telegram Bot' : 'Telegram Alerts'}
                </span>
                <span className="text-[11px] font-mono text-sky-700 font-medium">
                  @{tgStatus.botUsername}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded ${
                    tgStatus.connected
                      ? 'bg-emerald-600/10 text-emerald-700'
                      : 'bg-amber-500/15 text-amber-800'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      tgStatus.connected ? 'bg-emerald-600' : 'bg-amber-500'
                    }`}
                  />
                  {tgStatus.connected
                    ? `${language === 'km' ? 'បានភ្ជាប់' : 'Connected'}${
                        tgStatus.chatUsername ? ` (${tgStatus.chatUsername})` : ''
                      }`
                    : language === 'km'
                    ? 'មិនទាន់ភ្ជាប់ Chat'
                    : 'Not linked'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {tgStatus.connected
                  ? language === 'km'
                    ? 'រាល់ពេលមានសារជំនួយពីអតិថិជន ប្រព័ន្ធនឹងផ្ញើចូល Telegram នេះដោយស្វ័យប្រវត្តិ (Order Bot កំណត់នៅទំព័រ Orders)។'
                    : 'New support inquiries are forwarded to Telegram automatically (Order Bot is configured on Orders).'
                  : language === 'km'
                  ? '១) បើក @techtonic_support_bot ក្នុង Telegram រួចចុច Start  ២) ចុចប៊ូតុង "ភ្ជាប់ Telegram" ខាងស្តាំ។'
                  : '1) Open @techtonic_support_bot in Telegram & tap Start, then 2) click "Connect Telegram".'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <a
              href={`https://t.me/${tgStatus.botUsername || 'techtonic_support_bot'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              {language === 'km' ? 'បើក Bot' : 'Open Bot'}
            </a>

            {tgStatus.connected ? (
              <button
                type="button"
                disabled={tgBusy}
                onClick={handleTestTelegram}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2563eb] hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>{language === 'km' ? 'សាកល្បងផ្ញើសារ' : 'Test Alert'}</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={tgBusy}
                onClick={handleConnectTelegram}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2563eb] hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{tgBusy ? '...' : language === 'km' ? 'ភ្ជាប់ Telegram' : 'Connect Telegram'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="inline-flex flex-wrap gap-1 p-1 rounded-lg bg-slate-100 self-start">
          {[
            { id: 'all', km: 'ទាំងអស់', en: 'All' },
            { id: 'open', km: 'រង់ចាំដោះស្រាយ', en: 'Open' },
            { id: 'in_progress', km: 'កំពុងពិនិត្យ', en: 'In Progress' },
            { id: 'resolved', km: 'រួចរាល់', en: 'Resolved' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-[#0f172a] text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              {language === 'km' ? tab.km : tab.en}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={language === 'km' ? 'ស្វែងរកឈ្មោះ លេខទូរស័ព្ទ ឬ សារ...' : 'Search name, contact, message...'}
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-600 text-xs outline-hidden transition-colors"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-xs text-slate-500">
          {language === 'km' ? 'កំពុងទាញយកទិន្នន័យ...' : 'Loading support tickets...'}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">
            {language === 'km' ? 'មិនមានសារជំនួយទេ' : 'No support messages found'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'km'
              ? 'សារថ្មីៗពីអតិថិជននឹងបង្ហាញនៅទីនេះ។'
              : 'New messages from storefront visitors will appear here.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-200/80 overflow-hidden">
          {filtered.map((item) => {
            const topicLabel =
              TOPIC_LABELS[item.topic]?.[language === 'km' ? 'km' : 'en'] || item.topic;
            const st = STATUS_STYLES[item.status] || STATUS_STYLES.open;
            const StatusIcon = st.icon;

            return (
              <div
                key={item.id}
                className={`p-4 sm:px-5 sm:py-4 hover:bg-slate-50/70 transition-colors ${st.border}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-xs font-semibold text-slate-500">{item.id}</span>
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold ${st.text}`}>
                        <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {item.status === 'resolved'
                            ? language === 'km'
                              ? 'រួចរាល់'
                              : 'Resolved'
                            : item.status === 'in_progress'
                            ? language === 'km'
                              ? 'កំពុងពិនិត្យ'
                              : 'In Progress'
                            : language === 'km'
                            ? 'រង់ចាំដោះស្រាយ'
                            : 'Open'}
                        </span>
                      </span>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {topicLabel}
                      </span>
                      {item.orderCode && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-600/[0.08] text-blue-700">
                          <Package className="w-3 h-3 text-blue-600" />
                          {item.orderCode}
                        </span>
                      )}
                    </div>

                    <div className="text-sm font-semibold text-slate-900 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span>{item.name}</span>
                      <span className="text-slate-300">·</span>
                      {(() => {
                        const action = buildContactAction(item.contact, item.id);
                        const ContactIcon =
                          action.kind === 'email'
                            ? Mail
                            : action.kind === 'telegram'
                            ? Send
                            : Phone;
                        return action.href ? (
                          <a
                            href={action.href}
                            target={action.external ? '_blank' : undefined}
                            rel={action.external ? 'noopener noreferrer' : undefined}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                          >
                            <ContactIcon className="w-3 h-3" />
                            <span>{item.contact}</span>
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
                            <Phone className="w-3 h-3" />
                            <span>{item.contact}</span>
                          </span>
                        );
                      })()}
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line pt-0.5">
                      {item.message}
                    </p>

                    {/* Internal Admin Note */}
                    {editingNoteId === item.id ? (
                      <div className="pt-2 flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          value={noteDraft}
                          onChange={(e) => setNoteDraft(e.target.value)}
                          placeholder={language === 'km' ? 'កំណត់ចំណាំផ្ទៃក្នុង...' : 'Internal staff note...'}
                          className="w-full sm:flex-1 sm:min-w-[200px] h-8 px-2.5 rounded-lg bg-white border border-slate-200 focus:border-slate-900 text-xs outline-hidden"
                        />
                        <button
                          type="button"
                          disabled={updatingId === item.id}
                          onClick={() => handleSaveNote(item.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                        >
                          {language === 'km' ? 'រក្សាទុក' : 'Save'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNoteId(null);
                            setNoteDraft('');
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium cursor-pointer"
                        >
                          {language === 'km' ? 'បោះបង់' : 'Cancel'}
                        </button>
                      </div>
                    ) : (
                      <div className="pt-1 flex flex-wrap items-center gap-2 text-xs">
                        {item.adminNote && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/80 text-slate-600">
                            <StickyNote className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{item.adminNote}</span>
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNoteId(item.id);
                            setNoteDraft(item.adminNote || '');
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          <StickyNote className="w-3 h-3" />
                          <span>
                            {item.adminNote
                              ? language === 'km'
                                ? 'កែចំណាំ'
                                : 'Edit note'
                              : language === 'km'
                              ? 'បន្ថែមចំណាំផ្ទៃក្នុង'
                              : 'Add note'}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                    <span className="text-[11px] text-slate-400 tabular-nums">{formatTime(item.createdAt)}</span>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {item.status !== 'in_progress' && item.status !== 'resolved' && (
                        <button
                          type="button"
                          disabled={updatingId === item.id}
                          onClick={() => handleStatusChange(item.id, 'in_progress')}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-amber-50/60 text-amber-700 text-xs font-semibold border border-amber-300 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>{language === 'km' ? 'ទទួលពិនិត្យ' : 'In Progress'}</span>
                        </button>
                      )}

                      {item.status !== 'resolved' ? (
                        <button
                          type="button"
                          disabled={updatingId === item.id}
                          onClick={() => handleStatusChange(item.id, 'resolved')}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{language === 'km' ? 'បានដោះស្រាយ' : 'Resolve'}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={updatingId === item.id}
                          onClick={() => handleStatusChange(item.id, 'open')}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
                          <span>{language === 'km' ? 'បើកឡើងវិញ' : 'Reopen'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

