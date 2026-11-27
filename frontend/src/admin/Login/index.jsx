import React, { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, LogOut, ArrowLeft } from 'lucide-react';
import { useAuth, useLanguage } from '../../store/StoreContext';
import { sanitizeInternalRedirect } from '../../utils/urlSecurity';
import { authService } from '../../services/authService';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';

const ADMIN_LOCKOUT_KEY = 'techtonic_admin_auth_lockout';

function isAdminPath(p) {
  if (typeof p !== 'string') return false;
  const lower = p.toLowerCase();
  return (
    (lower.startsWith('/admin') || lower.startsWith('/techtonicadmin')) &&
    !lower.startsWith('/admin/login') &&
    !lower.startsWith('/techtonicadmin/login')
  );
}

const INPUT_CLASSES =
  'w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:border-slate-300 focus:bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_#ffffff] [&:-webkit-autofill]:[-webkit-text-fill-color:#0f172a]';

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user,
    isAuthenticated,
    isAdmin,
    authReady,
    login,
    loginWithGoogle,
    pending2fa,
    completeTwoFactorLogin,
    logout,
  } = useAuth();
  const { language } = useLanguage();
  const isKm = language === 'km';

  const isTechTonicRoute = location.pathname.toLowerCase().startsWith('/techtonicadmin');
  const adminBase = isTechTonicRoute ? '/TechTonicAdmin' : '/admin';

  const searchParams = new URLSearchParams(location.search);
  const redirectQuery = sanitizeInternalRedirect(searchParams.get('redirect'));
  const targetPath = redirectQuery && isAdminPath(redirectQuery) ? redirectQuery : adminBase;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 2FA state
  const [twoFaCode, setTwoFaCode] = useState('');
  const [twoFaUseRecovery, setTwoFaUseRecovery] = useState(false);
  const [twoFaRecoveryCode, setTwoFaRecoveryCode] = useState('');

  // Anti-Brute-Force Protection
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(() => {
    try {
      const saved = Number(localStorage.getItem(ADMIN_LOCKOUT_KEY) || 0);
      return saved > Date.now() ? saved : 0;
    } catch {
      return 0;
    }
  });
  const [lockoutSecondsLeft, setLockoutSecondsLeft] = useState(0);

  useEffect(() => {
    if (!lockoutUntil || lockoutUntil <= Date.now()) {
      setLockoutSecondsLeft(0);
      try { localStorage.removeItem(ADMIN_LOCKOUT_KEY); } catch {}
      return undefined;
    }
    const updateTimer = () => {
      const diff = Math.ceil((lockoutUntil - Date.now()) / 1000);
      if (diff <= 0) {
        setLockoutSecondsLeft(0);
        setLockoutUntil(0);
        setFailedAttempts(0);
        try { localStorage.removeItem(ADMIN_LOCKOUT_KEY); } catch {}
      } else {
        setLockoutSecondsLeft(diff);
      }
    };
    updateTimer();
    const timer = setInterval(updateTimer, 500);
    return () => clearInterval(timer);
  }, [lockoutUntil]);

  const isLockedOut = lockoutSecondsLeft > 0;

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3f4f6] text-slate-500 text-xs font-medium">
        {isKm ? 'កំពុងផ្ទៀងផ្ទាត់សម័យប្រជុំ Admin...' : 'Verifying administrator session...'}
      </div>
    );
  }

  if (isAuthenticated && (isAdmin || user?.role === 'admin')) {
    return <Navigate to={targetPath} replace />;
  }

  const verifyAdminRoleOrReject = (loggedUser) => {
    if (loggedUser?.role === 'admin') {
      navigate(targetPath, { replace: true });
      return true;
    }
    logout();
    setError(
      isKm
        ? 'គណនីនេះមិនមានសិទ្ធិជាអ្នកគ្រប់គ្រង (Admin) ទេ។ សូមប្រើគណនី Admin ឬចូលតាមទំព័រអតិថិជន (/login)។'
        : 'This account does not have administrator permissions. Please sign in with an Admin account or use the customer login page.'
    );
    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isLockedOut) {
      setError(
        isKm
          ? `សកម្មភាពត្រូវបានផ្អាកបណ្តោះអាសន្ន។ សូមរង់ចាំ ${lockoutSecondsLeft} វិនាទី។`
          : `Too many failed attempts. Try again in ${lockoutSecondsLeft}s.`
      );
      return;
    }

    if (!email.trim()) {
      setError(isKm ? 'សូមបញ្ចូលអាសយដ្ឋានអ៊ីមែល' : 'Please enter your email address');
      return;
    }
    if (!password.trim()) {
      setError(isKm ? 'សូមបញ្ចូលពាក្យសម្ងាត់' : 'Please enter your password');
      return;
    }

    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        setFailedAttempts(0);
        setLockoutUntil(0);
        try { localStorage.removeItem(ADMIN_LOCKOUT_KEY); } catch {}
        verifyAdminRoleOrReject(res.user);
      } else if (res.requires2fa) {
        setFailedAttempts(0);
        setLockoutUntil(0);
        try { localStorage.removeItem(ADMIN_LOCKOUT_KEY); } catch {}
      } else {
        const nextFails = failedAttempts + 1;
        setFailedAttempts(nextFails);
        if (nextFails >= 5) {
          const until = Date.now() + 30 * 1000;
          setLockoutUntil(until);
          try { localStorage.setItem(ADMIN_LOCKOUT_KEY, String(until)); } catch {}
          authService.reportSecurityEvent(
            'ADMIN_BRUTE_FORCE_LOCKOUT',
            '5 failed admin sign-in attempts triggered 30s lockout',
            email.trim()
          );
          setError(
            isKm
              ? 'អ្នកបានបញ្ចូលខុសច្រើនដងពេក។ សូមរង់ចាំ ៣០ វិនាទី។'
              : 'Too many failed attempts. Please wait 30 seconds before trying again.'
          );
        } else {
          setError(
            res.message ||
              (isKm ? 'អ៊ីមែល ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ' : 'Incorrect email or password')
          );
        }
      }
    } catch (err) {
      setError(err?.message || 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAdminSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await loginWithGoogle();
      if (res?.success) {
        verifyAdminRoleOrReject(res.user);
      } else if (!res?.requires2fa) {
        setError(res?.message || (isKm ? 'ការចូលតាម Google បរាជ័យ' : 'Google sign-in failed'));
      }
    } catch (err) {
      setError(err?.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTwoFactor = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await completeTwoFactorLogin({
        totpCode: twoFaUseRecovery ? undefined : twoFaCode.trim(),
        recoveryCode: twoFaUseRecovery ? twoFaRecoveryCode.trim() : undefined,
      });
      if (res?.success) {
        setTwoFaCode('');
        setTwoFaRecoveryCode('');
        verifyAdminRoleOrReject(res.user);
      } else {
        setError(res?.message || (isKm ? 'កូដ 2FA មិនត្រឹមត្រូវ' : 'Invalid verification code'));
      }
    } catch (err) {
      setError(err?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] p-3 sm:p-5 lg:p-8 flex items-center justify-center font-sans text-slate-900">
      <div className="w-full max-w-[1120px] min-h-[660px] bg-white rounded-[28px] border border-slate-200/90 shadow-[0_24px_70px_-24px_rgba(15,23,42,0.16)] overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Photographic Studio Panel */}
        <div className="hidden lg:flex lg:col-span-6 relative overflow-hidden bg-slate-900 flex-col justify-between p-9">
          <img
            src="/images/banners/techtonic-hero-banner.jpg"
            alt="TechTonic Studio Hardware"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-slate-950/55" />

          {/* Top Brand Lockup */}
          <div className="relative z-10 flex items-center justify-between gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <img
                src="/images/logo/techtonic-crest.png"
                alt="TechTonic Crest"
                className="w-9 h-9 object-contain"
              />
              <img
                src="/images/logo/techtonic-script-orange.png"
                alt="TechTonic"
                className="h-6 w-auto object-contain"
              />
              <span className="px-2 py-0.5 rounded-md bg-[#cafc05] text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-xs">
                ADMIN
              </span>
            </Link>
          </div>

          {/* Bottom Editorial Caption */}
          <div className="relative z-10 space-y-3">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {isKm ? 'ផ្ទាំងគ្រប់គ្រងហាង TechTonic' : 'TechTonic Store Admin'}
              </h2>
              <p className="text-sm text-white/80 mt-1.5 max-w-sm leading-relaxed">
                {isKm
                  ? 'គ្រប់គ្រងស្តុកផលិតផល ការទូទាត់ Bakong KHQR និងថ្លៃដឹកជញ្ជូនពីកន្លែងតែមួយ។'
                  : 'Manage inventory, Bakong KHQR orders, and delivery rates from one workspace.'}
              </p>
            </div>

            <div className="pt-3 border-t border-white/15 flex items-center justify-between text-xs text-white/75">
              <span>Phnom Penh · Cambodia</span>
              <span className="font-mono px-2.5 py-1 rounded-md bg-white/10 backdrop-blur-sm border border-white/15 text-white/90">
                {adminBase}/login
              </span>
            </div>
          </div>
        </div>

        {/* Right Clean Authentication Panel */}
        <div className="lg:col-span-6 flex flex-col justify-between p-6 sm:p-10 lg:p-12 bg-white">
          {/* Top Utility Bar */}
          <header className="flex items-center justify-between gap-3">
            <Link to="/" className="flex lg:hidden items-center gap-2">
              <img
                src="/images/logo/techtonic-crest.png"
                alt="TechTonic"
                className="w-7 h-7 object-contain"
              />
              <span className="font-bold text-sm text-slate-900">TechTonic Admin</span>
            </Link>

            <Link
              to="/"
              className="hidden lg:inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{isKm ? 'ត្រឡប់ទៅហាង' : 'Back to store'}</span>
            </Link>

            <LanguageSwitcher variant="light" />
          </header>

          {/* Centered Form Block */}
          <div className="w-full max-w-[360px] mx-auto my-auto py-8">
            <span className="block text-[11px] font-bold uppercase tracking-widest text-slate-400">
              {isKm ? 'ផ្នែកអ្នកគ្រប់គ្រង' : 'Administration'}
            </span>
            <h1 className="text-2xl sm:text-[26px] font-extrabold tracking-tight text-slate-900 mt-1">
              {isKm ? 'ចូលគណនី Admin' : 'Sign in to Admin'}
            </h1>
            <p className="text-sm text-slate-500 mt-1.5 mb-7">
              {isKm
                ? 'សូមប្រើគណនីអ្នកគ្រប់គ្រងហាងដែលមានសិទ្ធិ។'
                : 'Use your authorized administrator credentials.'}
            </p>

            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <div className="space-y-1">
                  <p className="leading-relaxed">{error}</p>
                  <Link to="/login" className="inline-block font-semibold text-slate-900 underline">
                    {isKm ? 'ទៅទំព័រចូលសម្រាប់អតិថិជន' : 'Go to customer sign in'}
                  </Link>
                </div>
              </div>
            )}

            {isAuthenticated && !isAdmin && user?.role !== 'admin' ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                  <p className="font-semibold">
                    {isKm ? 'គណនីបច្ចុប្បន្នមិនមែនជា Admin ទេ' : 'Signed in with a customer account'}
                  </p>
                  <p className="text-amber-800 leading-relaxed">
                    {isKm
                      ? `អ្នកកំពុងចូលដោយប្រើ ${user?.email || 'គណនីអតិថិជន'}។`
                      : `You are currently signed in as ${user?.email || 'a customer'}.`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={logout}
                  className="w-full h-11 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{isKm ? 'ចាកចេញ ដើម្បីចូលគណនី Admin' : 'Sign out and switch account'}</span>
                </button>

                <Link
                  to="/account"
                  className="w-full h-11 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium flex items-center justify-center transition"
                >
                  {isKm ? 'ត្រឡប់ទៅគណនីអតិថិជន' : 'Return to customer account'}
                </Link>
              </div>
            ) : pending2fa ? (
              <form onSubmit={handleVerifyTwoFactor} className="space-y-4">
                <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-3">
                  {isKm
                    ? `បញ្ចូលកូដ 2FA សម្រាប់ ${pending2fa.email}`
                    : `Enter the two-factor code for ${pending2fa.email}`}
                </p>

                {!twoFaUseRecovery ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {isKm ? 'កូដ Authenticator (6 ខ្ទង់)' : 'Authenticator code'}
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={twoFaCode}
                      onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className={`${INPUT_CLASSES} font-mono text-center tracking-widest`}
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {isKm ? 'កូដសង្គ្រោះ' : 'Recovery code'}
                    </label>
                    <input
                      type="text"
                      value={twoFaRecoveryCode}
                      onChange={(e) => setTwoFaRecoveryCode(e.target.value)}
                      placeholder="XXXX-XXXX"
                      className={`${INPUT_CLASSES} font-mono`}
                      required
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setTwoFaUseRecovery((v) => !v)}
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 underline cursor-pointer"
                >
                  {twoFaUseRecovery
                    ? isKm ? 'ប្រើកូដ Authenticator ជំនួសវិញ' : 'Use authenticator code'
                    : isKm ? 'ប្រើកូដសង្គ្រោះ (Recovery Code)' : 'Use a recovery code'}
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-sm font-semibold shadow-sm transition cursor-pointer disabled:opacity-60"
                >
                  {loading
                    ? isKm ? 'កំពុងផ្ទៀងផ្ទាត់...' : 'Verifying...'
                    : isKm ? 'បន្ត' : 'Verify and continue'}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="admin-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {isKm ? 'អ៊ីមែល' : 'Email'}
                    </label>
                    <input
                      id="admin-email"
                      type="email"
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@techtonic.store"
                      className={INPUT_CLASSES}
                    />
                  </div>

                  <div>
                    <label htmlFor="admin-password" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {isKm ? 'ពាក្យសម្ងាត់' : 'Password'}
                    </label>
                    <div className="relative">
                      <input
                        id="admin-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`${INPUT_CLASSES} pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || isLockedOut}
                    className="w-full h-11 rounded-xl bg-slate-950 hover:bg-slate-800 active:bg-slate-900 text-white text-sm font-semibold shadow-sm transition cursor-pointer disabled:opacity-60"
                  >
                    {loading
                      ? isKm ? 'កំពុងចូល...' : 'Signing in...'
                      : isKm ? 'ចូលគណនី Admin' : 'Sign in'}
                  </button>
                </form>

                <div className="relative flex items-center justify-center py-1">
                  <div className="border-t border-slate-200 w-full" />
                  <span className="bg-white px-3 text-xs text-slate-400">
                    {isKm ? 'ឬ' : 'or'}
                  </span>
                  <div className="border-t border-slate-200 w-full" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleAdminSignIn}
                  disabled={loading || isLockedOut}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-sm font-medium flex items-center justify-center gap-2.5 transition cursor-pointer disabled:opacity-60"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#EA4335"
                      d="M12 5.04c1.94 0 3.68.67 5.05 1.98l3.78-3.78C18.54 1.19 15.53 0 12 0 7.31 0 3.25 2.69 1.28 6.62l4.41 3.42C6.73 6.91 9.15 5.04 12 5.04z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.49 12.27c0-.79-.07-1.55-.2-2.27H12v4.51h6.47c-.28 1.49-1.12 2.75-2.39 3.6l3.72 2.89c2.17-2 3.69-4.96 3.69-8.73z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.69 14.04A6.98 6.98 0 0 1 5.32 12c0-.71.13-1.4.37-2.04L1.28 6.54A11.97 11.97 0 0 0 0 12c0 1.94.46 3.77 1.28 5.46l4.41-3.42z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.72-2.89c-1.07.72-2.44 1.15-4.23 1.15-2.85 0-5.27-1.87-6.13-4.38L1.28 18.4C3.25 21.31 7.31 24 12 24z"
                    />
                  </svg>
                  <span>{isKm ? 'បន្តជាមួយ Google' : 'Continue with Google'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Bottom Footer */}
          <footer className="pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>© 2026 TechTonic</span>
            <Link to="/login" className="text-slate-500 hover:text-slate-900 font-medium transition">
              {isKm ? 'ចូលគណនីអតិថិជន →' : 'Customer sign in →'}
            </Link>
          </footer>
        </div>
      </div>
    </div>
  );
}
