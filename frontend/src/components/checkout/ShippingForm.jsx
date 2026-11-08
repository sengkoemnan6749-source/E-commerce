import React from 'react';
import Input from '../common/Input';
import { User, Phone, MapPin, Building, Mail, Truck, ExternalLink, CheckCircle2 } from 'lucide-react';

export const DELIVERY_PARTNERS = [
  {
    id: 'vireak_buntham',
    name: 'Vireak Buntham Express (VET)',
    khmerName: 'វីរៈ ប៊ុនថាំ អេចប្រេស',
    badge: 'All 25 Provinces',
    eta: '24 - 48 Hours',
    fee: 1.75,
    website: 'https://vireakbuntham.com/',
    themeColor: 'border-amber-500 bg-amber-50/40',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    description: 'Cambodia largest provincial bus & parcel logistics network reaching every district.'
  },
  {
    id: 'jt_express',
    name: 'J&T Express Cambodia',
    khmerName: 'ជេ&ធី អេចប្រេស',
    badge: 'Door-to-Door Express',
    eta: '24 - 36 Hours',
    fee: 2.00,
    website: 'https://www.jtexpresskh.com/',
    themeColor: 'border-rose-500 bg-rose-50/40',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
    description: 'Fast nationwide automated courier with barcode tracking & doorstep delivery.'
  },
  {
    id: 'grab_express',
    name: 'GrabExpress Phnom Penh',
    khmerName: 'ហ្គ្រែប អេចប្រេស',
    badge: 'Same-Day Fast (1-3h)',
    eta: '1 - 3 Hours',
    fee: 2.50,
    website: 'https://www.grab.com/kh/express/',
    themeColor: 'border-emerald-500 bg-emerald-50/40',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    description: 'Instant motorbike courier dispatched immediately for Phnom Penh metropolitan area.'
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

      {/* Cambodia Logistics & Delivery Partner Selection (Teacher Requirement) */}
      <div className="pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Select Delivery Service / ជ្រើសរើសក្រុមហ៊ុនដឹកជញ្ជូន
            </span>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">
            Cambodia Express Fleet
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {DELIVERY_PARTNERS.map((partner) => {
            const isSelected = (formData.deliveryPartner || 'vireak_buntham') === partner.id;
            return (
              <div
                key={partner.id}
                onClick={() => handleChange('deliveryPartner', partner.id)}
                className={`relative p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? `${partner.themeColor} shadow-sm ring-1 ring-blue-500/20`
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-1.5">
                    <span className="font-bold text-xs text-slate-900 leading-snug">
                      {partner.name}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    )}
                  </div>

                  <div className="text-[11px] font-medium text-slate-500 mb-2">
                    {partner.khmerName}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${partner.badgeColor}`}>
                      {partner.badge}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      ETA: {partner.eta}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed mb-3">
                    {partner.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-900">
                    ${partner.fee.toFixed(2)} USD
                  </span>
                  <a
                    href={partner.website}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 underline"
                  >
                    <span>Website</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
