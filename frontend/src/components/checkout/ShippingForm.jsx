import React from 'react';
import Input from '../common/Input';
import { Truck } from 'lucide-react';
import { useLanguage } from '../../store/StoreContext';

export const DELIVERY_PARTNERS = [
  {
    id: 'vireak_buntham',
    name: 'Vireak Buntham Express (VET)',
    khmerName: 'វីរៈ ប៊ុនថាំ អេចប្រេស',
    badge: 'All 25 Provinces',
    badgeKm: '២៥ រាជធានី-ខេត្ត',
    eta: '1 - 2 Business Days',
    etaKm: '១ - ២ ថ្ងៃធ្វើការ',
    fee: 1.75,
    website: 'https://vireakbuntham.com/'
  },
  {
    id: 'jt_express',
    name: 'J&T Express Cambodia',
    khmerName: 'ជេ&ធី អេចប្រេស',
    badge: 'Door-to-Door Delivery',
    badgeKm: 'ដឹកជញ្ជូនដល់មុខផ្ទះ',
    eta: '1 - 2 Business Days',
    etaKm: '១ - ២ ថ្ងៃធ្វើការ',
    fee: 2.00,
    website: 'https://www.jtexpresskh.com/'
  },
  {
    id: 'grab_express',
    name: 'GrabExpress Phnom Penh',
    khmerName: 'ហ្គ្រែប អេចប្រេស',
    badge: 'Same-Day Fast (1-3 hrs)',
    badgeKm: 'រហ័សក្នុងថ្ងៃតែមួយ (១-៣ ម៉ោង)',
    eta: 'Today (Within 3 Hours)',
    etaKm: 'ថ្ងៃនេះ (ក្នុងរយៈពេល ៣ ម៉ោង)',
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

const CAMBODIA_PROVINCES_KM = {
  'Phnom Penh': 'រាជធានីភ្នំពេញ',
  Kandal: 'កណ្តាល',
  'Siem Reap': 'សៀមរាប',
  Battambang: 'បាត់ដំបង',
  'Preah Sihanouk (Kompong Som)': 'ព្រះសីហនុ (កំពង់សោម)',
  Kampot: 'កំពត',
  Kep: 'កែប',
  Takeo: 'តាកែវ',
  'Kampong Cham': 'កំពង់ចាម',
  'Kampong Chhnang': 'កំពង់ឆ្នាំង',
  'Kampong Speu': 'កំពង់ស្ពឺ',
  'Kampong Thom': 'កំពង់ធំ',
  'Koh Kong': 'កោះកុង',
  Kratie: 'ក្រចេះ',
  Mondulkiri: 'មណ្ឌលគិរី',
  'Otdar Meanchey': 'ឧត្តរមានជ័យ',
  Pailin: 'ប៉ៃលិន',
  'Preah Vihear': 'ព្រះវិហារ',
  'Prey Veng': 'ព្រៃវែង',
  Pursat: 'ពោធិ៍សាត់',
  Ratanakiri: 'រតនគិរី',
  'Stung Treng': 'ស្ទឹងត្រែង',
  'Svay Rieng': 'ស្វាយរៀង',
  'Tbong Khmum': 'ត្បូងឃ្មុំ'
};

export default function ShippingForm({ formData, onChange, errors = {}, shippingPartners = null, freeShippingApplied = false }) {
  const { language } = useLanguage();
  const handleChange = (field, value) => {
    onChange({ ...formData, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label={language === 'km' ? 'ឈ្មោះពេញ *' : 'Full name *'}
          placeholder={language === 'km' ? 'ឧ. Sara Meng' : 'e.g. Sara Meng'}
          value={formData.fullName || ''}
          onChange={(e) => handleChange('fullName', e.target.value)}
          error={errors.fullName}
          required
        />

        <Input
          label={language === 'km' ? 'លេខទូរស័ព្ទ *' : 'Phone number *'}
          placeholder={language === 'km' ? 'ឧ. 012 345 678' : 'e.g. 012 345 678'}
          value={formData.phone || ''}
          onChange={(e) => handleChange('phone', e.target.value)}
          error={errors.phone}
          helperText={
            language === 'km'
              ? 'ប្រើសម្រាប់ការជូនដំណឹងអំពីការដឹកជញ្ជូន'
              : 'Used for courier delivery updates'
          }
          required
        />
      </div>

      <Input
        label={language === 'km' ? 'អាសយដ្ឋានផ្លូវ / អគារ *' : 'Street address / Building *'}
        placeholder={
          language === 'km'
            ? 'ឧ. #14B, ផ្លូវ 310, បឹងកេងកង ១'
            : 'e.g. #14B, Street 310, Boeng Keng Kang 1'
        }
        value={formData.address || ''}
        onChange={(e) => handleChange('address', e.target.value)}
        error={errors.address}
        required
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            {language === 'km' ? 'ទីក្រុង / ខណ្ឌ *' : 'City / Khan *'}
          </label>
          <input
            type="text"
            placeholder={language === 'km' ? 'ឧ. បឹងកេងកង' : 'e.g. Boeng Keng Kang'}
            value={formData.city || ''}
            onChange={(e) => handleChange('city', e.target.value)}
            className="w-full rounded-2xl border border-slate-200/90 hover:border-slate-300 px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-600 transition duration-200 bg-white"
            required
          />
          {errors.city && <p className="mt-1.5 text-xs text-rose-600 font-semibold">{errors.city}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            {language === 'km' ? 'ខេត្ត / រាជធានី *' : 'Province *'}
          </label>
          <select
            value={formData.province || 'Phnom Penh'}
            onChange={(e) => handleChange('province', e.target.value)}
            className="w-full rounded-2xl border border-slate-200/90 hover:border-slate-300 px-3.5 py-3 text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/15 focus:border-blue-600 transition duration-200 bg-white cursor-pointer"
          >
            {CAMBODIA_PROVINCES.map((prov) => (
              <option key={prov} value={prov}>
                {language === 'km' ? CAMBODIA_PROVINCES_KM[prov] || prov : prov}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            {language === 'km' ? 'លេខកូដប្រៃសណីយ៍ (ជាជម្រើស)' : 'Postal code (optional)'}
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
          <span>
            {language === 'km'
              ? 'រក្សាទុកអាសយដ្ឋានដឹកជញ្ជូននេះក្នុងគណនីរបស់ខ្ញុំសម្រាប់ការកុម្ម៉ង់លើកក្រោយ'
              : 'Save this delivery address to my account for future orders'}
          </span>
        </label>
      </div>

      {/* Cambodia Logistics & Delivery Partner Selection (Clean Vertical Radio List) */}
      <div className="pt-6 border-t border-slate-100">
        <div className="mb-3">
          <h3 className="text-xs font-semibold text-slate-900">
            {language === 'km' ? 'វិធីសាស្ត្រដឹកជញ្ជូន' : 'Shipping method'}
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {language === 'km'
              ? 'ជ្រើសរើសសេវាដឹកជញ្ជូនផ្លូវការសម្រាប់ភ្នំពេញ និងតាមខេត្ត'
              : 'Select an official courier service for Phnom Penh and provincial delivery'}
          </p>
        </div>

        <div className="border border-slate-200/90 rounded-2xl divide-y divide-slate-100 overflow-hidden bg-white shadow-2xs">
          {(Array.isArray(shippingPartners) && shippingPartners.length > 0
            ? shippingPartners.filter((p) => p.enabled !== false)
            : DELIVERY_PARTNERS
          ).map((partner) => {
            const partnerFee = Number(partner.fee || 0);
            const isFree = freeShippingApplied || partnerFee === 0;
            const isSelected = (formData.deliveryPartner || 'vireak_buntham') === partner.id;
            return (
              <label
                key={partner.id}
                onClick={() => handleChange('deliveryPartner', partner.id)}
                className={`flex items-center justify-between gap-3 p-3.5 sm:p-4 cursor-pointer transition-colors ${
                  isSelected ? 'bg-blue-50/40' : 'hover:bg-slate-50/70'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <input
                    type="radio"
                    name="deliveryPartner"
                    checked={isSelected}
                    onChange={() => handleChange('deliveryPartner', partner.id)}
                    className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-x-2 gap-y-0.5 flex-wrap">
                      <span className="text-xs sm:text-sm font-semibold text-slate-900">
                        {language === 'km' ? partner.khmerName : partner.name}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        ({language === 'km' ? partner.name : partner.khmerName})
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {language === 'km' ? partner.etaKm : partner.eta} • {language === 'km' ? partner.badgeKm : partner.badge}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 whitespace-nowrap flex items-center gap-2">
                  {freeShippingApplied && partnerFee > 0 && (
                    <span className="text-[11px] text-slate-400 line-through font-mono">
                      ${partnerFee.toFixed(2)}
                    </span>
                  )}
                  {isFree ? (
                    <span className="text-xs sm:text-sm font-bold text-emerald-600 uppercase">
                      {language === 'km' ? 'ឥតគិតថ្លៃ' : 'FREE'}
                    </span>
                  ) : (
                    <span className="text-xs sm:text-sm font-bold text-slate-900 font-mono">
                      ${partnerFee.toFixed(2)} USD
                    </span>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
