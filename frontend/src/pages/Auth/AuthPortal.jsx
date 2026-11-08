import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  QrCode,
  Laptop,
  Check,
  ShieldCheck,
  Lock,
  Globe,
  HelpCircle,
  Sparkles,
  Zap,
  ArrowRight,
  User,
  Mail,
  Phone
} from 'lucide-react';
import { useAuth, useToast, useLanguage } from '../../store/StoreContext';
import { ToastContainer } from '../../components/common/Toast';
import { validateEmail, validatePhone } from '../../utils/validation';

export default function AuthPortal({ defaultMode = 'signin' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();
  const { addToast } = useToast();
  const { language: lang, setLanguage: setLang } = useLanguage();

  // Mode: 'signin' | 'signup'
  const [activeTab, setActiveTab] = useState(defaultMode);

  // Sync mode with route changes (e.g. if user navigates via browser back/forward)
  useEffect(() => {
    if (location.pathname.includes('/register')) {
      setActiveTab('signup');
    } else if (location.pathname.includes('/login')) {
      setActiveTab('signin');
    }
  }, [location.pathname]);

  // Tab Refs & Animated Indicator state
  const signInRef = useRef(null);
  const signUpRef = useRef(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 80 });

  // Common UI State
  const [isQrMode, setIsQrMode] = useState(false);
  const [showCookieNotice, setShowCookieNotice] = useState(true);
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  // Sign In Form State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [signInAgreed, setSignInAgreed] = useState(true);

  // Sign Up Form State
  const [signUpData, setSignUpData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showSignUpConfirmPassword, setShowSignUpConfirmPassword] = useState(false);
  const [signUpAgreed, setSignUpAgreed] = useState(true);
  const [signUpErrors, setSignUpErrors] = useState({});

  // Query redirect handling
  const searchParams = new URLSearchParams(location.search);
  const redirectQuery = searchParams.get('redirect');
  const from = location.state?.from?.pathname || redirectQuery || '/account';

  // Dynamic Translations
  const t = {
    en: {
      accountTitle: 'TechTonic Account',
      agreement: 'User Agreement',
      privacy: 'Privacy Policy',
      needHelp: 'Need help?',
      selectLang: 'English',
      signInTab: 'Sign in',
      signUpTab: 'Sign up',
      inputPlaceholder: 'Email / Phone / TechTonic ID',
      passwordPlaceholder: 'Password',
      namePlaceholder: 'Full Name (e.g. Sara Meng)',
      emailPlaceholder: 'Email Address',
      phonePlaceholder: 'Phone Number (e.g. 012 345 678)',
      setPassPlaceholder: 'Set Password (min 6 chars)',
      confirmPassPlaceholder: 'Confirm Password',
      agreeText: "I've read and agreed to the TechTonic Account",
      agreeLink1: 'User Agreement',
      and: 'and',
      agreeLink2: 'Privacy Policy',
      signInBtn: 'Sign in',
      signUpBtn: 'Create TechTonic Account',
      forgotPassword: 'Forgot password?',
      moreOptions: 'More options',
      googleBtnSignIn: 'Sign in with Google',
      googleBtnSignUp: 'Sign up with Google',
      qrTitle: 'Scan to sign in',
      qrDesc: 'Scan with TechTonic App or Bakong KHQR Authenticator to log in instantly.',
      qrSwitch: 'Sign in with password',
      cookieText: 'We use cookies to maintain essential functionalities of our website and personalize your hardware ecosystem. You can find more information in our',
      cookiePolicy: 'Cookie Policy',
      acceptCookies: 'Accept cookies',
      demoMode: '1-Click Instant Demo (Sara Meng)',
      checkoutNotice: 'Sign in to complete checkout: Your cart items are saved and ready.'
    },
    km: {
      accountTitle: 'គណនី TechTonic',
      agreement: 'កិច្ចព្រមព្រៀងអ្នកប្រើប្រាស់',
      privacy: 'គោលការណ៍ឯកជនភាព',
      needHelp: 'ជំនួយ?',
      selectLang: 'ភាសាខ្មែរ',
      signInTab: 'ចូលគណនី',
      signUpTab: 'ចុះឈ្មោះ',
      inputPlaceholder: 'អ៊ីមែល / លេខទូរស័ព្ទ / TechTonic ID',
      passwordPlaceholder: 'ពាក្យសម្ងាត់',
      namePlaceholder: 'ឈ្មោះពេញ (ឧ. សារ៉ា ម៉េង)',
      emailPlaceholder: 'អាសយដ្ឋានអ៊ីមែល',
      phonePlaceholder: 'លេខទូរស័ព្ទ (ឧ. 012 345 678)',
      setPassPlaceholder: 'កំណត់ពាក្យសម្ងាត់ (យ៉ាងតិច ៦ ខ្ទង់)',
      confirmPassPlaceholder: 'ផ្ទៀងផ្ទាត់ពាក្យសម្ងាត់',
      agreeText: 'ខ្ញុំបានអាន និងយល់ព្រមលើ',
      agreeLink1: 'កិច្ចព្រមព្រៀងអ្នកប្រើប្រាស់',
      and: 'និង',
      agreeLink2: 'គោលការណ៍ឯកជនភាព',
      signInBtn: 'ចូលគណនី',
      signUpBtn: 'បង្កើតគណនី TechTonic',
      forgotPassword: 'ភ្លេចពាក្យសម្ងាត់?',
      moreOptions: 'ជម្រើសផ្សេងទៀត',
      googleBtnSignIn: 'ចូលតាមរយៈ Google',
      googleBtnSignUp: 'ចុះឈ្មោះតាម Google',
      qrTitle: 'ស្កេនដើម្បីចូលគណនី',
      qrDesc: 'ស្កេនជាមួយកម្មវិធី TechTonic App ឬ Bakong KHQR ដើម្បីចូលដោយមិនបាច់ប្រើ Password។',
      qrSwitch: 'ចូលតាមរយៈពាក្យសម្ងាត់',
      cookieText: 'យើងប្រើប្រាស់ Cookies ដើម្បីរក្សាមុខងារសំខាន់ៗនៃគេហទំព័រ និងសុវត្ថិភាព។ ស្វែងយល់បន្ថែមនៅក្នុង',
      cookiePolicy: 'គោលការណ៍ Cookies',
      acceptCookies: 'យល់ព្រម',
      demoMode: 'ចូលគណនីសាកល្បង (Sara Meng)',
      checkoutNotice: 'សូមចូលគណនីដើម្បីបន្តការទូទាត់ប្រាក់៖ ទំនិញក្នុងកន្ត្រករបស់អ្នកត្រូវបានរក្សាទុកយ៉ាងត្រឹមត្រូវ។'
    }
  }[lang];

  // Recalculate indicator position & width whenever activeTab or language changes
  const updateIndicator = () => {
    const targetEl = activeTab === 'signin' ? signInRef.current : signUpRef.current;
    if (targetEl) {
      setIndicatorStyle({
        left: targetEl.offsetLeft,
        width: targetEl.offsetWidth
      });
    }
  };

  useEffect(() => {
    updateIndicator();
    // Safety delay to measure accurately after font/layout stabilizes
    const tId = setTimeout(updateIndicator, 50);
    return () => clearTimeout(tId);
  }, [activeTab, lang]);

  // Tab switcher with animated slide & URL update
  const handleSwitchTab = (newTab) => {
    if (newTab === activeTab) return;
    setGeneralError('');
    setIsQrMode(false);
    setActiveTab(newTab);

    // Update browser URL smoothly without reloading
    const search = location.search ? location.search : '';
    const newPath = newTab === 'signin' ? `/login${search}` : `/register${search}`;
    navigate(newPath, { replace: true });
  };

  // Sign In Handler
  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');

    if (!signInAgreed) {
      setGeneralError(lang === 'km' ? 'សូមយល់ព្រមលើកិច្ចព្រមព្រៀងអ្នកប្រើប្រាស់' : 'Please agree to the User Agreement and Privacy Policy');
      return;
    }
    if (!signInEmail.trim()) {
      setGeneralError(lang === 'km' ? 'សូមបញ្ចូលអ៊ីមែល ឬលេខទូរស័ព្ទ' : 'Please enter your email or phone number');
      return;
    }
    if (!signInPassword.trim()) {
      setGeneralError(lang === 'km' ? 'សូមបញ្ចូលពាក្យសម្ងាត់' : 'Please enter your password');
      return;
    }

    setLoading(true);
    try {
      const res = await login(signInEmail, signInPassword);
      if (res.success) {
        addToast(`Welcome back, ${res.user.name || res.user.fullName || 'Member'}!`, 'success');
        navigate(from, { replace: true });
      } else {
        setGeneralError(res.message || 'Login failed. Please check credentials.');
      }
    } catch (err) {
      setGeneralError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Sign Up Handler
  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    const errs = {};

    if (!signUpAgreed) {
      errs.agreed = lang === 'km' ? 'សូមយល់ព្រមលើកិច្ចព្រមព្រៀង' : 'Please accept User Agreement and Privacy Policy';
    }
    if (!signUpData.name.trim()) {
      errs.name = lang === 'km' ? 'សូមបញ្ចូលឈ្មោះពេញ' : 'Full name is required';
    }
    if (!signUpData.email.trim()) {
      errs.email = lang === 'km' ? 'សូមបញ្ចូលអ៊ីមែល' : 'Email address is required';
    } else if (!validateEmail(signUpData.email)) {
      errs.email = lang === 'km' ? 'អ៊ីមែលមិនត្រឹមត្រូវ' : 'Please enter a valid email address';
    }
    if (!signUpData.phone.trim()) {
      errs.phone = lang === 'km' ? 'សូមបញ្ចូលលេខទូរស័ព្ទ' : 'Phone number is required';
    } else if (!validatePhone(signUpData.phone)) {
      errs.phone = lang === 'km' ? 'លេខទូរស័ព្ទមិនត្រឹមត្រូវ' : 'Enter valid phone number (e.g. 012 345 678)';
    }
    if (!signUpData.password || signUpData.password.length < 6) {
      errs.password = lang === 'km' ? 'ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ៦ ខ្ទង់' : 'Password must be at least 6 characters';
    }
    if (signUpData.password !== signUpData.confirmPassword) {
      errs.confirmPassword = lang === 'km' ? 'ពាក្យសម្ងាត់ទាំងពីរមិនត្រូវគ្នាទេ' : 'Passwords do not match';
    }

    if (Object.keys(errs).length > 0) {
      setSignUpErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const res = await register(signUpData);
      if (res.success) {
        addToast('Account created successfully! Welcome to TechTonic.', 'success');
        navigate(from, { replace: true });
      } else {
        setGeneralError(res.message || 'Registration failed');
      }
    } catch (err) {
      setGeneralError(err.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickCustomer = async () => {
    setLoading(true);
    try {
      await login('sara.meng@techtonic.dev', 'demopass123');
      addToast('Logged in as Customer (Sara Meng)', 'success');
      navigate('/account', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdmin = async () => {
    setLoading(true);
    try {
      await login('admin@techtonic.dev', 'adminpass123');
      addToast('Logged in as Store Admin (Alex Vance)', 'success');
      navigate('/admin', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialMock = async (provider) => {
    addToast(`Signed in with ${provider} (Demo mode)`, 'success');
    await login(`demo.${provider.toLowerCase()}@techtonic.dev`, 'socialpass123');
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-white text-slate-800 font-sans relative selection:bg-orange-500 selection:text-white">
      {/* Toast Notifications */}
      <ToastContainer />

      {/* 1. TOP MINIMAL HEADER (Xiaomi Account / Apple ID Style) */}
      <header className="w-full border-b border-slate-100/90 bg-white/95 backdrop-blur-md sticky top-0 z-30 px-6 sm:px-12 py-3.5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0c1b3a] to-[#050b1d] border border-cyan-500/40 p-1.5 flex items-center justify-center shadow-[0_0_15px_rgba(0,217,255,0.25)] group-hover:scale-105 transition-transform">
            <img
              src="/images/logo/techtonic-icon.png"
              alt="TechTonic Logo"
              className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(0,217,255,0.6)]"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight">
              {t.accountTitle}
            </span>
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider hidden sm:block">
              Official Identity Gateway
            </span>
          </div>
        </Link>

        {/* Minimal Right Utilities */}
        <div className="flex items-center gap-3 sm:gap-6 text-xs text-slate-500 font-medium">
          <Link to="/about" className="hidden md:inline hover:text-[#ff6700] transition-colors">
            {t.agreement}
          </Link>
          <Link to="/about" className="hidden md:inline hover:text-[#ff6700] transition-colors">
            {t.privacy}
          </Link>
          <a
            href="https://t.me"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[#ff6700] transition-colors flex items-center gap-1"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.needHelp}</span>
          </a>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          {/* Language Switcher */}
          <button
            type="button"
            onClick={() => setLang(l => (l === 'en' ? 'km' : 'en'))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <span>{t.selectLang}</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN CONTENT BODY */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12 bg-[#fafafa]">
        {/* UNIFIED CONNECTED CONTAINER (ដាក់ជាប់គ្នា - Attached Together) */}
        <div className="w-full max-w-5xl bg-white rounded-3xl sm:rounded-[32px] border border-slate-200/90 shadow-[0_25px_70px_-15px_rgba(15,23,42,0.12)] overflow-hidden flex flex-col lg:flex-row relative">
          
          {/* LEFT COLUMN: Vertical Art Poster (Cross-fades smoothly between Sign In and Sign Up) */}
          <div className="hidden lg:flex w-[430px] xl:w-[460px] bg-gradient-to-b from-[#0f172a] via-[#1e1b4b] to-[#020617] relative flex-col justify-between p-10 xl:p-12 text-white overflow-hidden shrink-0 select-none">
            <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-orange-500/15 blur-3xl pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

            {/* Poster Header */}
            <div className="relative z-10 transition-all duration-500 ease-out">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-orange-400 text-[11px] font-bold uppercase tracking-wider mb-4">
                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                <span>{activeTab === 'signin' ? 'Next-Gen Hardware Ecosystem' : 'Verified Member Privileges'}</span>
              </div>
              <h2 className="text-2xl xl:text-3xl font-black text-white tracking-tight leading-snug">
                {activeTab === 'signin'
                  ? 'Always believe that something wonderful is about to happen.'
                  : 'Unlock the complete TechTonic hardware ecosystem.'}
              </h2>
              <p className="text-xs text-slate-300/80 mt-2 leading-relaxed">
                {activeTab === 'signin'
                  ? 'Precision acoustics, low-latency esports gear, and verified hardware protection under one unified identity.'
                  : 'Fast 1-click checkout, 1-year local warranty registration, and express courier tracking.'}
              </p>
            </div>

            {/* Poster Centerpiece Hardware Image (Smooth cross-fade) */}
            <div className="relative z-10 my-6 flex flex-col items-center justify-center">
              <div className="relative w-64 h-64 xl:w-72 xl:h-72 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-orange-500/25 via-indigo-500/30 to-cyan-400/20 blur-2xl animate-pulse" />
                <div className="absolute inset-4 rounded-3xl border border-white/20 bg-white/5 backdrop-blur-md shadow-2xl rotate-3" />
                <div className="absolute inset-4 rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent -rotate-3" />

                {/* Animated Image Swap */}
                <img
                  key={activeTab}
                  src={activeTab === 'signin' ? '/images/products/prod-001-main.png' : '/images/products/prod-024-main.png'}
                  alt="TechTonic Hardware"
                  className="relative z-10 w-52 h-52 object-contain drop-shadow-[0_25px_35px_rgba(0,0,0,0.6)] transform hover:scale-105 transition-all duration-500 animate-fadeIn"
                />
              </div>

              <div className="mt-4 flex items-center gap-3 text-xs font-semibold text-slate-300">
                <span>{activeTab === 'signin' ? 'TechTonic ANC Pro' : 'Viper Ultralight 49g'}</span>
                <span className="text-slate-500">&bull;</span>
                <span className="text-orange-400">{activeTab === 'signin' ? 'Hi-Res Certified' : '8000Hz Polling'}</span>
              </div>
            </div>

            {/* Poster Bottom Bar */}
            <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{activeTab === 'signin' ? 'End-to-End Encrypted Access' : 'Official Hardware Protection'}</span>
              </span>
              <span className="text-orange-400 font-semibold">{activeTab === 'signin' ? 'Official Store' : '24M Warranty'}</span>
            </div>
          </div>

          {/* RIGHT AREA: Authentication Form (Directly attached to the left poster) */}
          <div className="flex-1 p-7 sm:p-10 xl:p-12 flex flex-col justify-between bg-white relative">
            
            {/* CORNER QR CODE TOGGLE RIBBON (Iconic Xiaomi Feature) */}
            <div
              onClick={() => setIsQrMode(!isQrMode)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setIsQrMode(!isQrMode)}
              title={isQrMode ? t.qrSwitch : 'Switch to QR code login'}
              className="absolute top-0 right-0 w-16 h-16 cursor-pointer group z-20"
            >
              <div className="absolute top-0 right-0 w-0 h-0 border-t-[64px] border-t-orange-100 group-hover:border-t-orange-200 border-l-[64px] border-l-transparent transition-colors" />
              <div className="absolute top-2 right-2 text-[#ff6700] group-hover:scale-110 transition-transform">
                {isQrMode ? <Laptop className="w-5 h-5" /> : <QrCode className="w-5 h-5" />}
              </div>
            </div>

            {/* If in QR Code Mode */}
            {isQrMode ? (
              <div className="py-6 flex flex-col items-center text-center animate-fadeIn">
                <h2 className="text-2xl font-black text-slate-900 mb-1">{t.qrTitle}</h2>
                <p className="text-xs text-slate-500 max-w-xs mb-6 leading-relaxed">{t.qrDesc}</p>

                <div className="relative p-4 rounded-2xl bg-white border-2 border-orange-200 shadow-md">
                  <div className="w-52 h-52 bg-slate-900 rounded-xl p-3 flex flex-col items-center justify-between relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(#ff6700_2px,transparent_2px)] [background-size:12px_12px] opacity-40" />
                    
                    <div className="w-full flex justify-between relative z-10">
                      <div className="w-10 h-10 border-4 border-white rounded-lg flex items-center justify-center">
                        <div className="w-4 h-4 bg-orange-500 rounded-xs" />
                      </div>
                      <div className="w-10 h-10 border-4 border-white rounded-lg flex items-center justify-center">
                        <div className="w-4 h-4 bg-orange-500 rounded-xs" />
                      </div>
                    </div>

                    <div className="w-12 h-12 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black text-sm shadow-lg border-2 border-white relative z-20">
                      TT
                    </div>

                    <div className="w-full flex justify-between relative z-10">
                      <div className="w-10 h-10 border-4 border-white rounded-lg flex items-center justify-center">
                        <div className="w-4 h-4 bg-orange-500 rounded-xs" />
                      </div>
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-[9px] text-white font-mono">
                        KHQR
                      </div>
                    </div>

                    <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange-400 to-transparent animate-bounce opacity-80" />
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 mt-5">Scan code with Camera, Bakong, or TechTonic App</p>

                <button
                  type="button"
                  onClick={() => setIsQrMode(false)}
                  className="mt-4 text-xs font-bold text-[#ff6700] hover:underline cursor-pointer"
                >
                  &larr; {t.qrSwitch}
                </button>
              </div>
            ) : (
              <div>
                {/* ANIMATED SLIDING TABS */}
                <div className="relative mb-7 border-b border-slate-100 flex items-center gap-8 select-none">
                  {/* Sign In Tab Button */}
                  <button
                    ref={signInRef}
                    type="button"
                    onClick={() => handleSwitchTab('signin')}
                    className={`text-xl sm:text-2xl pb-3 transition-colors duration-300 font-black cursor-pointer ${
                      activeTab === 'signin' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <span>{t.signInTab}</span>
                  </button>

                  {/* Sign Up Tab Button */}
                  <button
                    ref={signUpRef}
                    type="button"
                    onClick={() => handleSwitchTab('signup')}
                    className={`text-xl sm:text-2xl pb-3 transition-colors duration-300 font-black cursor-pointer ${
                      activeTab === 'signup' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <span>{t.signUpTab}</span>
                  </button>

                  {/* SMOOTH SLIDING ORANGE INDICATOR (Glides horizontally with animation) */}
                  <span
                    className="absolute bottom-0 h-[3.5px] bg-[#ff6700] rounded-full pointer-events-none"
                    style={{
                      left: `${indicatorStyle.left}px`,
                      width: `${indicatorStyle.width}px`,
                      transition: 'left 320ms cubic-bezier(0.4, 0, 0.2, 1), width 320ms cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  />
                </div>

                {/* Checkout Security Notification Pill */}
                {redirectQuery === '/checkout' && (
                  <div className="mb-5 p-3.5 rounded-2xl bg-orange-50 border border-orange-200/90 flex items-start gap-3 shadow-2xs animate-fadeIn">
                    <div className="w-7 h-7 rounded-lg bg-[#ff6700] text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-xs font-medium text-orange-950">
                      {t.checkoutNotice}
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {generalError && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-bold flex items-center gap-2 animate-fadeIn">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    <span>{generalError}</span>
                  </div>
                )}

                {/* ANIMATED FORM CONTENT TRANSITION */}
                <div className="relative overflow-hidden">
                  {activeTab === 'signin' ? (
                    /* ==================== SIGN IN FORM ==================== */
                    <form
                      key="signin-form"
                      onSubmit={handleSignInSubmit}
                      className="space-y-4 animate-fadeIn"
                    >
                      <div>
                        <input
                          type="text"
                          value={signInEmail}
                          onChange={(e) => setSignInEmail(e.target.value)}
                          placeholder={t.inputPlaceholder}
                          className="w-full h-12 px-4 rounded-xl bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-[#ff6700] focus:ring-4 focus:ring-orange-500/10 text-sm text-slate-900 placeholder:text-slate-400 transition-all outline-hidden font-medium"
                        />
                      </div>

                      <div className="relative">
                        <input
                          type={showSignInPassword ? 'text' : 'password'}
                          value={signInPassword}
                          onChange={(e) => setSignInPassword(e.target.value)}
                          placeholder={t.passwordPlaceholder}
                          className="w-full h-12 pl-4 pr-11 rounded-xl bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-[#ff6700] focus:ring-4 focus:ring-orange-500/10 text-sm text-slate-900 placeholder:text-slate-400 transition-all outline-hidden font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignInPassword(!showSignInPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                          aria-label="Toggle password visibility"
                        >
                          {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      <div className="flex items-start gap-2.5 pt-1 text-xs text-slate-500 leading-snug">
                        <input
                          id="signin-agreement"
                          type="checkbox"
                          checked={signInAgreed}
                          onChange={(e) => setSignInAgreed(e.target.checked)}
                          className="w-4 h-4 mt-0.5 rounded border-slate-300 text-[#ff6700] focus:ring-[#ff6700] cursor-pointer"
                        />
                        <label htmlFor="signin-agreement" className="cursor-pointer select-none">
                          <span>{t.agreeText} </span>
                          <Link to="/about" className="text-slate-800 font-bold hover:underline">
                            {t.agreeLink1}
                          </Link>{' '}
                          <span>{t.and} </span>
                          <Link to="/about" className="text-slate-800 font-bold hover:underline">
                            {t.agreeLink2}
                          </Link>
                        </label>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 rounded-xl bg-[#ff6700] hover:bg-[#f05e00] active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                      >
                        {loading ? (
                          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <span>{t.signInBtn}</span>
                        )}
                      </button>

                      <div className="pt-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="h-[1px] flex-1 bg-slate-100" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Instant Demo Access</span>
                          <span className="h-[1px] flex-1 bg-slate-100" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            id="login-demo-customer-btn"
                            onClick={handleQuickCustomer}
                            className="py-2.5 px-2 rounded-xl bg-sky-50 hover:bg-sky-100/90 border border-sky-200/80 text-[11px] font-bold text-sky-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                            title="Log in as customer Sara Meng to view Customer Account"
                          >
                            <User className="w-3.5 h-3.5 text-sky-600" />
                            <span>Customer View</span>
                          </button>

                          <button
                            type="button"
                            id="login-demo-admin-btn"
                            onClick={handleQuickAdmin}
                            className="py-2.5 px-2 rounded-xl bg-purple-50 hover:bg-purple-100/90 border border-purple-200/80 text-[11px] font-bold text-purple-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                            title="Log in as store admin to view Admin Dashboard"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                            <span>Admin View</span>
                          </button>
                        </div>
                      </div>

                      <div className="text-center pt-1">
                        <Link
                          to="/about"
                          className="text-xs font-medium text-slate-500 hover:text-[#ff6700] transition-colors"
                        >
                          {t.forgotPassword}
                        </Link>
                      </div>
                    </form>
                  ) : (
                    /* ==================== SIGN UP FORM ==================== */
                    <form
                      key="signup-form"
                      onSubmit={handleSignUpSubmit}
                      className="space-y-3.5 animate-fadeIn"
                    >
                      <div>
                        <input
                          type="text"
                          value={signUpData.name}
                          onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })}
                          placeholder={t.namePlaceholder}
                          className={`w-full h-11 px-4 rounded-xl bg-slate-100/80 hover:bg-slate-100 focus:bg-white border text-sm text-slate-900 placeholder:text-slate-400 transition-all outline-hidden font-medium ${
                            signUpErrors.name ? 'border-rose-400 focus:border-rose-500' : 'border-transparent focus:border-[#ff6700] focus:ring-4 focus:ring-orange-500/10'
                          }`}
                        />
                        {signUpErrors.name && <span className="text-[11px] text-rose-600 font-medium pl-1 mt-0.5 block">{signUpErrors.name}</span>}
                      </div>

                      <div>
                        <input
                          type="email"
                          value={signUpData.email}
                          onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                          placeholder={t.emailPlaceholder}
                          className={`w-full h-11 px-4 rounded-xl bg-slate-100/80 hover:bg-slate-100 focus:bg-white border text-sm text-slate-900 placeholder:text-slate-400 transition-all outline-hidden font-medium ${
                            signUpErrors.email ? 'border-rose-400 focus:border-rose-500' : 'border-transparent focus:border-[#ff6700] focus:ring-4 focus:ring-orange-500/10'
                          }`}
                        />
                        {signUpErrors.email && <span className="text-[11px] text-rose-600 font-medium pl-1 mt-0.5 block">{signUpErrors.email}</span>}
                      </div>

                      <div>
                        <input
                          type="text"
                          value={signUpData.phone}
                          onChange={(e) => setSignUpData({ ...signUpData, phone: e.target.value })}
                          placeholder={t.phonePlaceholder}
                          className={`w-full h-11 px-4 rounded-xl bg-slate-100/80 hover:bg-slate-100 focus:bg-white border text-sm text-slate-900 placeholder:text-slate-400 transition-all outline-hidden font-medium ${
                            signUpErrors.phone ? 'border-rose-400 focus:border-rose-500' : 'border-transparent focus:border-[#ff6700] focus:ring-4 focus:ring-orange-500/10'
                          }`}
                        />
                        {signUpErrors.phone && <span className="text-[11px] text-rose-600 font-medium pl-1 mt-0.5 block">{signUpErrors.phone}</span>}
                      </div>

                      <div className="relative">
                        <input
                          type={showSignUpPassword ? 'text' : 'password'}
                          value={signUpData.password}
                          onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                          placeholder={t.setPassPlaceholder}
                          className={`w-full h-11 pl-4 pr-11 rounded-xl bg-slate-100/80 hover:bg-slate-100 focus:bg-white border text-sm text-slate-900 placeholder:text-slate-400 transition-all outline-hidden font-medium ${
                            signUpErrors.password ? 'border-rose-400 focus:border-rose-500' : 'border-transparent focus:border-[#ff6700] focus:ring-4 focus:ring-orange-500/10'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                          aria-label="Toggle password visibility"
                        >
                          {showSignUpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        {signUpErrors.password && <span className="text-[11px] text-rose-600 font-medium pl-1 mt-0.5 block">{signUpErrors.password}</span>}
                      </div>

                      <div className="relative">
                        <input
                          type={showSignUpConfirmPassword ? 'text' : 'password'}
                          value={signUpData.confirmPassword}
                          onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                          placeholder={t.confirmPassPlaceholder}
                          className={`w-full h-11 pl-4 pr-11 rounded-xl bg-slate-100/80 hover:bg-slate-100 focus:bg-white border text-sm text-slate-900 placeholder:text-slate-400 transition-all outline-hidden font-medium ${
                            signUpErrors.confirmPassword ? 'border-rose-400 focus:border-rose-500' : 'border-transparent focus:border-[#ff6700] focus:ring-4 focus:ring-orange-500/10'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignUpConfirmPassword(!showSignUpConfirmPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                          aria-label="Toggle confirm password visibility"
                        >
                          {showSignUpConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        {signUpErrors.confirmPassword && <span className="text-[11px] text-rose-600 font-medium pl-1 mt-0.5 block">{signUpErrors.confirmPassword}</span>}
                      </div>

                      <div className="flex items-start gap-2.5 pt-1 text-xs text-slate-500 leading-snug">
                        <input
                          id="signup-agreement"
                          type="checkbox"
                          checked={signUpAgreed}
                          onChange={(e) => setSignUpAgreed(e.target.checked)}
                          className="w-4 h-4 mt-0.5 rounded border-slate-300 text-[#ff6700] focus:ring-[#ff6700] cursor-pointer"
                        />
                        <label htmlFor="signup-agreement" className="cursor-pointer select-none">
                          <span>{t.agreeText} </span>
                          <Link to="/about" className="text-slate-800 font-bold hover:underline">
                            {t.agreeLink1}
                          </Link>{' '}
                          <span>{t.and} </span>
                          <Link to="/about" className="text-slate-800 font-bold hover:underline">
                            {t.agreeLink2}
                          </Link>
                        </label>
                      </div>
                      {signUpErrors.agreed && <span className="text-[11px] text-rose-600 font-medium pl-1 block">{signUpErrors.agreed}</span>}

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 rounded-xl bg-[#ff6700] hover:bg-[#f05e00] active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                      >
                        {loading ? (
                          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <span>{t.signUpBtn}</span>
                        )}
                      </button>
                    </form>
                  )}
                </div>

                {/* More Options Divider */}
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-100" />
                  </div>
                  <div className="relative flex justify-center text-[11px] uppercase tracking-wider text-slate-400">
                    <span className="bg-white px-3">{t.moreOptions}</span>
                  </div>
                </div>

                {/* Google Button */}
                <button
                  type="button"
                  onClick={() => handleSocialMock('Google')}
                  className="w-full h-11 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-center gap-3 text-xs font-bold text-slate-700 transition-all shadow-2xs cursor-pointer mb-3"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{activeTab === 'signin' ? t.googleBtnSignIn : t.googleBtnSignUp}</span>
                </button>

                {/* Additional Social Circular Icons */}
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleSocialMock('Facebook')}
                    className="w-10 h-10 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:opacity-90 transition-opacity shadow-xs cursor-pointer"
                    title="Sign in with Facebook"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSocialMock('Apple')}
                    className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center hover:opacity-85 transition-opacity shadow-xs cursor-pointer"
                    title="Sign in with Apple"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.63-.77 1.06-1.85.94-2.93-.93.04-2.03.62-2.69 1.39-.58.67-1.1 1.76-.96 2.81 1.03.08 2.08-.5 2.71-1.27z" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSocialMock('GitHub')}
                    className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-black transition-colors shadow-xs cursor-pointer"
                    title="Sign in with GitHub"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 3. BOTTOM MINIMAL FOOTER */}
      <footer className="w-full py-4 px-6 border-t border-slate-100 bg-white text-center text-xs text-slate-400">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mb-1">
          <Link to="/about" className="hover:text-slate-600 transition-colors">
            {t.agreement}
          </Link>
          <span>|</span>
          <Link to="/about" className="hover:text-slate-600 transition-colors">
            {t.privacy}
          </Link>
          <span>|</span>
          <Link to="/about" className="hover:text-slate-600 transition-colors">
            {t.cookiePolicy}
          </Link>
          <span>|</span>
          <a href="https://t.me" target="_blank" rel="noreferrer" className="hover:text-slate-600 transition-colors">
            {t.needHelp}
          </a>
        </div>
        <div>
          TechTonic Account © 2026 TechTonic Inc. All rights reserved.
        </div>
      </footer>

      {/* 4. COOKIE NOTICE BAR */}
      {showCookieNotice && (
        <div className="w-full bg-[#f4f4f5] border-t border-slate-200/90 py-2.5 px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 z-40">
          <div className="text-center sm:text-left">
            <span>{t.cookieText} </span>
            <Link to="/about" className="text-[#ff6700] hover:underline font-semibold">
              {t.cookiePolicy}
            </Link>
            .
          </div>
          <button
            type="button"
            onClick={() => setShowCookieNotice(false)}
            className="px-4 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-2xs transition-colors shrink-0 cursor-pointer"
          >
            {t.acceptCookies}
          </button>
        </div>
      )}
    </div>
  );
}
