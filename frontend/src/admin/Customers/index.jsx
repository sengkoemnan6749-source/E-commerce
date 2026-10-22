import React, { useState } from 'react';
import { Search, Users, Mail, Phone, ShoppingBag, ShieldCheck } from 'lucide-react';
import { INITIAL_CUSTOMERS } from '../../services/mockData';
import { formatUSD } from '../../utils/formatPrice';
import Badge from '../../components/common/Badge';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);
  const [search, setSearch] = useState('');

  const filtered = customers.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Customers Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage registered developers, creators, corporate accounts, and VIP members.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customer by name, email, or phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
          />
        </div>
        <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
          {filtered.length} customers
        </span>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4 text-center">Orders</th>
                <th className="py-3 px-4">Total Spent</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((cust) => (
                <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {cust.name.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-900">{cust.name}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-slate-600 font-mono">{cust.email}</td>

                  <td className="py-3.5 px-4 text-slate-600">{cust.phone}</td>

                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">
                    {cust.ordersCount}
                  </td>

                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {formatUSD(cust.totalSpent)}
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge
                      variant={
                        cust.status === 'VIP Member'
                          ? 'primary'
                          : cust.status === 'Premier'
                          ? 'success'
                          : 'neutral'
                      }
                      size="sm"
                    >
                      {cust.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
