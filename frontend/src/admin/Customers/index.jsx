import React, { useState, useEffect } from 'react';
import { Search, Users, ShieldCheck, ShieldOff, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { formatUSD } from '../../utils/formatPrice';
import { useAuth, useLanguage } from '../../store/StoreContext';
import Modal from '../../components/common/Modal';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const { user } = useAuth();
  const { language } = useLanguage();
  const isKm = language === 'km';
  const currentUserId = user?.id || user?.uid || null;

  const loadUsers = async () => {
    setLoading(true);
    try {
      const list = await adminService.getCustomers();
      setCustomers(list);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err?.message || (isKm ? 'មិនអាចទាញបញ្ជីអ្នកប្រើប្រាស់បានទេ។' : 'Failed to load users.'),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const translateCustomerStatus = (status) => {
    if (!isKm) return status;
    if (status === 'VIP Member') return 'សមាជិក VIP';
    if (status === 'Premier') return 'សមាជិក Premier';
    if (status === 'Active') return 'សកម្ម';
    return status;
  };

  const getStatusDotClass = (status) => {
    if (status === 'VIP Member') return 'bg-blue-600';
    if (status === 'Premier') return 'bg-emerald-500';
    return 'bg-slate-400';
  };

  const getStatusTextClass = (status) => {
    if (status === 'VIP Member') return 'text-blue-700';
    if (status === 'Premier') return 'text-emerald-700';
    return 'text-slate-600';
  };

  const adminCount = customers.filter((c) => c.role === 'admin').length;
  const customerCount = customers.length - adminCount;

  const filtered = customers.filter((c) => {
    const normalizedRole = c.role === 'admin' ? 'admin' : 'customer';
    if (roleFilter !== 'all' && normalizedRole !== roleFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const displayName = (c.fullName || c.name || '').toLowerCase();
    return (
      displayName.includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q)
    );
  });

  const handleConfirmRoleChange = async () => {
    if (!confirmTarget) return;
    const { user: targetUser, nextRole } = confirmTarget;
    setUpdatingRole(true);
    setFeedback(null);
    try {
      const updated = await adminService.updateCustomerRole(targetUser.id, nextRole);
      setCustomers((prev) =>
        prev.map((item) =>
          item.id === targetUser.id
            ? { ...item, role: updated?.role || nextRole }
            : item
        )
      );
      const displayName = targetUser.fullName || targetUser.name || targetUser.email || targetUser.id;
      setFeedback({
        type: 'success',
        message:
          nextRole === 'admin'
            ? isKm
              ? `បានដំឡើង "${displayName}" ជា Admin រួចរាល់! សូមឱ្យគាត់ Sign out រួចចូលតាម /admin/login។`
              : `Promoted "${displayName}" to Admin. Ask them to sign out and log in at /admin/login.`
            : isKm
            ? `បានដកសិទ្ធិ Admin ពី "${displayName}" រួចរាល់។`
            : `Removed Admin access from "${displayName}".`,
      });
      setConfirmTarget(null);
    } catch (err) {
      setFeedback({
        type: 'error',
        message:
          err?.message ||
          (isKm ? 'មិនអាចផ្លាស់ប្តូរសិទ្ធិបានទេ។' : 'Failed to update user role.'),
      });
      setConfirmTarget(null);
    } finally {
      setUpdatingRole(false);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {isKm ? 'បញ្ជីអ្នកប្រើប្រាស់ និងសិទ្ធិ Admin' : 'Users & Admin Roles'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isKm
              ? 'គ្រប់គ្រងអតិថិជន និងផ្តល់ ឬដកសិទ្ធិ Admin ឱ្យមិត្តភក្តិ/ក្រុមការងាររបស់អ្នកដោយផ្ទាល់។'
              : 'Manage registered accounts and assign or revoke Admin permissions for your team.'}
          </p>
        </div>
      </div>

      {/* Inline Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border text-xs sm:text-sm flex items-start justify-between gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            )}
            <span className="font-medium leading-relaxed">{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-0.5 opacity-60 hover:opacity-100 cursor-pointer shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Unified Directory Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Role Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { key: 'all', label: isKm ? `ទាំងអស់ (${customers.length})` : `All (${customers.length})` },
              { key: 'admin', label: isKm ? `អ្នកគ្រប់គ្រង Admin (${adminCount})` : `Admins (${adminCount})` },
              { key: 'customer', label: isKm ? `អតិថិជន (${customerCount})` : `Customers (${customerCount})` },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setRoleFilter(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  roleFilter === tab.key
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={
                isKm
                  ? 'ស្វែងរកតាមឈ្មោះ អ៊ីមែល ឬទូរស័ព្ទ...'
                  : 'Search by name, email, or phone...'
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200/90 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/70 text-slate-500 font-semibold">
                <th className="py-3 px-4">{isKm ? 'ឈ្មោះគណនី' : 'Account'}</th>
                <th className="py-3 px-4">{isKm ? 'អ៊ីមែល' : 'Email'}</th>
                <th className="py-3 px-4">{isKm ? 'តួនាទី (Role)' : 'Role'}</th>
                <th className="py-3 px-4 text-center">{isKm ? 'កុម្ម៉ង់' : 'Orders'}</th>
                <th className="py-3 px-4">{isKm ? 'ចំណាយសរុប' : 'Total Spent'}</th>
                <th className="py-3 px-4">{isKm ? 'ស្ថានភាព' : 'Status'}</th>
                <th className="py-3 px-4 text-right">{isKm ? 'កំណត់សិទ្ធិ' : 'Permissions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    {isKm ? 'កំពុងផ្ទុកបញ្ជីអ្នកប្រើប្រាស់...' : 'Loading accounts from database...'}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium text-slate-700">
                      {isKm ? 'រកមិនឃើញគណនីឡើយ' : 'No accounts found'}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearch('');
                        setRoleFilter('all');
                      }}
                      className="mt-2 text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                    >
                      {isKm ? 'សម្អាតតម្រង' : 'Clear filters'}
                    </button>
                  </td>
                </tr>
              ) : (
                filtered.map((cust) => {
                  const custName = cust.fullName || cust.name || cust.email || 'Customer';
                  const custStatus = cust.status || 'Active';
                  const isTargetAdmin = cust.role === 'admin';
                  const isSelf = currentUserId && cust.id === currentUserId;
                  const isPrimary = Boolean(cust.isPrimaryAdmin);

                  return (
                    <tr key={cust.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs flex-shrink-0 border ${
                              isTargetAdmin
                                ? 'bg-slate-900 text-white border-slate-800'
                                : 'bg-slate-100 text-slate-700 border-slate-200/80'
                            }`}
                          >
                            {custName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{custName}</div>
                            {cust.phone && (
                              <div className="text-[11px] text-slate-400 tabular-nums">{cust.phone}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 font-mono whitespace-nowrap">
                        {cust.email || '—'}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isTargetAdmin ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-900 text-white">
                            <ShieldCheck className="w-3 h-3 text-sky-400" />
                            <span>{isPrimary ? (isKm ? 'Admin គោល' : 'Primary Admin') : 'Admin'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            {isKm ? 'អតិថិជន' : 'Customer'}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center tabular-nums font-semibold text-slate-700">
                        {cust.ordersCount || 0}
                      </td>

                      <td className="py-3.5 px-4 tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                        {formatUSD(cust.totalSpent || 0)}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${getStatusTextClass(custStatus)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotClass(custStatus)}`} />
                          {translateCustomerStatus(custStatus)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {isSelf ? (
                          <span className="text-[11px] font-semibold text-slate-400">
                            {isKm ? 'គណនីអ្នក' : 'Your account'}
                          </span>
                        ) : isPrimary ? (
                          <span className="text-[11px] font-semibold text-slate-400">
                            {isKm ? 'ការពារ' : 'Protected'}
                          </span>
                        ) : isTargetAdmin ? (
                          <button
                            type="button"
                            onClick={() => setConfirmTarget({ user: cust, nextRole: 'customer' })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold transition cursor-pointer"
                          >
                            <ShieldOff className="w-3.5 h-3.5" />
                            <span>{isKm ? 'ដកសិទ្ធិ Admin' : 'Remove Admin'}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmTarget({ user: cust, nextRole: 'admin' })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold transition cursor-pointer"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                            <span>{isKm ? 'តែងតាំងជា Admin' : 'Make Admin'}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Confirmation Modal */}
      <Modal
        isOpen={Boolean(confirmTarget)}
        onClose={() => !updatingRole && setConfirmTarget(null)}
        title={
          confirmTarget?.nextRole === 'admin'
            ? isKm ? 'បញ្ជាក់ការផ្តល់សិទ្ធិ Admin' : 'Assign Admin Role'
            : isKm ? 'បញ្ជាក់ការដកសិទ្ធិ Admin' : 'Remove Admin Role'
        }
        size="sm"
      >
        {confirmTarget && (
          <div className="space-y-4 text-xs sm:text-sm text-slate-600">
            <p className="leading-relaxed">
              {confirmTarget.nextRole === 'admin'
                ? isKm
                  ? `តើអ្នកពិតជាចង់ដំឡើង "${confirmTarget.user.fullName || confirmTarget.user.name || confirmTarget.user.email}" ជាអ្នកគ្រប់គ្រងហាង (Admin) មែនទេ? គាត់នឹងអាចគ្រប់គ្រងទំនិញ ការកុម្ម៉ង់ និងថ្លៃដឹកជញ្ជូនបាន។`
                  : `Promote "${confirmTarget.user.fullName || confirmTarget.user.name || confirmTarget.user.email}" to Store Admin? They will gain access to products, orders, customers, and shipping settings.`
                : isKm
                ? `តើអ្នកពិតជាចង់ដកសិទ្ធិ Admin ពី "${confirmTarget.user.fullName || confirmTarget.user.name || confirmTarget.user.email}" ត្រឡប់ទៅជាអតិថិជនធម្មតាមែនទេ?`
                : `Demote "${confirmTarget.user.fullName || confirmTarget.user.name || confirmTarget.user.email}" back to regular Customer? They will immediately lose Admin Console access.`}
            </p>

            {confirmTarget.nextRole === 'admin' && (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 leading-relaxed">
                {isKm
                  ? 'ចំណាំ៖ ក្រោយពីផ្តល់សិទ្ធិរួច មិត្តភក្តិរបស់អ្នកត្រូវ Sign out រួចចូលតាម /admin/login (ឬ /TechTonicAdmin/login)។'
                  : 'Note: Once promoted, your friend should sign out and log in via /admin/login (or /TechTonicAdmin/login).'}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={updatingRole}
                onClick={() => setConfirmTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer disabled:opacity-50"
              >
                {isKm ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={updatingRole}
                onClick={handleConfirmRoleChange}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white cursor-pointer disabled:opacity-60 ${
                  confirmTarget.nextRole === 'admin'
                    ? 'bg-slate-900 hover:bg-slate-800'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {updatingRole
                  ? isKm ? 'កំពុងកែប្រែ...' : 'Updating...'
                  : confirmTarget.nextRole === 'admin'
                  ? isKm ? 'យល់ព្រម តែងតាំង Admin' : 'Confirm Make Admin'
                  : isKm ? 'យល់ព្រម ដកសិទ្ធិ' : 'Confirm Remove Admin'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
