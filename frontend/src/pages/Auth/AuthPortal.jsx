import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth, useToast, useLanguage } from '../../store/StoreContext';
import { ToastContainer } from '../../components/common/Toast';
import { validateEmail, validatePhone } from '../../utils/validation';

export default function AuthPortal({ defaultMode = 'signin' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();
  const { addToast } = useToast();
  const { language, setLanguage, t } = useLanguage();

  // Mode: 'signin' | 'signup'
  const [activeTab, setActiveTab] = useState(defaultMode);

  // Sync mode with route changes
  useEffect(() => {
    if (location.pathname.includes('/register')) {
      setActiveTab('signup');
    } else if (location.pathname.includes('/login')) {
      setActiveTab('signin');
    }
  }, [location.pathname]);

  // Common UI State
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  // Sign In Form State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

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

  // Tab switcher with smooth navigation
  const handleSwitchTab = (newTab) => {
    if (newTab === activeTab) return;
    setGeneralError('');
    setSignUpErrors({});
    setActiveTab(newTab);

    const search = location.search ? location.search : '';
    const newPath = newTab === 'signin' ? `/login${search}` : `/register${search}`;
    navigate(newPath, { replace: true });
  };

  // Sign In Handler
  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');

    if (!signInEmail.trim()) {
      setGeneralError(language === 'kh' ? 'សូមបញ្ចូលអ៊ីមែល ឬលេខទូរស័ព្ទ' : 'Please enter your email or phone number');
      return;
    }
    if (!signInPassword.trim()) {
      setGeneralError(language === 'kh' ? 'សូមបញ្ចូលពាក្យសម្ងាត់' : 'Please enter your password');
      return;
    }

    setLoading(true);
    try {
      const res = await login(signInEmail, signInPassword);
      if (res.success) {
        addToast(
          language === 'kh'
            ? `សូមស្វាគមន៍ការត្រឡប់មកវិញ, ${res.user.name || res.user.fullName || 'សមាជិក'}!`
            : `Welcome back, ${res.user.name || res.user.fullName || 'Member'}!`,
          'success'
        );
        navigate(from, { replace: true });
      } else {
        setGeneralError(res.message || (language === 'kh' ? 'ការចូលមិនត្រឹមត្រូវ សូមពិនិត្យឡើងវិញ' : 'Login failed. Please check credentials.'));
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
      errs.agreed = language === 'kh' ? 'សូមយល់ព្រមលើលក្ខខណ្ឌប្រើប្រាស់' : 'Please accept the Terms of Service and Privacy Policy';
    }
    if (!signUpData.name.trim()) {
      errs.name = language === 'kh' ? 'សូមបញ្ចូលឈ្មោះពេញរបស់អ្នក' : 'Full name is required';
    }
    if (!signUpData.email.trim()) {
      errs.email = language === 'kh' ? 'សូមបញ្ចូលអាសយដ្ឋានអ៊ីមែល' : 'Email address is required';
    } else if (!validateEmail(signUpData.email)) {
      errs.email = language === 'kh' ? 'ទម្រង់អ៊ីមែលមិនត្រឹមត្រូវ' : 'Please enter a valid email address';
    }
    if (!signUpData.phone.trim()) {
      errs.phone = language === 'kh' ? 'សូមបញ្ចូលលេខទូរស័ព្ទ' : 'Phone number is required';
    } else if (!validatePhone(signUpData.phone)) {
      errs.phone = language === 'kh' ? 'លេខទូរស័ព្ទមិនត្រឹមត្រូវ (ឧ. 012 345 678)' : 'Enter valid phone number (e.g. 012 345 678)';
    }
    if (!signUpData.password || signUpData.password.length < 6) {
      errs.password = language === 'kh' ? 'ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ៦ ខ្ទង់' : 'Password must be at least 6 characters';
    }
    if (signUpData.password !== signUpData.confirmPassword) {
      errs.confirmPassword = language === 'kh' ? 'ពាក្យសម្ងាត់ទាំងពីរមិនត្រូវគ្នាទេ' : 'Passwords do not match';
    }

    if (Object.keys(errs).length > 0) {
      setSignUpErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const res = await register(signUpData);
      if (res.success) {
        addToast(
          language === 'kh' ? 'បានបង្កើតគណនីដោយជោគជ័យ! សូមស្វាគមន៍មកកាន់ TechTonic' : 'Account created successfully! Welcome to TechTonic.',
          'success'
        );
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
      addToast(language === 'kh' ? 'បានចូលជាអតិថិជន (Sara Meng)' : 'Logged in as Customer (Sara Meng)', 'success');
      navigate('/account', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdmin = async () => {
    setLoading(true);
    try {
      await login('admin@techtonic.dev', 'adminpass123');
      addToast(language === 'kh' ? 'បានចូលជាអ្នកគ្រប់គ្រងហាង (Admin)' : 'Logged in as Store Admin', 'success');
      navigate('/admin', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialMock = async (provider) => {
    setLoading(true);
    try {
      addToast(
        language === 'kh' ? `បានចូលគណនីតាម ${provider} (Demo mode)` : `Signed in with ${provider} (Demo mode)`,
        'success'
      );
      await login(`demo.${provider.toLowerCase()}@techtonic.dev`, 'socialpass123');
      navigate(from, { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-800 font-sans selection:bg-blue-600 selection:text-white">
      <ToastContainer />

      {/* 1. TOP MINIMAL BRAND HEADER */}
      <header className="w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 lg:px-12 py-3.5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0c1b3a] to-[#050b1d] border border-blue-500/30 p-1.5 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <img
              src="/images/logo/techtonic-icon.png"
              alt="TechTonic Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none">
              TechTonic
            </span>
            <span className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase mt-0.5">
              Store Account
            </span>
          </div>
        </Link>

        {/* Header Right: Language Switcher & Home Link */}
        <div className="flex items-center gap-3 sm:gap-5">
          <Link
            to="/shop"
            className="text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors hidden sm:inline"
          >
            {language === 'kh' ? 'ត្រឡប់ទៅហាង' : 'Continue Shopping'}
          </Link>

          {/* Compact Language Toggle */}
          <button
            type="button"
            onClick={() => setLanguage(language === 'en' ? 'kh' : 'en')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-bold text-xs transition-colors cursor-pointer border border-slate-200"
            title="Toggle Language"
          >
            <span>{language === 'kh' ? '🇰🇭 ភាសាខ្មែរ' : '🇺🇸 EN'}</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN AUTHENTICATION CONTAINER */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="w-full max-w-4xl bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl shadow-slate-900/5 overflow-hidden flex flex-col lg:flex-row">
          
          {/* LEFT COLUMN: Editorial Product Spotlight (Desktop only) */}
          <div className="hidden lg:flex w-[400px] xl:w-[420px] bg-[#020516] relative flex-col justify-between p-10 text-white shrink-0 select-none overflow-hidden border-r border-slate-800">
            {/* Ambient Background Aura */}
            <div className="absolute top-1/3 -left-20 w-72 h-72 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 -right-20 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

            {/* Showcase Header */}
            <div className="relative z-10">
              <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider mb-2">
                TechTonic Flagship Hardware
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight leading-snug">
                {activeTab === 'signin'
                  ? (language === 'kh' ? 'ស្វាគមន៍ការត្រឡប់មកវិញ' : 'Engineered for Performance.')
                  : (language === 'kh' ? 'ចូលរួមជាមួយ TechTonic' : 'Elevate Your Digital Setup.')}
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                {activeTab === 'signin'
                  ? (language === 'kh'
                    ? 'ចូលគណនីដើម្បីគ្រប់គ្រងការបញ្ជាទិញ ធានាផលិតផល និងតាមដានការដឹកជញ្ជូនរហ័ស។'
                    : 'Access your hardware orders, registered warranties, and express delivery tracking.')
                  : (language === 'kh'
                    ? 'បង្កើតគណនីតែមួយដើម្បីទិញទំនិញបច្ចេកវិទ្យាគុណភាពខ្ពស់ ធានាផ្លូវការ ១ ឆ្នាំពេញ។'
                    : 'Join thousands of developers, creators, and athletes across Cambodia.')}
              </p>
            </div>

            {/* Showcase Center Product Visual */}
            <div className="relative z-10 my-8 flex flex-col items-center justify-center">
              <div className="relative w-56 h-56 flex items-center justify-center">
                <img
                  key={activeTab}
                  src={activeTab === 'signin' ? '/images/products/prod-001-main.png' : '/images/products/prod-012-main.png'}
                  alt="TechTonic Hardware"
                  className="w-48 h-48 object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.7)] transform hover:scale-105 transition-transform duration-500"
                />
              </div>

              <div className="mt-3 text-center">
                <div className="text-xs font-bold text-slate-200">
                  {activeTab === 'signin' ? 'TechTonic ANC Pro Beryllium' : 'TechTonic Pulse Ultra Titanium'}
                </div>
                <div className="text-[11px] text-blue-400 font-semibold mt-0.5">
                  {activeTab === 'signin' ? 'Studio Reference Acoustics' : 'Aerospace Grade Unibody'}
                </div>
              </div>
            </div>

            {/* Authentic Store Value Points */}
            <div className="relative z-10 pt-4 border-t border-slate-800/80 space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <Truck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>{language === 'kh' ? 'ដឹកជញ្ជូនរហ័សក្នុងភ្នំពេញ (Express 3-Hour)' : 'Express 3-Hour delivery in Phnom Penh'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{language === 'kh' ? 'ធានាផ្លូវការ ១ ឆ្នាំពេញ (Official Warranty)' : '1-Year official manufacturer warranty'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <RotateCcw className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>{language === 'kh' ? 'ប្តូរទំនិញថ្មីក្នុង ៧ ថ្ងៃ ប្រសិនបើមានបញ្ហា' : '7-Day replacement guarantee'}</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Clean Authentication Form */}
          <div className="flex-1 p-6 sm:p-10 xl:p-12 flex flex-col justify-between bg-white">
            <div>
              {/* Segmented Tab Switcher */}
              <div className="p-1 rounded-xl bg-slate-100 flex items-center mb-6 max-w-sm">
                <button
                  type="button"
                  onClick={() => handleSwitchTab('signin')}
                  className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'signin'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {language === 'kh' ? 'ចូលគណនី' : 'Sign In'}
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchTab('signup')}
                  className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'signup'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {language === 'kh' ? 'បង្កើតគណនី' : 'Create Account'}
                </button>
              </div>

              {/* Form Title & Subtitle */}
              <div className="mb-6">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {activeTab === 'signin'
                    ? (language === 'kh' ? 'ចូលប្រើប្រាស់គណនីរបស់អ្នក' : 'Welcome back')
                    : (language === 'kh' ? 'បង្កើតគណនី TechTonic ថ្មី' : 'Create an account')}
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  {activeTab === 'signin'
                    ? (language === 'kh' ? 'សូមបញ្ចូលអ៊ីមែល ឬលេខទូរស័ព្ទរបស់អ្នកដើម្បីបន្ត។' : 'Enter your credentials to access your orders and account.')
                    : (language === 'kh' ? 'ចំណាយពេលត្រឹម ១ នាទីដើម្បីទទួលបានអត្ថប្រយោជន៍ពេញលេញ។' : 'Enter your details below to get started.')}
                </p>
              </div>

              {/* Redirect Notice for Checkout */}
              {redirectQuery === '/checkout' && (
                <div className="mb-5 p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-2.5 text-xs text-blue-900 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    {language === 'kh'
                      ? 'សូមចូលគណនីដើម្បីបន្តការទូទាត់ប្រាក់៖ ទំនិញរបស់អ្នកត្រូវបានរក្សាទុកជាស្រេច។'
                      : 'Sign in to complete checkout: Your cart items are saved.'}
                  </span>
                </div>
              )}

              {/* General Error Alert */}
              {generalError && (
                <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs text-rose-700 font-semibold">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{generalError}</span>
                </div>
              )}

              {/* ================================================= */}
              {/* SIGN IN FORM */}
              {/* ================================================= */}
              {activeTab === 'signin' ? (
                <form onSubmit={handleSignInSubmit} className="space-y-4">
                  {/* Email / Identifier */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {language === 'kh' ? 'អ៊ីមែល ឬលេខទូរស័ព្ទ' : 'Email or Phone Number'}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        placeholder={language === 'kh' ? 'sara.meng@techtonic.dev ឬ 012 345 678' : 'you@example.com or phone'}
                        className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 text-sm text-slate-900 placeholder:text-slate-400 transition-all outline-hidden font-medium"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        {language === 'kh' ? 'ពាក្យសម្ងាត់' : 'Password'}
                      </label>
                      <button
                        type="button"
                        onClick={() => addToast(language === 'kh' ? 'តំណភ្ជាប់កំណត់ឡើងវិញត្រូវបានផ្ញើ' : 'Password reset link sent to your email', 'info')}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        {language === 'kh' ? 'ភ្លេចពាក្យសម្ងាត់?' : 'Forgot password?'}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showSignInPassword ? 'text' : 'password'}
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-11 pl-10 pr-11 rounded-xl bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 text-sm text-slate-900 placeholder:text-slate-400 transition-all outline-hidden font-medium"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <button
                        type="button"
                        onClick={() => setShowSignInPassword(!showSignInPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                        aria-label="Toggle password visibility"
                      >
                        {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me Checkbox */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <input
                      id="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="remember-me" className="text-xs text-slate-600 font-medium cursor-pointer select-none">
                      {language === 'kh' ? 'ចងចាំខ្ញុំលើឧបករណ៍នេះ' : 'Remember me on this device'}
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 sm:h-12 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-70"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>{language === 'kh' ? 'ចូលគណនី' : 'Sign In'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* ================================================= */
                /* SIGN UP FORM */
                /* ================================================= */
                <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {language === 'kh' ? 'ឈ្មោះពេញ' : 'Full Name'}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={signUpData.name}
                        onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })}
                        placeholder={language === 'kh' ? 'ឧ. សារ៉ា ម៉េង' : 'e.g. Sara Meng'}
                        className={`w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50 hover:bg-slate-100/70 focus:bg-white border text-sm text-slate-900 placeholder:text-slate-400 transition-all outline-hidden font-medium ${
                          signUpErrors.name ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10'
                        }`}
                      />
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    {signUpErrors.name && <span className="text-[11px] text-rose-600 font-medium pl-1 mt-0.5 block">{signUpErrors.name}</span>}
                  </div>

                  {/* Email & Phone side by side */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {language === 'kh' ? 'អ៊ីមែល' : 'Email Address'}
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          value={signUpData.email}
                          onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                          placeholder="you@domain.com"
                          className={`w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50 hover:bg-slate-100/70 focus:bg-white border text-sm text-slate-900 placeholder:text-slate-400 transition-all outline-hidden font-medium ${
                            signUpErrors.email ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10'
                          }`}
                        />
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                      {signUpErrors.email && <span className="text-[11px] text-rose-600 font-medium pl-1 mt-0.5 block">{signUpErrors.email}</span>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {language === 'kh' ? 'លេខទូរស័ព្ទ' : 'Phone Number'}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={signUpData.phone}
                          onChange={(e) => setSignUpData({ ...signUpData, phone: e.target.value })}
                          placeholder="012 345 678"
                          className={`w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50 hover:bg-slate-100/70 focus:bg-white border text-sm text-slate-900 placeholder:text-slate-400 transition-all outline-hidden font-medium ${
                            signUpErrors.phone ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10'
                          }`}
                        />
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                      {signUpErrors.phone && <span className="text-[11px] text-rose-600 font-medium pl-1 mt-0.5 block">{signUpErrors.phone}</span>}
                    </div>
                  </div>

                  {/* Password & Confirm Password side by side */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {language === 'kh' ? 'ពាក្យសម្ងាត់' : 'Password'}
                      </label>
                      <div className="relative">
                        <input
                          type={showSignUpPassword ? 'text' : 'password'}
                          value={signUpData.password}
                          onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                          placeholder="min 6 chars"
                          className={`w-full h-10 pl-9 pr-9 rounded-xl bg-slate-50 hover:bg-slate-100/70 focus:bg-white border text-sm text-slate-900 placeholder:text-slate-400 transition-all outline-hidden font-medium ${
                            signUpErrors.password ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10'
                          }`}
                        />
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <button
                          type="button"
                          onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                        >
                          {showSignUpPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      {signUpErrors.password && <span className="text-[11px] text-rose-600 font-medium pl-1 mt-0.5 block">{signUpErrors.password}</span>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {language === 'kh' ? 'ផ្ទៀងផ្ទាត់ពាក្យសម្ងាត់' : 'Confirm Password'}
                      </label>
                      <div className="relative">
                        <input
                          type={showSignUpConfirmPassword ? 'text' : 'password'}
                          value={signUpData.confirmPassword}
                          onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                          placeholder="repeat password"
                          className={`w-full h-10 pl-9 pr-9 rounded-xl bg-slate-50 hover:bg-slate-100/70 focus:bg-white border text-sm text-slate-900 placeholder:text-slate-400 transition-all outline-hidden font-medium ${
                            signUpErrors.confirmPassword ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10'
                          }`}
                        />
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <button
                          type="button"
                          onClick={() => setShowSignUpConfirmPassword(!showSignUpConfirmPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                        >
                          {showSignUpConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      {signUpErrors.confirmPassword && <span className="text-[11px] text-rose-600 font-medium pl-1 mt-0.5 block">{signUpErrors.confirmPassword}</span>}
                    </div>
                  </div>

                  {/* Terms agreement */}
                  <div className="flex items-start gap-2 pt-1 text-xs text-slate-500 leading-snug">
                    <input
                      id="signup-agreed"
                      type="checkbox"
                      checked={signUpAgreed}
                      onChange={(e) => setSignUpAgreed(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="signup-agreed" className="cursor-pointer select-none">
                      <span>{language === 'kh' ? 'ខ្ញុំយល់ព្រមលើ ' : 'I agree to the '}</span>
                      <Link to="/about" className="text-slate-800 font-bold hover:underline">
                        {language === 'kh' ? 'លក្ខខណ្ឌប្រើប្រាស់' : 'Terms of Service'}
                      </Link>{' '}
                      <span>{language === 'kh' ? 'និង ' : 'and '}</span>
                      <Link to="/about" className="text-slate-800 font-bold hover:underline">
                        {language === 'kh' ? 'គោលការណ៍ឯកជនភាព' : 'Privacy Policy'}
                      </Link>
                    </label>
                  </div>
                  {signUpErrors.agreed && <span className="text-[11px] text-rose-600 font-medium pl-1 block">{signUpErrors.agreed}</span>}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 sm:h-12 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-70"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>{language === 'kh' ? 'បង្កើតគណនីថ្មី' : 'Create Account'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Social Login Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-[11px] uppercase tracking-wider text-slate-400">
                  <span className="bg-white px-3 font-semibold">
                    {language === 'kh' ? 'ឬចូលតាមរយៈ' : 'Or continue with'}
                  </span>
                </div>
              </div>

              {/* Real Social Options (Google & Apple) */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleSocialMock('Google')}
                  className="h-10 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-center gap-2.5 text-xs font-bold text-slate-700 transition-colors shadow-2xs cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialMock('Apple')}
                  className="h-10 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-center gap-2 text-xs font-bold text-slate-700 transition-colors shadow-2xs cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.63-.77 1.06-1.85.94-2.93-.93.04-2.03.62-2.69 1.39-.58.67-1.1 1.76-.96 2.81 1.03.08 2.08-.5 2.71-1.27z" />
                  </svg>
                  <span>Apple</span>
                </button>
              </div>
            </div>

            {/* Quick Demo Accounts Bar */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-slate-400 font-medium">
                {language === 'kh' ? 'ចូលសាកល្បងរហ័ស:' : 'Quick Demo Login:'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="login-demo-customer-btn"
                  onClick={handleQuickCustomer}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                  title="Login as customer Sara Meng"
                >
                  {language === 'kh' ? '👤 អតិថិជន (Sara)' : '👤 Customer (Sara)'}
                </button>
                <button
                  type="button"
                  id="login-demo-admin-btn"
                  onClick={handleQuickAdmin}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                  title="Login as store admin"
                >
                  {language === 'kh' ? '⚡ Admin' : '⚡ Admin'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 3. SUBTLE AUTH FOOTER */}
      <footer className="w-full py-4 px-6 border-t border-slate-200/70 bg-white text-center text-xs text-slate-400">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mb-1">
          <Link to="/about" className="hover:text-slate-600 transition-colors">
            {language === 'kh' ? 'អំពី TechTonic' : 'About TechTonic'}
          </Link>
          <span>•</span>
          <Link to="/about" className="hover:text-slate-600 transition-colors">
            {language === 'kh' ? 'លក្ខខណ្ឌ' : 'Terms'}
          </Link>
          <span>•</span>
          <Link to="/about" className="hover:text-slate-600 transition-colors">
            {language === 'kh' ? 'ឯកជនភាព' : 'Privacy'}
          </Link>
          <span>•</span>
          <a
            href="https://t.me"
            target="_blank"
            rel="noreferrer"
            className="hover:text-slate-600 transition-colors"
          >
            {language === 'kh' ? 'ជំនួយ' : 'Support'}
          </a>
        </div>
        <div>
          © 2026 TechTonic Electronics Inc. Phnom Penh, Cambodia.
        </div>
      </footer>
    </div>
  );
}
