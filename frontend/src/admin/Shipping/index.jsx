import React, { useState, useEffect } from 'react';
import { Truck, Save, RotateCcw, Sparkles, CheckCircle2, Globe } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { DEFAULT_SHIPPING_CONFIG, normalizeShippingConfig } from '../../services/shippingService';
import { useLanguage, useToast } from '../../store/StoreContext';

export default function AdminShipping() {
  const { language } = useLanguage();
  const { addToast } = useToast();
  const isKm = language === 'km';

  const [config, setConfig] = useState(() => normalizeShippingConfig(DEFAULT_SHIPPING_CONFIG));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadRates = async () => {
    setLoading(true);
    try {
      const data = await adminService.getShippingRates();
      setConfig(normalizeShippingConfig(data));
    } catch (err) {
      addToast(
        err?.message || (isKm ? 'មិនអាចទាញយកតម្លៃដឹកជញ្ជូនបានទេ' : 'Failed to load shipping rates'),
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRates();
  }, []);

  const handlePartnerChange = (partnerId, field, value) => {
    setConfig((prev) => ({
      ...prev,
      partners: prev.partners.map((p) => {
        if (p.id !== partnerId) return p;
        return { ...p, [field]: value };
      }),
    }));
  };

  const handleTogglePartner = (partnerId) => {
    setConfig((prev) => {
      const target = prev.partners.find((p) => p.id === partnerId);
      if (target?.enabled !== false && prev.partners.filter((p) => p.enabled !== false).length <= 1) {
        addToast(
          isKm
            ? 'ត្រូវតែបើកដំណើរការក្រុមហ៊ុនដឹកជញ្ជូនយ៉ាងតិច ១'
            : 'At least one delivery partner must remain enabled',
          'warning'
        );
        return prev;
      }
      return {
        ...prev,
        partners: prev.partners.map((p) =>
          p.id === partnerId ? { ...p, enabled: p.enabled === false } : p
        ),
      };
    });
  };

  const handleSetAllFree = () => {
    setConfig((prev) => ({
      ...prev,
      partners: prev.partners.map((p) => ({ ...p, fee: 0 })),
    }));
  };

  const handleResetDefaults = () => {
    setConfig(normalizeShippingConfig(DEFAULT_SHIPPING_CONFIG));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const enabledCount = config.partners.filter((p) => p.enabled !== false).length;
    if (enabledCount === 0) {
      addToast(
        isKm ? 'សូមបើកក្រុមហ៊ុនដឹកជញ្ជូនយ៉ាងតិច ១' : 'Please enable at least one courier',
        'error'
      );
      return;
    }

    for (const partner of config.partners) {
      const feeNum = Number(partner.fee);
      if (!Number.isFinite(feeNum) || feeNum < 0 || feeNum > 500) {
        addToast(
          isKm
            ? `តម្លៃដឹកជញ្ជូនសម្រាប់ ${partner.khmerName} ត្រូវតែនៅចន្លោះ $0.00 និង $500.00`
            : `Fee for ${partner.name} must be between $0.00 and $500.00`,
          'error'
        );
        return;
      }
    }

    const thresholdNum = Number(config.freeShippingThreshold || 0);
    if (!Number.isFinite(thresholdNum) || thresholdNum < 0 || thresholdNum > 100000) {
      addToast(
        isKm ? 'ចំនួនទឹកប្រាក់អប្បបរមាឥតគិតថ្លៃមិនត្រឹមត្រូវទេ' : 'Invalid free shipping threshold',
        'error'
      );
      return;
    }

    setSaving(true);
    try {
      const saved = await adminService.updateShippingRates({
        freeShippingThreshold: thresholdNum,
        partners: config.partners.map((p) => ({
          id: p.id,
          fee: Number(Number(p.fee || 0).toFixed(2)),
          enabled: p.enabled !== false,
          eta: p.eta,
          etaKm: p.etaKm,
          badge: p.badge,
          badgeKm: p.badgeKm,
        })),
      });
      setConfig(normalizeShippingConfig(saved));
      addToast(
        isKm
          ? 'រក្សាទុកតម្លៃដឹកជញ្ជូនរួចរាល់! តម្លៃថ្មីត្រូវបានអនុវត្តនៅ Checkout និង KHQR។'
          : 'Shipping fees saved! Checkout & Bakong KHQR now use your custom rates.',
        'success'
      );
    } catch (err) {
      addToast(
        err?.message || (isKm ? 'រក្សាទុកតម្លៃដឹកជញ្ជូនបរាជ័យ' : 'Failed to save shipping rates'),
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Truck className="w-5 h-5" />
            </span>
            {isKm ? 'គ្រប់គ្រងថ្លៃដឹកជញ្ជូន' : 'Shipping Fees & Couriers'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isKm
              ? 'កំណត់តម្លៃដឹកជញ្ជូនផ្ទាល់ខ្លួនសម្រាប់ក្រុមហ៊ុននីមួយៗ (ដាក់ $0.00 ដើម្បីដឹកជញ្ជូនឥតគិតថ្លៃ) — ភ្ជាប់ដោយផ្ទាល់ជាមួយ Checkout និង KHQR។'
              : 'Customize courier shipping fees (set $0.00 for Free Shipping). Updates sync immediately to Checkout and Bakong KHQR.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSetAllFree}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isKm ? 'ឥតគិតថ្លៃទាំងអស់ ($0)' : 'Set All Free ($0)'}
          </button>
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {isKm ? 'តម្លៃដើម' : 'Reset Defaults'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center text-sm text-slate-400">
          {isKm ? 'កំពុងទាញយកការកំណត់ថ្លៃដឹកជញ្ជូន...' : 'Loading shipping settings...'}
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Free Shipping Threshold Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 max-w-xl">
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                  {isKm ? 'លក្ខខណ្ឌដឹកជញ្ជូនឥតគិតថ្លៃ (Free Shipping Threshold)' : 'Free Shipping Threshold'}
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {isKm
                    ? 'បើអតិថិជនទិញអស់ចាប់ពីចំនួនទឹកប្រាក់នេះឡើងទៅ ថ្លៃដឹកជញ្ជូននឹងក្លាយជា $0 (FREE) ដោយស្វ័យប្រវត្តិ។ ដាក់ 0 ដើម្បីគិតថ្លៃដឹកជញ្ជូនតាមក្រុមហ៊ុនជានិច្ច។'
                    : 'Automatically waive shipping fees when the product subtotal reaches this amount. Set to $0 to always charge the courier fee.'}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="100000"
                    step="0.01"
                    value={config.freeShippingThreshold}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        freeShippingThreshold: e.target.value === '' ? '' : Number(e.target.value),
                      }))
                    }
                    className="w-36 pl-7 pr-12 py-2.5 rounded-xl border border-slate-200 font-mono text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">
                    USD
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="text-slate-600">
                {Number(config.freeShippingThreshold || 0) > 0
                  ? isKm
                    ? `ការកុម្ម៉ង់ចាប់ពី $${Number(config.freeShippingThreshold).toFixed(2)} ឡើងទៅ នឹងទទួលបានការដឹកជញ្ជូនឥតគិតថ្លៃ`
                    : `Orders $${Number(config.freeShippingThreshold).toFixed(2)}+ qualify for FREE shipping automatically`
                  : isKm
                  ? 'បច្ចុប្បន្នគិតថ្លៃដឹកជញ្ជូនតាមតម្លៃក្រុមហ៊ុននីមួយៗខាងក្រោមជានិច្ច'
                  : 'Threshold disabled — checkout always uses the custom courier fee below'}
              </span>
            </div>
          </div>

          {/* Courier Cards */}
          <div className="grid grid-cols-1 gap-4">
            {config.partners.map((partner) => {
              const numericFee = Number(partner.fee || 0);
              const isFree = numericFee === 0;
              const isEnabled = partner.enabled !== false;

              return (
                <div
                  key={partner.id}
                  className={`bg-white rounded-3xl border p-5 sm:p-6 shadow-xs transition ${
                    isEnabled ? 'border-slate-200' : 'border-slate-200/60 opacity-70 bg-slate-50/40'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                            {isKm ? partner.khmerName : partner.name}
                          </h3>
                          <span className="text-xs text-slate-400">
                            ({isKm ? partner.name : partner.khmerName})
                          </span>
                          {isFree ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                              {isKm ? 'ឥតគិតថ្លៃ (FREE)' : 'FREE ($0.00)'}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 font-mono">
                              ${numericFee.toFixed(2)} USD
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
                          <span>ID: <code className="font-mono text-slate-700">{partner.id}</code></span>
                          {partner.website && (
                            <a
                              href={partner.website}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                            >
                              <Globe className="w-3 h-3" />
                              {partner.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-start lg:self-center">
                      <button
                        type="button"
                        onClick={() => handleTogglePartner(partner.id)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          isEnabled
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {isEnabled
                          ? isKm ? 'កំពុងបើកប្រើ' : 'Enabled'
                          : isKm ? 'បានបិទ' : 'Disabled'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                        {isKm ? 'តម្លៃដឹកជញ្ជូន ($ USD)' : 'Shipping Price ($ USD)'}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          $
                        </span>
                        <input
                          type="number"
                          min="0"
                          max="500"
                          step="0.01"
                          value={partner.fee}
                          onChange={(e) =>
                            handlePartnerChange(
                              partner.id,
                              'fee',
                              e.target.value === '' ? '' : Number(e.target.value)
                            )
                          }
                          className="w-full pl-7 pr-12 py-2.5 rounded-xl border border-slate-200 font-mono text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">
                          USD
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                        {isKm ? 'រយៈពេលដឹកជញ្ជូន (English)' : 'Estimated Delivery (EN)'}
                      </label>
                      <input
                        type="text"
                        maxLength={80}
                        value={partner.eta}
                        onChange={(e) => handlePartnerChange(partner.id, 'eta', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                        {isKm ? 'រយៈពេលដឹកជញ្ជូន (ខ្មែរ)' : 'Estimated Delivery (KM)'}
                      </label>
                      <input
                        type="text"
                        maxLength={80}
                        value={partner.etaKm}
                        onChange={(e) => handlePartnerChange(partner.id, 'etaKm', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Save Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={loadRates}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer disabled:opacity-50"
            >
              {isKm ? 'ផ្ទុកឡើងវិញ' : 'Reload'}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {saving
                ? isKm ? 'កំពុងរក្សាទុក...' : 'Saving...'
                : isKm ? 'រក្សាទុកតម្លៃដឹកជញ្ជូន' : 'Save Shipping Fees'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
