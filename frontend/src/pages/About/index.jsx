import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Cpu, Headphones, Zap, MapPin, Mail, Phone, ArrowRight, Award } from 'lucide-react';
import Button from '../../components/common/Button';
import { useLanguage } from '../../store/StoreContext';

export default function About() {
  const { language } = useLanguage();

  return (
    <div className="flex flex-col gap-16 pb-20">
      {/* Hero Banner */}
      <section className="bg-slate-900 text-white py-16 sm:py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-950/80 px-3 py-1 rounded-full border border-blue-800">
            {language === 'km' ? 'អំពីហាង TechTonic Store' : 'About TechTonic Store'}
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mt-4 mb-4">
            {language === 'km'
              ? 'រចនាឡើងសម្រាប់របៀបរស់នៅបែបឌីជីថលសម័យថ្មី'
              : 'Engineered for the Modern Digital Lifestyle'}
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {language === 'km'
              ? 'បង្កើតឡើងដើម្បីផ្គត់ផ្គង់ដល់វិស្វករសូហ្វវែរ អ្នកបង្កើតមាតិកា និងអ្នកជំនាញនៅកម្ពុជា នូវគ្រឿងអេឡិចត្រូនិចដែលឆ្លងកាត់ការធ្វើតេស្តគុណភាព សម្ភារៈតុធ្វើការស្តង់ដារសុខភាព និងប្រព័ន្ធសំឡេងកម្រិតស្ទូឌីយោ។'
              : 'Founded to provide Cambodian software engineers, creators, and professionals with benchmark-tested electronics, ergonomic peripherals, and studio-grade acoustics.'}
          </p>
        </div>
      </section>

      {/* Philosophy Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col items-start">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {language === 'km' ? 'វិស្វកម្មគ្មានការសម្របសម្រួល' : 'Uncompromising Engineering'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {language === 'km'
                ? 'យើងជ្រើសរើសតែឧបករណ៍ដែលផលិតជាមួយបច្ចេកវិទ្យាគ្រប់គ្រងកម្ដៅ GaN ល្បឿនលឿន កុងតាក់ក្ដារចុចមេកានិកដែលអាចប្ដូរបាន និងដ្រាយវ័រសំឡេង Spatial Audio កម្រិតច្បាស់ខ្ពស់ប៉ុណ្ណោះ។'
                : 'We curate only devices engineered with GaN fast-power thermal control, hot-swappable mechanical tactile switches, and high-resolution spatial audio drivers.'}
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col items-start">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {language === 'km' ? 'ការធានារយៈពេល ១ ឆ្នាំជាមួយលេខសម្គាល់' : '1-Year Serialized Warranty'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {language === 'km'
                ? 'គ្រប់ផលិតផលទាំងអស់ដែលទិញពី TechTonic ត្រូវបានផ្ទៀងផ្ទាត់ភាពត្រឹមត្រូវ និងគាំទ្រដោយគោលការណ៍ប្ដូរទំនិញក្នុងស្រុករយៈពេល ១២ ខែ តាមរយៈមជ្ឈមណ្ឌលសេវាកម្មនៅរាជធានីភ្នំពេញ។'
                : 'Every unit purchased from TechTonic is authenticated and backed by a local 12-month hardware exchange policy through our Phnom Penh service center.'}
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col items-start">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {language === 'km' ? 'ការរួមបញ្ចូលប្រព័ន្ធឌីជីថលបាគង' : 'Bakong Digital Integration'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {language === 'km'
                ? 'ការស្កេនទូទាត់ KHQR របស់ធនាគារជាតិនៃកម្ពុជា (Bakong) អនុញ្ញាតឱ្យទូទាត់ភ្លាមៗដោយឥតគិតថ្លៃសេវា ឆ្លងកាត់គ្រប់ធនាគារនៅកម្ពុជា រួមមាន ABA, Wing, ACLEDA និង Sathapana។'
                : 'Native NBC Bakong KHQR QR scanning enables instant zero-fee settlement across all Cambodian banks, including ABA, Wing, ACLEDA, and Sathapana.'}
            </p>
          </div>
        </div>
      </section>

      {/* Flagship Location Card */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              {language === 'km' ? 'មជ្ឈមណ្ឌលបទពិសោធន៍សាខាធំ' : 'Flagship Experience Center'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {language === 'km' ? 'អញ្ជើញមកទស្សនាហាងយើងនៅភ្នំពេញ' : 'Visit Us in Phnom Penh'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {language === 'km'
                ? 'សាកល្បងកាសស្តាប់ត្រចៀក ប្រភេទ Keycap កម្លាំងចុចកុងតាក់មេកានិក និងស្ថានីយសាកភ្លើងដោយផ្ទាល់ ជាមួយអ្នកបច្ចេកទេសជំនាញរបស់យើង។'
                : 'Test headphones, keycap profiles, mechanical switch weights, and charging docks in person with our certified hardware technicians.'}
            </p>

            <div className="space-y-2 text-xs text-slate-700 pt-2">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>
                  {language === 'km'
                    ? 'ផ្ទះលេខ ២៧១ មហាវិថីមុនីរ៉េត សង្កាត់ទួលគោក រាជធានីភ្នំពេញ កម្ពុជា'
                    : '#271 Monireth Blvd, Toul Kork, Phnom Penh, Cambodia'}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-blue-600" />
                <span>
                  {language === 'km'
                    ? '+855 23 888 999 • ច័ន្ទ - អាទិត្យ៖ ៨:៣០ ព្រឹក - ៨:០០ យប់'
                    : '+855 23 888 999 • Mon - Sun: 8:30 AM - 8:00 PM'}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-blue-600" />
                <span>support@techtonic.store</span>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0">
            <Link to="/shop">
              <Button variant="primary" size="lg" className="px-8 shadow-md">
                <span>{language === 'km' ? 'ស្វែងរកកាតាឡុកផលិតផល' : 'Explore Catalog'}</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
