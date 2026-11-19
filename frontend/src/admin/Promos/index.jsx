import React, { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, Edit2, RefreshCw } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useLanguage, useToast } from '../../store/StoreContext';
import Modal from '../../components/common/Modal';

const INITIAL_FORM = {
  code: '',
  type: 'percentage',
  value: '10',
  minSubtotal: '0',
  expiresAt: '',
  description: '',
  active: true,
};

export default function AdminPromos() {
  const { language } = useLanguage();
  const { addToast } = useToast();

  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  const loadPromos = async () => {
    setLoading(true);
    try {
      const list = await adminService.getPromos();
      setPromos(list);
    } catch (err) {
      addToast(err?.message || 'Failed to load promo codes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPromos();
  }, []);

  const openCreateModal = () => {
    setEditingCode(null);
    setForm(INITIAL_FORM);
    setModalOpen(true);
  };

  const openEditModal = (promo) => {
    setEditingCode(promo.code);
    setForm({
      code: promo.code,
      type: promo.type === 'percentage' ? 'percentage' : 'fixed',
      value: String(promo.value ?? ''),
      minSubtotal: String(promo.minSubtotal ?? 0),
      expiresAt: promo.expiresAt ? String(promo.expiresAt).slice(0, 10) : '',
      description: promo.description || '',
      active: promo.active !== false,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: Number(form.value),
        minSubtotal: Number(form.minSubtotal || 0),
        expiresAt: form.expiresAt ? new Date(`${form.expiresAt}T23:59:59Z`).toISOString() : null,
        description: form.description.trim(),
        active: Boolean(form.active),
      };

      if (editingCode) {
        await adminService.updatePromo(editingCode, payload);
        addToast(
          language === 'km' ? `បានកែប្រែកូដ "${editingCode}" រួចរាល់` : `Promo "${editingCode}" updated`,
          'success'
        );
      } else {
        await adminService.createPromo(payload);
        addToast(
          language === 'km' ? `បានបង្កើតកូដ "${payload.code}" រួចរាល់` : `Promo "${payload.code}" created`,
          'success'
        );
      }
      setModalOpen(false);
      await loadPromos();
    } catch (err) {
      addToast(err?.message || 'Failed to save promo code', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (promo) => {
    try {
      await adminService.updatePromo(promo.code, { active: promo.active === false });
      setPromos((prev) =>
        prev.map((p) => (p.code === promo.code ? { ...p, active: p.active === false } : p))
      );
      addToast(
        language === 'km' ? 'បានប្តូរស្ថានភាពកូដប្រូម៉ូសិន' : 'Promo status updated',
        'success'
      );
    } catch (err) {
      addToast(err?.message || 'Failed to update status', 'error');
    }
  };

  const handleDelete = async (code) => {
    try {
      await adminService.deletePromo(code);
      setPromos((prev) => prev.filter((p) => p.code !== code));
      addToast(
        language === 'km' ? `បានលុបកូដ "${code}"` : `Deleted promo "${code}"`,
        'info'
      );
    } catch (err) {
      addToast(err?.message || 'Failed to delete promo code', 'error');
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {language === 'km' ? 'ការគ្រប់គ្រងលេខកូដប្រូម៉ូសិន' : 'Promo Codes Management'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {language === 'km'
              ? 'បង្កើត កែប្រែ និងកំណត់លក្ខខណ្ឌបញ្ចុះតម្លៃសម្រាប់កន្ត្រកទំនិញ និង Checkout។'
              : 'Create, toggle, and manage discount vouchers verified live during checkout.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadPromos}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'km' ? 'បង្កើតកូដថ្មី' : 'New Promo Code'}</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">{language === 'km' ? 'លេខកូដ' : 'Code'}</th>
                <th className="py-3.5 px-4">{language === 'km' ? 'ប្រភេទបញ្ចុះតម្លៃ' : 'Discount'}</th>
                <th className="py-3.5 px-4">{language === 'km' ? 'ការទិញអប្បបរមា' : 'Min Subtotal'}</th>
                <th className="py-3.5 px-4">{language === 'km' ? 'ផុតកំណត់' : 'Expires'}</th>
                <th className="py-3.5 px-4">{language === 'km' ? 'ស្ថានភាព' : 'Status'}</th>
                <th className="py-3.5 px-4 text-right">{language === 'km' ? 'សកម្មភាព' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {promos.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <Tag className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>{loading ? (language === 'km' ? 'កំពុងទាញទិន្នន័យ...' : 'Loading promos...') : (language === 'km' ? 'មិនទាន់មានកូដប្រូម៉ូសិនទេ' : 'No promo codes yet')}</p>
                  </td>
                </tr>
              ) : (
                promos.map((promo) => {
                  const isActive = promo.active !== false;
                  const isExpired = promo.expiresAt && new Date(promo.expiresAt).getTime() < Date.now();
                  return (
                    <tr key={promo.code} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 font-mono font-bold tracking-wider text-indigo-700 bg-indigo-600/[0.08] border border-dashed border-indigo-400/75 px-2.5 py-1 rounded">
                          <Tag className="w-3 h-3 text-indigo-600 shrink-0" />
                          {promo.code}
                        </span>
                        {promo.description && (
                          <p className="text-[11px] text-slate-400 mt-1">{promo.description}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-blue-600">
                        {promo.type === 'percentage' ? `${promo.value}% OFF` : `$${Number(promo.value || 0).toFixed(2)} OFF`}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 tabular-nums">
                        ${Number(promo.minSubtotal || 0).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {promo.expiresAt ? String(promo.expiresAt).slice(0, 10) : (language === 'km' ? 'គ្មានកំណត់' : 'No expiry')}
                        {isExpired && (
                          <span className="ml-1.5 text-[10px] font-bold text-rose-600">
                            ({language === 'km' ? 'ផុតកំណត់' : 'Expired'})
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(promo)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-emerald-600/10 hover:bg-emerald-600/15 text-emerald-700'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              isActive ? 'bg-emerald-600' : 'bg-slate-400'
                            }`}
                          />
                          <span>{isActive ? (language === 'km' ? 'សកម្ម' : 'Active') : (language === 'km' ? 'បានបិទ' : 'Disabled')}</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEditModal(promo)}
                          className="p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(promo.code)}
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setModalOpen(false)}
          title={
            editingCode
              ? `${language === 'km' ? 'កែប្រែប្រូម៉ូសិន' : 'Edit Promo'}: ${editingCode}`
              : language === 'km'
              ? 'បង្កើតកូដប្រូម៉ូសិនថ្មី'
              : 'Create New Promo Code'
          }
          size="md"
        >
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                {language === 'km' ? 'លេខកូដ *' : 'Promo Code *'}
              </label>
              <input
                type="text"
                value={form.code}
                disabled={Boolean(editingCode)}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                placeholder="TECH15"
                required
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold uppercase disabled:opacity-60"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">
                  {language === 'km' ? 'ប្រភេទ' : 'Discount Type'}
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="percentage">{language === 'km' ? 'ភាគរយ (%)' : 'Percentage (%)'}</option>
                  <option value="fixed">{language === 'km' ? 'ចំនួនទឹកប្រាក់ ($)' : 'Fixed USD ($)'}</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">
                  {language === 'km' ? 'តម្លៃបញ្ចុះ *' : 'Value *'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.value}
                  onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))}
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">
                  {language === 'km' ? 'ទិញយ៉ាងតិច ($)' : 'Min Subtotal ($)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.minSubtotal}
                  onChange={(e) => setForm((p) => ({ ...p, minSubtotal: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">
                  {language === 'km' ? 'ថ្ងៃផុតកំណត់' : 'Expiration Date'}
                </label>
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                {language === 'km' ? 'ការពិពណ៌នា' : 'Description'}
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder={language === 'km' ? 'ឧ. បញ្ចុះតម្លៃ 10% លើការកុម្ម៉ង់លើស $50' : 'e.g. 10% off orders over $50'}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))}
                className="rounded border-slate-300 text-blue-600"
              />
              <span className="font-semibold text-slate-700">
                {language === 'km' ? 'ដាក់ឱ្យដំណើរការភ្លាមៗ' : 'Active immediately'}
              </span>
            </label>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold cursor-pointer"
              >
                {language === 'km' ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer disabled:opacity-50"
              >
                {saving
                  ? language === 'km' ? 'កំពុងរក្សាទុក...' : 'Saving...'
                  : language === 'km' ? 'រក្សាទុក' : 'Save Promo'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
