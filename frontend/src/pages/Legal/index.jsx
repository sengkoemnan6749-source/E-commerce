import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, FileText, Lock, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../store/StoreContext';

const POLICY_CONTENT = {
  privacy: {
    icon: Lock,
    en: {
      title: 'Privacy Policy',
      updated: 'Effective: November 2026',
      intro:
        'TechTonic Store Cambodia respects your privacy and protects personal data collected through our storefront, checkout, and support channels.',
      sections: [
        {
          heading: '1. Information We Collect',
          body: 'We collect your name, email address, phone number, and Cambodia delivery address when you register, place an order, or submit a support inquiry. Card numbers are never stored in full—only sanitized last-4 receipt digits are recorded.',
        },
        {
          heading: '2. How We Use Your Data',
          body: 'Your contact and shipping details are used strictly to process Bakong KHQR or Cash-on-Delivery payments, dispatch couriers (GrabExpress, VET, J&T), provide order tracking updates, and assist with warranty claims.',
        },
        {
          heading: '3. Security & Account Protection',
          body: 'Authentication is powered by Firebase Auth with optional 2FA authenticator verification and encrypted Firestore storage. You can update your profile, saved addresses, or request account assistance anytime via Support.',
        },
      ],
    },
    km: {
      title: 'គោលការណ៍ភាពឯកជន (Privacy Policy)',
      updated: 'មានប្រសិទ្ធភាព៖ វិច្ឆិកា ២០២៦',
      intro:
        'TechTonic Store កម្ពុជា គោរពភាពឯកជនរបស់អ្នក និងការពារទិន្នន័យផ្ទាល់ខ្លួនដែលប្រមូលបានតាមរយៈហាងអនឡាញ ការទូទាត់ប្រាក់ និងសេវាជំនួយអតិថិជន។',
      sections: [
        {
          heading: '១. ព័ត៌មានដែលយើងប្រមូល',
          body: 'យើងប្រមូលឈ្មោះ អ៊ីមែល លេខទូរស័ព្ទ និងអាសយដ្ឋានដឹកជញ្ជូននៅកម្ពុជានៅពេលអ្នកចុះឈ្មោះ បញ្ជាទិញ ឬផ្ញើសារជំនួយ។ លេខកាតធនាគារពេញលេញមិនត្រូវបានរក្សាទុកឡើយ (រក្សាទុកតែ ៤ ខ្ទង់ចុងក្រោយសម្រាប់វិក្កយបត្រ)។',
        },
        {
          heading: '២. ការប្រើប្រាស់ទិន្នន័យរបស់អ្នក',
          body: 'ព័ត៌មានទំនាក់ទំនង និងទីតាំងដឹកជញ្ជូនត្រូវបានប្រើសម្រាប់ដំណើរការទូទាត់ Bakong KHQR ឬទូទាត់ពេលទទួលទំនិញ ដឹកជញ្ជូនតាម GrabExpress / VET / J&T និងជូនដំណឹងពីស្ថានភាពកុម្ម៉ង់។',
        },
        {
          heading: '៣. សុវត្ថិភាពគណនី',
          body: 'ការចូលប្រើត្រូវបានការពារដោយ Firebase Auth និងមុខងារ 2FA Authenticator។ អ្នកអាចកែប្រែព័ត៌មានផ្ទាល់ខ្លួន ឬស្នើសុំជំនួយពីក្រុមការងារបានគ្រប់ពេល។',
        },
      ],
    },
  },
  terms: {
    icon: FileText,
    en: {
      title: 'Terms of Service',
      updated: 'Effective: November 2026',
      intro:
        'By accessing or purchasing from TechTonic Store, you agree to the following order, pricing, and delivery terms within the Kingdom of Cambodia.',
      sections: [
        {
          heading: '1. Orders & Pricing',
          body: 'All product prices are listed in USD ($). Promotional codes are subject to minimum subtotal requirements and expiration dates. TechTonic reserves the right to verify stock availability prior to courier dispatch.',
        },
        {
          heading: '2. Delivery & Same-Day Dispatch',
          body: 'Phnom Penh orders confirmed before 4:00 PM qualify for same-day GrabExpress courier dispatch. Provincial deliveries via Vireak Buntham (VET) or J&T Express typically arrive within 1–3 business days.',
        },
        {
          heading: '3. Returns & Exchanges (30 Days)',
          body: 'Unopened or manufacturing-defective hardware may be exchanged within 30 days of delivery with original packaging, warranty seal, and official invoice.',
        },
      ],
    },
    km: {
      title: 'លក្ខខណ្ឌនៃការប្រើប្រាស់ (Terms of Service)',
      updated: 'មានប្រសិទ្ធភាព៖ វិច្ឆិកា ២០២៦',
      intro:
        'នៅពេលប្រើប្រាស់ ឬបញ្ជាទិញទំនិញពី TechTonic Store អ្នកយល់ព្រមតាមលក្ខខណ្ឌតម្លៃ ការដឹកជញ្ជូន និងការប្តូរទំនិញនៅព្រះរាជាណាចក្រកម្ពុជា។',
      sections: [
        {
          heading: '១. ការបញ្ជាទិញ និងតម្លៃ',
          body: 'តម្លៃទំនិញទាំងអស់គិតជាដុល្លារអាមេរិក ($)។ លេខកូដប្រូម៉ូសិនអាស្រ័យលើលក្ខខណ្ឌចំនួនទឹកប្រាក់អប្បបរមា និងកាលបរិច្ឆេទផុតកំណត់។',
        },
        {
          heading: '២. ការដឹកជញ្ជូនរហ័ស',
          body: 'ការកុម្ម៉ង់នៅភ្នំពេញមុនម៉ោង ៤ រសៀល នឹងត្រូវដឹកចេញក្នុងថ្ងៃតែមួយតាម GrabExpress។ ការដឹកជញ្ជូនទៅតាមខេត្តតាម VET ឬ J&T Express ចំណាយពេលប្រហែល ១–៣ ថ្ងៃធ្វើការ។',
        },
        {
          heading: '៣. ការប្តូរទំនិញក្នុង ៣០ ថ្ងៃ',
          body: 'ផលិតផលដែលមានបញ្ហាបច្ចេកទេសពីរោងចក្រ អាចប្តូរថ្មីបានក្នុងរយៈពេល ៣០ ថ្ងៃ ដោយមានប្រអប់ដើម ត្រាធានា និងវិក្កយបត្រ។',
        },
      ],
    },
  },
  warranty: {
    icon: ShieldCheck,
    en: {
      title: '1-Year Hardware Warranty Policy',
      updated: 'Official TechTonic Cambodia Warranty',
      intro:
        'Every audio device, mechanical keyboard, wearable, and GaN charger sold by TechTonic Store includes an official 1-Year Cambodia Service Center Warranty.',
      sections: [
        {
          heading: '1. Covered Defects',
          body: 'Battery failure, Bluetooth/wireless module faults, OLED/AMOLED display dead pixels, mechanical switch chatter, and USB-C charging controller defects under normal usage.',
        },
        {
          heading: '2. Exclusions',
          body: 'Physical impact cracks, liquid submersion beyond manufacturer IP rating, unauthorized disassembly, or power surges caused by non-certified third-party cables.',
        },
        {
          heading: '3. How to Claim Warranty',
          body: 'Contact our Toul Kork service desk via Support Widget or Telegram (@techtonic_kh) with your Order ID (e.g. ORD-...) and official TechTonic invoice.',
        },
      ],
    },
    km: {
      title: 'គោលការណ៍ធានា ១ ឆ្នាំ (Warranty Policy)',
      updated: 'ការធានាផ្លូវការ TechTonic កម្ពុជា',
      intro:
        'ឧបករណ៍សំឡេង ក្តារចុច Mechanical នាឡិកាឆ្លាតវៃ និងឆ្នាំងសាក GaN ទាំងអស់របស់ TechTonic Store មានការធានាផ្លូវការរយៈពេល ១ ឆ្នាំពេញ។',
      sections: [
        {
          heading: '១. អ្វីខ្លះដែលត្រូវបានធានា',
          body: 'បញ្ហាថ្ម កំហូចប្រព័ន្ធ Bluetooth/Wireless អេក្រង់ OLED/AMOLED ខូចខុសប្រក្រតី គ្រាប់ចុច Keyboard មិនដំណើរការ ឬបញ្ហា Chip សាកថ្មក្រោមការប្រើប្រាស់ធម្មតា។',
        },
        {
          heading: '២. ករណីលើកលែងមិនធានា',
          body: 'ការធ្លាក់បែក ឆ្កូតធ្ងន់ធ្ងរ ចូលទឹកហួសកម្រិតការពារ IP ការដោះជួសជុលខាងក្រៅ ឬការឆេះដោយសារប្រើប្រាស់ឌុយសាកគ្មានគុណភាព។',
        },
        {
          heading: '៣. របៀបស្នើសុំការធានា',
          body: 'សូមទាក់ទងមជ្ឈមណ្ឌលសេវាកម្មទួលគោកតាមរយៈប្រអប់ជំនួយ ឬ Telegram (@techtonic_kh) ដោយភ្ជាប់លេខកូដកុម្ម៉ង់ (ORD-...) និងវិក្កយបត្រផ្លូវការ។',
        },
      ],
    },
  },
};

