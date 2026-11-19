import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Info,
  Search,
  RefreshCw,
  Download,
  Lock,
  Activity,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useLanguage } from '../../store/StoreContext';

const EVENT_TYPES = [
  'all',
  'ADMIN_VAULT_CONFIGURED',
  'ADMIN_VAULT_UNLOCKED',
  'ADMIN_VAULT_LOCKED',
  'ADMIN_VAULT_FAILED',
  'ADMIN_VAULT_LOCKOUT',
  'ADMIN_DEVICE_MISMATCH',
  'ADMIN_VAULT_REJECTED',
  'PASSWORD_CHANGED',
  'PASSWORD_SET',
  'PASSWORD_RESET_REQUESTED',
  'USER_2FA_ENABLED',
  'USER_2FA_DISABLED',
  'USER_2FA_VERIFIED',
  'USER_2FA_FAILED',
  'USER_2FA_LOCKOUT',
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'REGISTER_SUCCESS',
  'REGISTER_FAILED',
  'BRUTE_FORCE_LOCKOUT',
  'SUSPICIOUS_PAYLOAD_BLOCKED',
  'RATE_LIMIT_EXCEEDED',
  'UNAUTHORIZED_ADMIN_ACCESS',
  'AUTH_TOKEN_REJECTED',
  'ACCOUNT_CREATED',
  'ADDRESS_CREATED',
  'ADDRESS_DELETED',
  'ORDER_CREATED',
  'SUPPORT_TICKET_CREATED',
  'SUPPORT_TICKET_UPDATED',
  'TELEGRAM_BOT_CONNECTED',
  'PAYMENT_KHQR_INITIATED',
  'PAYMENT_CARD_PROCESSED',
  'ADMIN_PRODUCT_CREATED',
  'ADMIN_PRODUCT_UPDATED',
  'ADMIN_PRODUCT_DELETED',
  'ADMIN_CATEGORY_CREATED',
  'ADMIN_CATEGORY_UPDATED',
  'ADMIN_CATEGORY_DELETED',
  'ADMIN_ORDER_STATUS_UPDATED',
];

function SeverityBadge({ severity, language }) {
  if (severity === 'critical') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700">
        <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
        {language === 'km' ? 'គ្រោះថ្នាក់ខ្ពស់' : 'Critical'}
      </span>
    );
  }
  if (severity === 'warning') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        {language === 'km' ? 'ការព្រមាន' : 'Warning'}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700">
      <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
      {language === 'km' ? 'ព័ត៌មាន' : 'Info'}
    </span>
  );
}

function StatusBadge({ status }) {
  const normalized = String(status || 'LOGGED').toUpperCase();
  if (normalized.includes('BLOCK')) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-bold bg-rose-600 text-white tracking-wider">
        {normalized}
      </span>
    );
  }
  if (normalized === 'FAILED') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-bold bg-amber-500/15 text-amber-800 tracking-wider">
        {normalized}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-bold bg-emerald-600/10 text-emerald-700 tracking-wider">
      {normalized}
    </span>
  );
}

