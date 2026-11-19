import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth, useToast, useLanguage } from '../../store/StoreContext';
import { ToastContainer } from '../../components/common/Toast';
import { validateRegistrationGmail, evaluatePasswordStrength } from '../../utils/validation';
import { sanitizeInternalRedirect } from '../../utils/urlSecurity';
import { authService } from '../../services/authService';

export default function AuthPortal({ defaultMode = 'signin' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, loginWithGoogle, pending2fa, completeTwoFactorLogin, logout } = useAuth();
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
    password: '',
    confirmPassword: ''
  });
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showSignUpConfirmPassword, setShowSignUpConfirmPassword] = useState(false);
  const [signUpAgreed, setSignUpAgreed] = useState(true);
  const [signUpErrors, setSignUpErrors] = useState({});

  // Two-Factor Verification step for users with optional 2FA enabled
  const [twoFaCode, setTwoFaCode] = useState('');
  const [twoFaUseRecovery, setTwoFaUseRecovery] = useState(false);
  const [twoFaRecoveryCode, setTwoFaRecoveryCode] = useState('');

  // Query redirect handling (sanitized to strictly allow same-origin relative routes)
  const searchParams = new URLSearchParams(location.search);
  const redirectQuery = sanitizeInternalRedirect(searchParams.get('redirect'));
  const stateFrom = sanitizeInternalRedirect(location.state?.from?.pathname);
  const from = stateFrom || redirectQuery || null;

  // Anti-Brute-Force Sign-In Protection (5 failed attempts -> 30s lockout)
  const LOCKOUT_KEY = 'techtonic_auth_lockout';
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(() => {
    try {
      const saved = Number(localStorage.getItem('techtonic_auth_lockout') || 0);
      return saved > Date.now() ? saved : 0;
    } catch {
      return 0;
    }
  });
  const [lockoutSecondsLeft, setLockoutSecondsLeft] = useState(0);

  useEffect(() => {
    if (!lockoutUntil || lockoutUntil <= Date.now()) {
      setLockoutSecondsLeft(0);
      try { localStorage.removeItem(LOCKOUT_KEY); } catch {}
      return undefined;
    }
    const updateTimer = () => {
      const diff = Math.ceil((lockoutUntil - Date.now()) / 1000);
      if (diff <= 0) {
        setLockoutSecondsLeft(0);
        setLockoutUntil(0);
        setFailedAttempts(0);
        try { localStorage.removeItem(LOCKOUT_KEY); } catch {}
      } else {
        setLockoutSecondsLeft(diff);
      }
    };
    updateTimer();
    const timer = setInterval(updateTimer, 500);
    return () => clearInterval(timer);
  }, [lockoutUntil]);

  const isLockedOut = lockoutSecondsLeft > 0;
  const passwordEval = evaluatePasswordStrength(signUpData.password, signUpData.email, signUpData.name);

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

    if (isLockedOut) {
      setGeneralError(
        language === 'km'
          ? `សកម្មភាពត្រូវបានផ្អាកបណ្តោះអាសន្នដើម្បីសុវត្ថិភាព។ សូមរង់ចាំ ${lockoutSecondsLeft} វិនាទី។`
          : `Too many failed attempts. Please wait ${lockoutSecondsLeft}s before trying again.`
      );
      return;
    }

    if (!signInEmail.trim()) {
      setGeneralError(language === 'km' ? 'សូមបញ្ចូលអាសយដ្ឋានអ៊ីមែល' : 'Please enter your email address');
      return;
    }
    if (!signInPassword.trim()) {
      setGeneralError(language === 'km' ? 'សូមបញ្ចូលពាក្យសម្ងាត់' : 'Please enter your password');
      return;
    }

    setLoading(true);
    try {
      const res = await login(signInEmail, signInPassword);
      if (res.success) {
        setFailedAttempts(0);
        setLockoutUntil(0);
        try { localStorage.removeItem(LOCKOUT_KEY); } catch {}
        addToast(
          language === 'km'
            ? `សូមស្វាគមន៍ការត្រឡប់មកវិញ, ${res.user.name || res.user.fullName || 'សមាជិក'}!`
            : `Welcome back, ${res.user.name || res.user.fullName || 'Member'}!`,
          'success'
        );
        navigate(from || (res.user?.role === 'admin' ? '/admin' : '/account'), { replace: true });
      } else if (res.requires2fa) {
        setFailedAttempts(0);
        setLockoutUntil(0);
        try { localStorage.removeItem(LOCKOUT_KEY); } catch {}
      } else {
        const nextFails = failedAttempts + 1;
        setFailedAttempts(nextFails);
        if (nextFails >= 5) {
          const until = Date.now() + 30 * 1000;
          setLockoutUntil(until);
          try { localStorage.setItem(LOCKOUT_KEY, String(until)); } catch {}
          authService.reportSecurityEvent('BRUTE_FORCE_LOCKOUT', '5 failed sign-in attempts triggered 30s lockout', signInEmail.trim());
          setGeneralError(
            language === 'km'
              ? 'អ្នកបានបញ្ចូលខុសច្រើនដងពេក! គណនីត្រូវបានផ្អាករយៈពេល ៣០ វិនាទីដើម្បីការពារការលួចចូល។'
              : 'Too many failed attempts! Sign-in temporarily locked for 30s to prevent brute-force attack.'
          );
        } else {
          setGeneralError(res.message || (language === 'km' ? 'ការចូលមិនត្រឹមត្រូវ សូមពិនិត្យឡើងវិញ' : 'Login failed. Please check credentials.'));
        }
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
    setGeneralError('');
    const errs = {};

    if (!signUpAgreed) {
      errs.agreed = language === 'km' ? 'សូមយល់ព្រមលើលក្ខខណ្ឌប្រើប្រាស់' : 'Please accept the Terms of Service and Privacy Policy';
    }
    if (!signUpData.name.trim()) {
      errs.name = language === 'km' ? 'សូមបញ្ចូលឈ្មោះពេញរបស់អ្នក' : 'Full name is required';
    }
    const gmailCheck = validateRegistrationGmail(signUpData.email);
    if (!signUpData.email.trim()) {
      errs.email = language === 'km' ? 'សូមបញ្ចូលអាសយដ្ឋានអ៊ីមែល' : 'Email address is required';
    } else if (!gmailCheck.valid) {
      if (gmailCheck.reasonCode === 'ALIAS_NOT_ALLOWED') {
        errs.email = language === 'km'
          ? 'មិនអនុញ្ញាតឱ្យប្រើអ៊ីមែល Alias (+) ទេ សូមប្រើ Gmail ដើមផ្ទាល់ខ្លួន'
          : 'Alias emails with "+" are not allowed. Use your primary @gmail.com address.';
      } else if (gmailCheck.reasonCode === 'GMAIL_ONLY') {
        errs.email = language === 'km'
          ? 'ការបង្កើតគណនីតម្រូវឱ្យប្រើអ៊ីមែល @gmail.com តែប៉ុណ្ណោះ'
          : 'Account registration requires a @gmail.com email address';
      } else {
        errs.email = language === 'km'
          ? 'ទម្រង់ @gmail.com មិនត្រឹមត្រូវ'
          : 'Please enter a valid @gmail.com email address';
      }
    }
    if (!passwordEval.isValid) {
      if (!passwordEval.checks.minLength) {
        errs.password = language === 'km'
          ? 'ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ៨ តួអក្សរ'
          : 'Password must be at least 8 characters';
      } else if (!passwordEval.notCommonOrPersonal) {
        errs.password = language === 'km'
          ? 'ពាក្យសម្ងាត់ងាយទាយពេក ឬដូចឈ្មោះ/អ៊ីមែលរបស់អ្នក'
          : 'Password is too common or contains your name/email';
      } else {
        errs.password = language === 'km'
          ? 'ត្រូវមាន អក្សរធំ (A-Z), អក្សរតូច (a-z), លេខ (0-9) និងនិមិត្តសញ្ញា (!@#$)'
          : 'Must include uppercase, lowercase, number, and special character (!@#$)';
      }
    }
    if (signUpData.password !== signUpData.confirmPassword) {
      errs.confirmPassword = language === 'km' ? 'ពាក្យសម្ងាត់ទាំងពីរមិនត្រូវគ្នាទេ' : 'Passwords do not match';
    }

    if (Object.keys(errs).length > 0) {
      setSignUpErrors(errs);
      return;
    }
    setSignUpErrors({});

    setLoading(true);
    try {
      const res = await register(signUpData);
      if (res.success) {
        addToast(
          language === 'km' ? 'បានបង្កើតគណនីដោយជោគជ័យ! សូមស្វាគមន៍មកកាន់ TechTonic' : 'Account created successfully! Welcome to TechTonic.',
          'success'
        );
        navigate(from || (res.user?.role === 'admin' ? '/admin' : '/account'), { replace: true });
      } else {
        setGeneralError(res.message || 'Registration failed');
      }
    } catch (err) {
      setGeneralError(err.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGeneralError('');
    setLoading(true);
    try {
      const res = await loginWithGoogle();
      if (res?.success) {
        addToast(
          language === 'km'
            ? `បានចូលគណនីតាម Google ជោគជ័យ, ${res.user?.fullName || 'សមាជិក'}!`
            : `Signed in with Google, ${res.user?.fullName || 'Member'}!`,
          'success'
        );
        navigate(from || (res.user?.role === 'admin' ? '/admin' : '/account'), { replace: true });
      } else if (!res?.requires2fa) {
        setGeneralError(res?.message || 'Google sign-in failed');
      }
    } catch (err) {
      setGeneralError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setGeneralError('');
    const targetEmail = signInEmail.trim();
    if (!targetEmail) {
      setGeneralError(
        language === 'km'
          ? 'សូមបញ្ចូលអាសយដ្ឋាន Gmail របស់អ្នកជាមុនសិន ដើម្បីទទួលតំណភ្ជាប់កំណត់ពាក្យសម្ងាត់ថ្មី'
          : 'Please enter your email address first to receive a password reset link.'
      );
      return;
    }
    setLoading(true);
    try {
      await authService.sendPasswordReset(targetEmail);
      addToast(
        language === 'km'
          ? `តំណភ្ជាប់កំណត់ពាក្យសម្ងាត់ថ្មីត្រូវបានផ្ញើទៅ ${targetEmail} ហើយ!`
          : `Password reset email sent to ${targetEmail}`,
        'success'
      );
    } catch (err) {
      setGeneralError(err?.message || 'Unable to send password reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTwoFactor = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setLoading(true);
    try {
      const res = await completeTwoFactorLogin({
        totpCode: twoFaUseRecovery ? undefined : twoFaCode.trim(),
        recoveryCode: twoFaUseRecovery ? twoFaRecoveryCode.trim() : undefined,
      });
      if (res?.success) {
        setTwoFaCode('');
        setTwoFaRecoveryCode('');
        addToast(
          language === 'km' ? 'បានផ្ទៀងផ្ទាត់ 2FA ដោយជោគជ័យ!' : 'Two-factor verification successful!',
          'success'
        );
        navigate(from || (res.user?.role === 'admin' ? '/admin' : '/account'), { replace: true });
      } else {
        setGeneralError(res?.message || 'Invalid verification code');
      }
    } catch (err) {
      setGeneralError(err?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-800 font-sans selection:bg-blue-600 selection:text-white">
      <ToastContainer />

      {/* 1. TOP MINIMAL BRAND HEADER */}
      <header className="w-full border-b border-slate-800/80 bg-[#060b18]/95 backdrop-blur-xl sticky top-0 z-30 px-4 sm:px-8 lg:px-12 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 group">
          <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
            <img
              src="/images/logo/techtonic-crest.png"
              alt="TechTonic Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <img
              src="/images/logo/techtonic-script-orange.png"
              alt="TechTonic"
              className="h-6 sm:h-8 w-auto object-contain group-hover:scale-105 transition-transform duration-200"
            />
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#cafc05] text-slate-950 shadow-sm">
              STORE
            </span>
          </div>
        </Link>

        {/* Header Right: Language Switcher & Home Link */}
        <div className="flex items-center gap-3 sm:gap-5">
          <Link
            to="/shop"
            className="text-xs font-semibold text-slate-300 hover:text-white transition-colors hidden sm:inline"
          >
            {language === 'km' ? 'ត្រឡប់ទៅហាង' : 'Continue Shopping'}
          </Link>

          {/* Compact Language Toggle */}
          <button
            type="button"
            onClick={() => setLanguage(language === 'en' ? 'km' : 'en')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-bold text-xs transition-colors cursor-pointer border border-slate-700"
            title="Toggle Language"
          >
            <span>{language === 'km' ? '🇰🇭 ភាសាខ្មែរ' : '🇺🇸 EN'}</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN AUTHENTICATION CONTAINER */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="w-full max-w-4xl bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl shadow-slate-900/5 overflow-hidden flex flex-col lg:flex-row">
          
          {/* LEFT COLUMN: Editorial Product Spotlight (Desktop only) */}
          <div className="hidden lg:flex w-[390px] xl:w-[410px] bg-[#070b14] relative flex-col justify-between p-10 text-white shrink-0 select-none border-r border-slate-800/80">
            {/* Showcase Header */}
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight leading-snug">
                {activeTab === 'signin'
                  ? (language === 'km' ? 'ស្វាគមន៍ការត្រឡប់មកវិញ' : 'Welcome back to TechTonic.')
                  : (language === 'km' ? 'បង្កើតគណនី TechTonic' : 'Your TechTonic Store Account.')}
              </h2>
              <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                {activeTab === 'signin'
                  ? (language === 'km'
                    ? 'ចូលគណនីដើម្បីគ្រប់គ្រងការបញ្ជាទិញ ធានាផលិតផល និងតាមដានការដឹកជញ្ជូន។'
                    : 'Manage your orders, saved addresses, and delivery tracking in one place.')
                  : (language === 'km'
                    ? 'រក្សាទុកអាសយដ្ឋានដឹកជញ្ជូន ពិនិត្យវិក្កយបត្រ និងតាមដានទំនិញរបស់អ្នក។'
                    : 'Save shipping addresses, view invoices, and track every order.')}
              </p>
            </div>

            {/* Showcase Center Product Visual */}
            <div className="my-8 flex flex-col items-center justify-center">
              <div className="w-52 h-52 flex items-center justify-center">
                <img
                  key={activeTab}
                  src={activeTab === 'signin' ? '/images/products/prod-001-main.png' : '/images/products/prod-012-main.png'}
                  alt="TechTonic Hardware"
                  className="w-44 h-44 object-contain drop-shadow-[0_18px_30px_rgba(0,0,0,0.65)]"
                />
              </div>

              <div className="mt-3 text-center">
                <div className="text-xs font-semibold text-slate-200">
                  {activeTab === 'signin' ? 'TechTonic ANC Pro' : 'TechTonic Pulse Ultra'}
                </div>
              </div>
            </div>

            {/* Quiet Storefront Footer */}
            <div className="pt-4 border-t border-slate-800/70 text-[11px] text-slate-500">
              {language === 'km' ? 'ហាងផ្លូវការ TechTonic · ភ្នំពេញ' : 'TechTonic Official Storefront · Phnom Penh'}
            </div>
          </div>

          {/* RIGHT COLUMN: Clean Authentication Form */}
          <div className="flex-1 p-6 sm:p-10 xl:p-12 flex flex-col justify-between bg-white">
            <div>
              {/* Segmented Tab Switcher */}
              {!pending2fa && (
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
                    {language === 'km' ? 'ចូលគណនី' : 'Sign In'}
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
                    {language === 'km' ? 'បង្កើតគណនី' : 'Create Account'}
                  </button>
                </div>
              )}

              {/* Form Title & Subtitle */}
              <div className="mb-6">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {pending2fa
                    ? (language === 'km' ? 'ផ្ទៀងផ្ទាត់ 2-Step Verification' : 'Two-step verification')
                    : activeTab === 'signin'
                    ? (language === 'km' ? 'ចូលប្រើប្រាស់គណនីរបស់អ្នក' : 'Welcome back')
                    : (language === 'km' ? 'បង្កើតគណនី TechTonic ថ្មី' : 'Create an account')}
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  {pending2fa
                    ? (language === 'km' ? 'សូមបញ្ចូលកូដ ៦ ខ្ទង់ពី Google Authenticator ដើម្បីបន្ត។' : 'Enter the 6-digit code from Google Authenticator to finish signing in.')
                    : activeTab === 'signin'
                    ? (language === 'km' ? 'សូមបញ្ចូលអ៊ីមែល និងពាក្យសម្ងាត់របស់អ្នកដើម្បីបន្ត។' : 'Enter your email and password to access your account.')
                    : (language === 'km' ? 'បញ្ចូលព័ត៌មានខាងក្រោមដើម្បីបង្កើតគណនី។' : 'Enter your details below to get started.')}
                </p>
              </div>

              {/* Redirect Notice for Checkout */}
              {redirectQuery === '/checkout' && (
                <div className="mb-5 p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-2.5 text-xs text-blue-900 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    {language === 'km'
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
              {/* 2FA VERIFICATION STEP (WHEN USER ENABLED 2FA) */}
              {/* ================================================= */}
              {pending2fa ? (
                <form onSubmit={handleVerifyTwoFactor} className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs text-slate-700">
                    <div className="font-bold text-slate-900">
                      {language === 'km' ? 'ផ្ទៀងផ្ទាត់ 2-Step Verification' : 'Two-Factor Verification Required'}
                    </div>
                    <div className="mt-0.5 text-slate-500">
                      {pending2fa.email}
                    </div>
                  </div>

                  {!twoFaUseRecovery ? (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-700">
                          {language === 'km' ? 'លេខកូដ ៦ ខ្ទង់ពី Google Authenticator' : '6-digit Authenticator code'}
                        </label>
                        <button
                          type="button"
                          onClick={() => setTwoFaUseRecovery(true)}
                          className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                        >
                          {language === 'km' ? 'ប្រើកូដបម្រុង' : 'Use backup code'}
                        </button>
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={twoFaCode}
                        onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        className="w-full h-11 px-4 rounded-xl bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-600 text-center text-lg font-mono tracking-[0.35em] outline-hidden"
                      />
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-700">
                          {language === 'km' ? 'កូដសង្គ្រោះបម្រុង' : 'Backup Recovery Code'}
                        </label>
                        <button
                          type="button"
                          onClick={() => setTwoFaUseRecovery(false)}
                          className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                        >
                          {language === 'km' ? 'ប្រើកូដ ៦ ខ្ទង់វិញ' : 'Use Authenticator'}
                        </button>
                      </div>
                      <input
                        type="text"
                        value={twoFaRecoveryCode}
                        onChange={(e) => setTwoFaRecoveryCode(e.target.value.toUpperCase())}
                        placeholder="TTU-XXXX-XXXX"
                        className="w-full h-11 px-4 rounded-xl bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-600 text-center font-mono text-sm uppercase outline-hidden"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 sm:h-12 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>{language === 'km' ? 'ផ្ទៀងផ្ទាត់ និងចូល' : 'Verify & Sign In'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setGeneralError('');
                    }}
                    className="w-full text-xs text-slate-500 hover:text-slate-800 font-semibold py-1.5 cursor-pointer"
                  >
                    {language === 'km' ? '← ចូលដោយគណនីផ្សេងទៀត' : '← Sign in with a different account'}
                  </button>
                </form>
              ) : activeTab === 'signin' ? (
                <form onSubmit={handleSignInSubmit} className="space-y-4">
                  {/* Email Address */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {language === 'km' ? 'អាសយដ្ឋានអ៊ីមែល' : 'Email Address'}
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        autoComplete="email"
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        placeholder={language === 'km' ? 'you@domain.com' : 'you@example.com'}
                        className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 text-sm text-slate-900 placeholder:text-slate-400 transition-all outline-hidden font-medium"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        {language === 'km' ? 'ពាក្យសម្ងាត់' : 'Password'}
                      </label>
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        disabled={loading}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                      >
                        {language === 'km' ? 'ភ្លេចពាក្យសម្ងាត់?' : 'Forgot password?'}
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
                      {language === 'km' ? 'ចងចាំខ្ញុំលើឧបករណ៍នេះ' : 'Remember me on this device'}
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading || isLockedOut}
                    className="w-full h-11 sm:h-12 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : isLockedOut ? (
                      <span>
                        {language === 'km'
                          ? `រង់ចាំ ${lockoutSecondsLeft} វិនាទី...`
                          : `Security Lockout (${lockoutSecondsLeft}s)`}
                      </span>
                    ) : (
                      <>
                        <span>{language === 'km' ? 'ចូលគណនី' : 'Sign In'}</span>
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
                      {language === 'km' ? 'ឈ្មោះពេញ' : 'Full Name'}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="name"
                        autoComplete="name"
                        value={signUpData.name}
                        onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })}
                        placeholder={language === 'km' ? 'ឧ. សារ៉ា ម៉េង' : 'e.g. Sara Meng'}
                        className={`w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50 hover:bg-slate-100/70 focus:bg-white border text-sm text-slate-900 placeholder:text-slate-400 transition-all outline-hidden font-medium ${
                          signUpErrors.name ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10'
                        }`}
                      />
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    {signUpErrors.name && <span className="text-[11px] text-rose-600 font-medium pl-1 mt-0.5 block">{signUpErrors.name}</span>}
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {language === 'km' ? 'អាសយដ្ឋានអ៊ីមែល' : 'Email Address'}
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        autoComplete="email"
                        value={signUpData.email}
                        onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                        placeholder="you@gmail.com"
                        className={`w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50 hover:bg-slate-100/70 focus:bg-white border text-sm text-slate-900 placeholder:text-slate-400 transition-all outline-hidden font-medium ${
                          signUpErrors.email ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10'
                        }`}
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    {signUpErrors.email && <span className="text-[11px] text-rose-600 font-medium pl-1 mt-0.5 block">{signUpErrors.email}</span>}
                  </div>

                  {/* Password & Confirm Password side by side */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {language === 'km' ? 'ពាក្យសម្ងាត់' : 'Password'}
                      </label>
                      <div className="relative">
                        <input
                          type={showSignUpPassword ? 'text' : 'password'}
                          value={signUpData.password}
                          onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                          placeholder="8+ chars (Aa1!)"
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
                        {language === 'km' ? 'ផ្ទៀងផ្ទាត់ពាក្យសម្ងាត់' : 'Confirm Password'}
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
                      <span>{language === 'km' ? 'ខ្ញុំយល់ព្រមលើ ' : 'I agree to the '}</span>
                      <Link to="/about" className="text-slate-800 font-bold hover:underline">
                        {language === 'km' ? 'លក្ខខណ្ឌប្រើប្រាស់' : 'Terms of Service'}
                      </Link>{' '}
                      <span>{language === 'km' ? 'និង ' : 'and '}</span>
                      <Link to="/about" className="text-slate-800 font-bold hover:underline">
                        {language === 'km' ? 'គោលការណ៍ឯកជនភាព' : 'Privacy Policy'}
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
                        <span>{language === 'km' ? 'បង្កើតគណនីថ្មី' : 'Create Account'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {!pending2fa && (
                <>
                  {/* Social Login Divider */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-[11px] uppercase tracking-wider text-slate-400">
                      <span className="bg-white px-3 font-semibold">
                        {language === 'km' ? 'ឬចូលតាមរយៈ' : 'Or continue with'}
                      </span>
                    </div>
                  </div>

                  {/* Google Sign-In */}
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="w-full h-11 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-700 transition-colors cursor-pointer"
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
                    <span>{language === 'km' ? 'បន្តជាមួយ Google' : 'Continue with Google'}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 3. SUBTLE AUTH FOOTER */}
      <footer className="w-full py-4 px-6 border-t border-slate-200/70 bg-white text-center text-xs text-slate-400">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mb-1">
          <Link to="/about" className="hover:text-slate-600 transition-colors">
            {language === 'km' ? 'អំពី TechTonic' : 'About TechTonic'}
          </Link>
          <span>•</span>
          <Link to="/about" className="hover:text-slate-600 transition-colors">
            {language === 'km' ? 'លក្ខខណ្ឌ' : 'Terms'}
          </Link>
          <span>•</span>
          <Link to="/about" className="hover:text-slate-600 transition-colors">
            {language === 'km' ? 'ឯកជនភាព' : 'Privacy'}
          </Link>
          <span>•</span>
          <a
            href="https://t.me"
            target="_blank"
            rel="noreferrer"
            className="hover:text-slate-600 transition-colors"
          >
            {language === 'km' ? 'ជំនួយ' : 'Support'}
          </a>
        </div>
        <div>
          © 2026 TechTonic Electronics Inc. Phnom Penh, Cambodia.
        </div>
      </footer>
    </div>
  );
}