export default function LegalPolicy({ type = 'privacy' }) {
  const { language } = useLanguage();
  const entry = POLICY_CONTENT[type] || POLICY_CONTENT.privacy;
  const Icon = entry.icon;
  const copy = language === 'km' ? entry.km : entry.en;

  return (
    <div className="bg-[#f8fafc] min-h-screen py-10 sm:py-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{language === 'km' ? 'ត្រឡប់ទៅទំព័រដើម' : 'Back to Storefront'}</span>
        </Link>

        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-10 space-y-6 sm:space-y-8">
          <div className="flex items-start gap-4 pb-6 border-b border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 block mb-1">
                {copy.updated}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {copy.title}
              </h1>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">{copy.intro}</p>
            </div>
          </div>

          <div className="space-y-6">
            {copy.sections.map((section) => (
              <div key={section.heading} className="p-5 rounded-2xl bg-slate-50/70 border border-slate-100">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{section.heading}</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{section.body}</p>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex flex-wrap items-center gap-4">
              <Link to="/privacy" className={`hover:text-blue-600 font-semibold ${type === 'privacy' ? 'text-blue-600' : ''}`}>
                {language === 'km' ? 'ភាពឯកជន' : 'Privacy Policy'}
              </Link>
              <Link to="/terms" className={`hover:text-blue-600 font-semibold ${type === 'terms' ? 'text-blue-600' : ''}`}>
                {language === 'km' ? 'លក្ខខណ្ឌ' : 'Terms of Service'}
              </Link>
              <Link to="/warranty" className={`hover:text-blue-600 font-semibold ${type === 'warranty' ? 'text-blue-600' : ''}`}>
                {language === 'km' ? 'ការធានា' : 'Warranty Policy'}
              </Link>
            </div>
            <span>TechTonic Store • Toul Kork, Phnom Penh</span>
          </div>
        </div>
      </div>
    </div>
  );
}

