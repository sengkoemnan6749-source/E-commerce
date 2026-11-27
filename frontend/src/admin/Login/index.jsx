import React, { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  LogOut,
  ArrowLeft,
  KeyRound,
} from 'lucide-react';
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
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-300 text-xs font-medium">
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
        : 'Access denied. This account does not have administrator privileges. Please use an Admin account or sign in on the Customer Login page.'
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
          : `Too many failed attempts. Please wait ${lockoutSecondsLeft}s before trying again.`
      );
      return;
    }

    if (!email.trim()) {
      setError(isKm ? 'សូមបញ្ចូលអាសយដ្ឋានអ៊ីមែល Admin' : 'Please enter your admin email address');
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
              ? 'អ្នកបានបញ្ចូលខុសច្រើនដងពេក! សូមរង់ចាំ ៣០ វិនាទីដើម្បីសាកល្បងម្តងទៀត។'
              : 'Too many failed attempts! Admin sign-in temporarily locked for 30s.'
          );
        } else {
          setError(
            res.message ||
              (isKm ? 'អ៊ីមែល ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ' : 'Invalid admin email or password')
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
    <div className="min-h-screen flex flex-col justify-between bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Admin Header */}
      <header className="w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl sticky top-0 z-30 px-4 sm:px-8 py-3 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center shrink-0">
            <img
              src="/images/logo/techtonic-crest.png"
              alt="TechTonic Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-black text-base sm:text-lg tracking-tight text-white">
              Tech<span className="text-blue-400">Tonic</span>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-blue-500/15 border border-blue-400/30 text-[10px] font-bold uppercase tracking-wider text-blue-300">
              Admin Portal
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <LanguageSwitcher variant="dark" />
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/70 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isKm ? 'ទៅហាងវិញ' : 'Back to Store'}</span>
          </Link>
        </div>
      </header>

      {/* Main Auth Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-10 relative overflow-hidden">
        <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-blue-600/10 blur-[120px]" />

        <div className="relative z-10 w-full max-w-md bg-white text-slate-900 rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-slate-950 text-white flex items-center justify-center shadow-md mb-3.5">
              <ShieldCheck className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-blue-600 mb-1">
              {isKm ? 'ប្រព័ន្ធគ្រប់គ្រងហាង' : 'Restricted Console'}
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {isKm ? 'ចូលគណនី Admin' : 'Administrator Sign In'}
            </h1>
            <p className="text-xs text-slate-500 mt-1.5 max-w-xs leading-relaxed">
              {isKm
                ? 'ផ្លូវចូលដាច់ដោយឡែកសម្រាប់តែអ្នកគ្រប់គ្រងហាង TechTonic ប៉ុណ្ណោះ។'
                : 'Dedicated sign-in route reserved strictly for authorized TechTonic store administrators.'}
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="space-y-1">
                <p>{error}</p>
                <Link to="/login" className="inline-block text-blue-600 hover:underline font-bold">
                  {isKm ? 'ទៅទំព័រចូលសម្រាប់អតិថិជន (/login)' : 'Go to Customer Login (/login)'}
                </Link>
              </div>
            </div>
          )}

          {/* Signed-in as non-admin customer */}
          {isAuthenticated && !isAdmin && user?.role !== 'admin' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
                <p className="font-bold">
                  {isKm ? 'គណនីបច្ចុប្បន្នមិនមែនជា Admin ទេ' : 'Currently Signed In as Customer'}
                </p>
                <p className="text-amber-800">
                  {isKm
                    ? `អ្នកកំពុងចូលដោយប្រើ ${user?.email || 'គណនីអតិថិជន'} ដែលមិនមានសិទ្ធិគ្រប់គ្រងប្រព័ន្ធ Admin ឡើយ។`
                    : `You are signed in as ${user?.email || 'a customer account'}, which does not have administrator privileges.`}
                </p>
              </div>

              <button
                type="button"
                onClick={logout}
                className="w-full py-3 rounded-2xl bg-slate-950 hover:bg-slate-900 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                {isKm ? 'ចាកចេញ ដើម្បីចូលគណនី Admin' : 'Sign Out & Switch to Admin Account'}
              </button>

              <Link
                to="/account"
                className="w-full py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center transition"
              >
                {isKm ? 'ត្រឡប់ទៅគណនីអតិថិជន' : 'Go to Customer Account'}
              </Link>
            </div>
          ) : pending2fa ? (
            /* 2FA Step */
            <form onSubmit={handleVerifyTwoFactor} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center gap-2.5">
                <KeyRound className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  {isKm
                    ? `បញ្ចូលកូដ 2FA សម្រាប់ ${pending2fa.email}`
                    : `Enter 2FA verification code for ${pending2fa.email}`}
                </span>
              </div>

              {!twoFaUseRecovery ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isKm ? 'កូដ Authenticator (6 ខ្ទង់)' : '6-Digit Authenticator Code'}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={twoFaCode}
                    onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 font-mono text-center text-lg tracking-widest font-bold focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isKm ? 'កូដសង្គ្រោះ (Recovery Code)' : 'Recovery Code'}
                  </label>
                  <input
                    type="text"
                    value={twoFaRecoveryCode}
                    onChange={(e) => setTwoFaRecoveryCode(e.target.value)}
                    placeholder="XXXX-XXXX"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
              )}

              <button
                type="button"
                onClick={() => setTwoFaUseRecovery((v) => !v)}
                className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                {twoFaUseRecovery
                  ? isKm ? 'ប្រើកូដ Authenticator ជំនួសវិញ' : 'Use Authenticator Code instead'
                  : isKm ? 'ប្រើកូដសង្គ្រោះ (Recovery Code)' : 'Use a Recovery Code instead'}
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-slate-950 hover:bg-slate-900 text-white text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60"
              >
                <span>{loading ? (isKm ? 'កំពុងផ្ទៀងផ្ទាត់...' : 'Verifying...') : isKm ? 'ផ្ទៀងផ្ទាត់ និងចូល Admin' : 'Verify & Enter Admin'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* Standard Admin Email & Google Sign-In */
            <div className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isKm ? 'អ៊ីមែល Admin' : 'Admin Email'}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@techtonic.store"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isKm ? 'ពាក្យសម្ងាត់' : 'Password'}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-11 py-3 rounded-2xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || isLockedOut}
                  className="w-full py-3 rounded-2xl bg-slate-950 hover:bg-slate-900 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-60"
                >
                  <span>
                    {loading
                      ? isKm ? 'កំពុងផ្ទៀងផ្ទាត់...' : 'Signing In...'
                      : isKm ? 'ចូលផ្ទាំង Admin' : 'Sign In to Admin'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="relative flex items-center justify-center py-1">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase">
                  {isKm ? 'ឬ' : 'or'}
                </span>
                <div className="border-t border-slate-200 w-full" />
              </div>

              <button
                type="button"
                onClick={handleGoogleAdminSignIn}
                disabled={loading || isLockedOut}
                className="w-full py-2.5 px-4 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-bold flex items-center justify-center gap-2.5 transition cursor-pointer disabled:opacity-60"
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
                <span>{isKm ? 'ចូល Admin តាម Google' : 'Continue with Google (Admin)'}</span>
              </button>

              <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-500">
                {isKm ? 'តើអ្នកជាអតិថិជនមែនទេ?' : 'Looking for customer shopping login?'}{' '}
                <Link to="/login" className="font-bold text-blue-600 hover:underline">
                  {isKm ? 'ចូលគណនីអតិថិជន' : 'Customer Sign In'}
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="py-4 px-6 text-center text-[11px] text-slate-500 border-t border-slate-900">
        TechTonic Cambodia • Protected Admin Gateway ({adminBase}/login)
      </footer>
    </div>
  );
}
