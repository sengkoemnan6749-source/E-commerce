import React from 'react';
import Input from '../common/Input';
import { Truck } from 'lucide-react';

export const DELIVERY_PARTNERS = [
  {
    id: 'vireak_buntham',
    name: 'Vireak Buntham Express (VET)',
    khmerName: 'វីរៈ ប៊ុនថាំ អេចប្រេស',
    badge: 'All 25 Provinces',
    eta: '1 - 2 Business Days',
    fee: 1.75,
    website: 'https://vireakbuntham.com/'
  },
  {
    id: 'jt_express',
    name: 'J&T Express Cambodia',
    khmerName: 'ជេ&ធី អេចប្រេស',
    badge: 'Door-to-Door Delivery',
    eta: '1 - 2 Business Days',
    fee: 2.00,
    website: 'https://www.jtexpresskh.com/'
  },
  {
    id: 'grab_express',
    name: 'GrabExpress Phnom Penh',
    khmerName: 'ហ្គ្រែប អេចប្រេស',
    badge: 'Same-Day Fast (1-3 hrs)',
    eta: 'Today (Within 3 Hours)',
    fee: 2.50,
    website: 'https://www.grab.com/kh/express/'
  }
];

const CAMBODIA_PROVINCES = [
  'Phnom Penh',
  'Kandal',
  'Siem Reap',
  'Battambang',
  'Preah Sihanouk (Kompong Som)',
  'Kampot',
  'Kep',
  'Takeo',
  'Kampong Cham',
  'Kampong Chhnang',
  'Kampong Speu',
  'Kampong Thom',
  'Koh Kong',
  'Kratie',
  'Mondulkiri',
  'Otdar Meanchey',
  'Pailin',
  'Preah Vihear',
  'Prey Veng',
  'Pursat',
  'Ratanakiri',
  'Stung Treng',
  'Svay Rieng',
  'Tbong Khmum'
];

export default function ShippingForm({ formData, onChange, errors = {} }) {
  const handleChange = (field, value) => {
    onChange({ ...formData, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Full name *"
          placeholder="e.g. Sara Meng"
          value={formData.fullName || ''}
          onChange={(e) => handleChange('fullName', e.target.value)}
          error={errors.fullName}
          required
        />

        <Input
          label="Phone number *"
          placeholder="e.g. 012 345 678"
          value={formData.phone || ''}
          onChange={(e) => handleChange('phone', e.target.value)}
          error={errors.phone}
          helperText="Used for courier delivery updates"
          required
        />
      </div>

      <Input
        label="Street address / Building *"
        placeholder="e.g. #14B, Street 310, Boeng Keng Kang 1"
        value={formData.address || ''}
        onChange={(e) => handleChange('address', e.target.value)}
        error={errors.address}
        required
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            City / Khan *
          </label>
          <input
            type="text"
            placeholder="e.g. Boeng Keng Kang"
            value={formData.city || ''}
            onChange={(e) => handleChange('city', e.target.value)}
            className="w-full rounded-2xl border border-slate-200/90 hover:border-slate-300 px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-600 transition duration-200 bg-white"
            required
          />
          {errors.city && <p className="mt-1.5 text-xs text-rose-600 font-semibold">{errors.city}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Province *
          </label>
          <select
            value={formData.province || 'Phnom Penh'}
            onChange={(e) => handleChange('province', e.target.value)}
            className="w-full rounded-2xl border border-slate-200/90 hover:border-slate-300 px-3.5 py-3 text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-600 transition duration-200 bg-white cursor-pointer"
          >
            {CAMBODIA_PROVINCES.map((prov) => (
              <option key={prov} value={prov}>
                {prov}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Postal code (optional)
          </label>
          <input
            type="text"
            placeholder="120101"
            value={formData.postalCode || ''}
            onChange={(e) => handleChange('postalCode', e.target.value)}
            className="w-full rounded-2xl border border-slate-200/90 hover:border-slate-300 px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-600 transition duration-200 bg-white"
          />
        </div>
      </div>

      <div className="pt-1">
        <label className="flex items-center gap-2.5 text-xs text-slate-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={formData.saveAddress || false}
            onChange={(e) => handleChange('saveAddress', e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span>Save this delivery address to my account for future orders</span>
        </label>
      </div>

      {/* Cambodia Logistics & Delivery Partner Selection (Clean Vertical Radio List) */}
      <div className="pt-6 border-t border-slate-100">
        <div className="mb-3">
          <h3 className="text-xs font-semibold text-slate-900">
            Shipping method
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Select an official courier service for Phnom Penh and provincial delivery
          </p>
        </div>

        <div className="border border-slate-200/90 rounded-2xl divide-y divide-slate-100 overflow-hidden bg-white shadow-2xs">
          {DELIVERY_PARTNERS.map((partner) => {
            const isSelected = (formData.deliveryPartner || 'vireak_buntham') === partner.id;
            return (
              <label
                key={partner.id}
                onClick={() => handleChange('deliveryPartner', partner.id)}
                className={`flex items-center justify-between p-3.5 sm:p-4 cursor-pointer transition-colors ${
                  isSelected ? 'bg-blue-50/40' : 'hover:bg-slate-50/70'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <input
                    type="radio"
                    name="deliveryPartner"
                    checked={isSelected}
                    onChange={() => handleChange('deliveryPartner', partner.id)}
                    className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-semibold text-slate-900">
                        {partner.name}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        ({partner.khmerName})
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {partner.eta} • {partner.badge}
                    </p>
                  </div>
                </div>

                <span className="text-xs sm:text-sm font-bold text-slate-900 font-mono">
                  ${partner.fee.toFixed(2)} USD
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