export default function AdminAuditLogs() {
  const { language } = useLanguage();
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    criticalCount: 0,
    warningCount: 0,
    blockedCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [severity, setSeverity] = useState('all');
  const [eventType, setEventType] = useState('all');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getAuditLogs({
        severity,
        eventType,
        search,
        limit: 200,
      });
      setLogs(res.logs);
      setSummary(res.summary);
    } catch (err) {
      setError(err?.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [severity, eventType, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 180);
    return () => clearTimeout(timer);
  }, [fetchLogs]);

  const handleExportCsv = () => {
    if (!logs.length) return;
    const headers = [
      'ID',
      'Timestamp',
      'Severity',
      'EventType',
      'Status',
      'ActorEmail',
      'ActorRole',
      'IP',
      'Method',
      'Path',
      'TargetType',
      'TargetId',
      'Details',
    ];
    const escapeCell = (v) => {
      const raw = String(v ?? '').replace(/\r?\n/g, ' ');
      const formulaSafe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
      return `"${formulaSafe.replace(/"/g, '""')}"`;
    };
    const rows = logs.map((l) =>
      [
        l.id,
        l.createdAt,
        l.severity,
        l.eventType,
        l.status,
        l.actorEmail || '',
        l.actorRole || '',
        l.ip || '',
        l.method || '',
        l.path || '',
        l.targetType || '',
        l.targetId || '',
        l.details || '',
      ]
        .map(escapeCell)
        .join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `techtonic-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
            <span>
              {language === 'km'
                ? 'ប្រព័ន្ធសុវត្ថិភាព និង កំណត់ត្រា Audit Log'
                : 'Security & Audit Logs'}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {language === 'km'
              ? 'តាមដានរាល់សកម្មភាពចូលគណនី ការទប់ស្កាត់ការវាយប្រហារ Brute-Force និងប្រតិបត្តិការអ្នកគ្រប់គ្រងជាក់ស្តែង។'
              : 'Monitor real-time authentication telemetry, blocked threats, rate-limit events, and admin actions.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={!logs.length}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{language === 'km' ? 'ទាញយក CSV' : 'Export CSV'}</span>
          </button>
          <button
            type="button"
            onClick={fetchLogs}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#2563eb] hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-60 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{language === 'km' ? 'ផ្ទុកឡើងវិញ' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-xl border border-slate-200 border-t-2 border-t-blue-600 p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>{language === 'km' ? 'កំណត់ត្រាសរុប' : 'Total Events'}</span>
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{summary.total}</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 border-t-2 border-t-rose-600 p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-rose-700">
            <span>{language === 'km' ? 'ការជូនដំណឹងគ្រោះថ្នាក់' : 'Critical Alerts'}</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-600 tabular-nums">{summary.criticalCount}</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 border-t-2 border-t-amber-500 p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-700">
            <span>{language === 'km' ? 'បរាជ័យ / ការព្រមាន' : 'Warnings & Failures'}</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 tabular-nums">{summary.warningCount}</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 border-t-2 border-t-emerald-600 p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-700">
            <span>{language === 'km' ? 'ការគំរាមដែលបានទប់ស្កាត់' : 'Threats Blocked'}</span>
            <Lock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 tabular-nums">{summary.blockedCount}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col md:flex-row gap-2.5">
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              language === 'km'
                ? 'ស្វែងរកតាម អ៊ីមែល IP ព្រឹត្តិការណ៍ ឬ ព័ត៌មានលម្អិត...'
                : 'Search by email, IP address, event type, path, or details...'
            }
            className="w-full h-9 pl-9 pr-3.5 rounded-lg border border-slate-200 bg-white focus:border-slate-900 text-xs outline-hidden transition-colors"
          />
        </div>

        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          className="h-9 px-3 rounded-lg border border-slate-200 bg-white focus:border-slate-900 text-xs font-medium text-slate-700 outline-hidden cursor-pointer w-full md:w-44 shrink-0"
        >
          <option value="all">{language === 'km' ? 'កម្រិតទាំងអស់' : 'All Severities'}</option>
          <option value="critical">{language === 'km' ? 'គ្រោះថ្នាក់ខ្ពស់ (Critical)' : 'Critical Only'}</option>
          <option value="warning">{language === 'km' ? 'ការព្រមាន (Warning)' : 'Warnings Only'}</option>
          <option value="info">{language === 'km' ? 'ព័ត៌មាន (Info)' : 'Info Only'}</option>
        </select>

        <select
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          className="h-9 px-3 rounded-lg border border-slate-200 bg-white focus:border-slate-900 text-xs font-medium text-slate-700 outline-hidden cursor-pointer w-full md:w-52 shrink-0"
        >
          {EVENT_TYPES.map((ev) => (
            <option key={ev} value={ev}>
              {ev === 'all'
                ? language === 'km'
                  ? 'ប្រភេទព្រឹត្តិការណ៍ទាំងអស់'
                  : 'All Event Types'
                : ev}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-white border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">{language === 'km' ? 'ពេលវេលា' : 'Timestamp'}</th>
                <th className="py-3.5 px-4">{language === 'km' ? 'កម្រិត' : 'Severity'}</th>
                <th className="py-3.5 px-4">{language === 'km' ? 'ព្រឹត្តិការណ៍' : 'Event & Status'}</th>
                <th className="py-3.5 px-4">{language === 'km' ? 'អ្នកប្រើប្រាស់' : 'Actor'}</th>
                <th className="py-3.5 px-4">{language === 'km' ? 'IP & ផ្លូវ' : 'IP & Endpoint'}</th>
                <th className="py-3.5 px-4">{language === 'km' ? 'ព័ត៌មានលម្អិត' : 'Details'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    {language === 'km' ? 'កំពុងផ្ទុកកំណត់ត្រាសុវត្ថិភាព...' : 'Loading security audit logs...'}
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    {language === 'km'
                      ? 'មិនមានកំណត់ត្រាត្រូវតាមលក្ខខណ្ឌស្វែងរកទេ។'
                      : 'No audit events match your current filters.'}
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors align-top">
                    <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-600 font-mono">
                      <div>{log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}</div>
                      <div className="text-[10px] text-slate-400">{log.id}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <SeverityBadge severity={log.severity} language={language} />
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-mono text-xs font-bold text-slate-800">{log.eventType}</div>
                      <div className="mt-1">
                        <StatusBadge status={log.status} />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 text-xs">
                        {log.actorEmail || log.actorUid || (language === 'km' ? 'ភ្ញៀវ (Guest)' : 'Guest / Unauthenticated')}
                      </div>
                      <div className="text-[11px] text-slate-400 capitalize">{log.actorRole || 'guest'}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      <div className="font-semibold text-slate-800">{log.ip || 'unknown'}</div>
                      {log.path && (
                        <div className="text-slate-400 truncate max-w-[200px]" title={`${log.method || ''} ${log.path}`}>
                          {log.method ? `${log.method} ` : ''}{log.path}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 max-w-md">
                      <div>{log.details || '—'}</div>
                      {log.targetId && (
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {log.targetType}: {log.targetId}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

