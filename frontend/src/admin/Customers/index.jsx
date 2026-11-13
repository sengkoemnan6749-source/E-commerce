import React, { useState, useEffect } from 'react';
import { Search, Users } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { formatUSD } from '../../utils/formatPrice';
import { useLanguage, useToast } from '../../store/StoreContext';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { language } = useLanguage();
  const { addToast } = useToast();

  useEffect(() => {
    let active = true;
    setLoading(true);
    adminService.getCustomers()
      .then((list) => {
        if (active) setCustomers(list);
      })
      .catch((err) => {
        if (active) addToast(err?.message || 'Failed to load customers.', 'error');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const translateCustomerStatus = (status) => {
    if (language !== 'km') return status;
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

  const filtered = customers.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const displayName = (c.fullName || c.name || '').toLowerCase();
    return (
      displayName.includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q)
    );
  });

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {language === 'km' ? 'បញ្ជីឈ្មោះអតិថិជន' : 'Customers Directory'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {language === 'km'
              ? 'គ្រប់គ្រងអ្នកអភិវឌ្ឍន៍ អ្នកបង្កើតមាតិកា គណនីក្រុមហ៊ុន និងសមាជិក VIP ដែលបានចុះឈ្មោះ។'
              : 'Manage registered developers, creators, corporate accounts, and VIP members.'}
          </p>
        </div>
      </div>

      {/* Unified Customers Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
            <Users className="w-4 h-4 text-slate-400" />
            <span>
              {language === 'km' ? `អតិថិជនសរុប ${filtered.length} នាក់` : `${filtered.length} customers`}
            </span>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={
                language === 'km'
                  ? 'ស្វែងរកអតិថិជនតាមឈ្មោះ អ៊ីមែល ឬទូរស័ព្ទ...'
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
                <th className="py-3 px-4">{language === 'km' ? 'ឈ្មោះអតិថិជន' : 'Customer Name'}</th>
                <th className="py-3 px-4">{language === 'km' ? 'អ៊ីមែល' : 'Email'}</th>
                <th className="py-3 px-4">{language === 'km' ? 'លេខទូរស័ព្ទ' : 'Phone'}</th>
                <th className="py-3 px-4 text-center">{language === 'km' ? 'ចំនួនកុម្ម៉ង់' : 'Orders'}</th>
                <th className="py-3 px-4">{language === 'km' ? 'ចំណាយសរុប' : 'Total Spent'}</th>
                <th className="py-3 px-4">{language === 'km' ? 'ស្ថានភាព' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    {language === 'km' ? 'កំពុងផ្ទុកបញ្ជីអតិថិជន...' : 'Loading customers from database...'}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium text-slate-700">
                      {language === 'km' ? 'រកមិនឃើញអតិថិជនឡើយ' : 'No customers found'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="mt-2 text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                    >
                      {language === 'km' ? 'សម្អាតតម្រង' : 'Clear search'}
                    </button>
                  </td>
                </tr>
              ) : (
                filtered.map((cust) => {
                  const custName = cust.fullName || cust.name || cust.email || 'Customer';
                  const custStatus = cust.status || 'Active';
                  return (
                  <tr key={cust.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200/80 text-slate-700 flex items-center justify-center font-semibold text-xs flex-shrink-0">
                          {custName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-900">{custName}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-mono whitespace-nowrap">{cust.email || '—'}</td>

                    <td className="py-3.5 px-4 text-slate-600 tabular-nums whitespace-nowrap">{cust.phone || '—'}</td>

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
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
