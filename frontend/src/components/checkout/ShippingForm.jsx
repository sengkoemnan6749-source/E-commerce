import React from 'react';
import Input from '../common/Input';
import { User, Phone, MapPin, Building, Mail } from 'lucide-react';

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
          label="Full Name *"
          placeholder="e.g. Sara Meng"
          icon={User}
          value={formData.fullName || ''}
          onChange={(e) => handleChange('fullName', e.target.value)}
          error={errors.fullName}
          required
        />

        <Input
          label="Phone Number *"
          placeholder="e.g. 012 345 678"
          icon={Phone}
          value={formData.phone || ''}
          onChange={(e) => handleChange('phone', e.target.value)}
          error={errors.phone}
          helperText="Used for courier delivery confirmation"
          required
        />
      </div>

      <Input
        label="Street Address / Building / Unit *"
        placeholder="e.g. #14B, St. 310, Boeung Keng Kang 1"
        icon={MapPin}
        value={formData.address || ''}
        onChange={(e) => handleChange('address', e.target.value)}
        error={errors.address}
        required
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            City / Khan *
          </label>
          <input
            type="text"
            placeholder="e.g. Chamkarmon"
            value={formData.city || ''}
            onChange={(e) => handleChange('city', e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
            required
          />
          {errors.city && <p className="mt-1 text-xs text-rose-500">{errors.city}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Province / Capital *
          </label>
          <select
            value={formData.province || 'Phnom Penh'}
            onChange={(e) => handleChange('province', e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all bg-white"
          >
            {CAMBODIA_PROVINCES.map((prov) => (
              <option key={prov} value={prov}>
                {prov}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Postal / Zip Code
          </label>
          <input
            type="text"
            placeholder="120101"
            value={formData.postalCode || ''}
            onChange={(e) => handleChange('postalCode', e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div className="pt-2">
        <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.saveAddress || false}
            onChange={(e) => handleChange('saveAddress', e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span>Save this delivery address to my TechTonic account for future orders</span>
        </label>
      </div>
    </div>
  );
}
