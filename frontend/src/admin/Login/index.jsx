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
  Activity,
  FileCheck2,
  Cpu,
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

const DARK_INPUT_CLASSES =
  'w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 transition-all [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_#0f172a] [&:-webkit-autofill]:[-webkit-text-fill-color:#ffffff] [&:-webkit-autofill]:caret-white';

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
      <div className="min-h-screen flex items-center justify-center bg-[#040711] text-slate-300 text-xs font-medium">
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

  const securityHighlights = [
    {
      icon: ShieldCheck,
      accent: 'text-sky-400 bg-sky-500/10 border-sky-400/20',
      title: isKm ? 'ប្រព័ន្ធសុវត្ថិភាព ៥ ស្រទាប់' : '5-Layer Security Vault',
      desc: isKm
        ? 'ផ្ទៀងផ្ទាត់ Role Admin ពី Firebase, 2FA TOTP និងលេខកូដ Vault PIN ជាប់ IP។'
        : 'Role-verified Firebase auth, TOTP authenticator, and IP-bound Admin Vault PIN.',
    },
    {
      icon: Activity,
      accent: 'text-emerald-400 bg-emerald-500/10 border-emerald-400/20',
      title: isKm ? 'គ្រប់គ្រង KHQR និងដឹកជញ្ជូនភ្លាមៗ' : 'Real-Time Order & KHQR Engine',
      desc: isKm
        ? 'ត្រួតពិនិត្យការទូទាត់ Bakong KHQR ស្តុកទំនិញ និងកំណត់ថ្លៃដឹកជញ្ជូនផ្ទាល់ខ្លួន។'
        : 'Instant Bakong KHQR settlement sync, stock telemetry, and custom courier rates.',
    },
    {
      icon: FileCheck2,
      accent: 'text-indigo-400 bg-indigo-500/10 border-indigo-400/20',
      title: isKm ? 'កំណត់ត្រាសវនកម្មសុវត្ថិភាព' : 'Immutable Audit Trail',
      desc: isKm
        ? 'កត់ត្រារាល់សកម្មភាពចូលប្រព័ន្ធ ការកែទំនិញ និងការផ្លាស់ប្តូរការកុម្ម៉ង់ទាំងអស់។'
        : 'Cryptographic audit logging across every sign-in, inventory edit, and order action.',
    },
  ];

  return (
    <div className="min-h-screen relative flex flex-col justify-between bg-[#040711] text-slate-100 font-sans selection:bg-blue-600 selection:text-white overflow-x-hidden">
      {/* Architectural Grid & Atmospheric Glow */}
      <div
        className="pointer-events-none fixed inset-0 opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(148,163,184,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.06) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div className="pointer-events-none fixed -top-40 -left-32 w-[540px] h-[540px] rounded-full bg-blue-600/15 blur-[140px]" />
      <div className="pointer-events-none fixed -bottom-40 -right-24 w-[500px] h-[500px] rounded-full bg-indigo-600/15 blur-[140px]" />

      {/* Top Admin Header */}
      <header className="relative z-30 w-full border-b border-white/[0.07] bg-[#040711]/80 backdrop-blur-xl sticky top-0 px-4 sm:px-8 lg:px-12 py-3.5 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <img
              src="/images/logo/techtonic-crest.png"
              alt="TechTonic Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-black text-base sm:text-lg tracking-tight text-white">
              Tech<span className="text-sky-400">Tonic</span>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-400/25 text-[10px] font-bold uppercase tracking-wider text-sky-300">
              Admin Console
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2.5 sm:gap-3">
          <LanguageSwitcher variant="dark" />
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white px-3.5 py-2 rounded-xl border border-white/10 hover:border-white/20 bg-white/[0.04] hover:bg-white/[0.08] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isKm ? 'ត្រឡប់ទៅហាង' : 'Back to Store'}</span>
          </Link>
        </div>
      </header>

      {/* Main Split-Screen Stage */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Command Center Briefing (Desktop) */}
          <div className="hidden lg:flex lg:col-span-7 flex-col justify-between space-y-8 pr-4">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.09] text-[11px] font-bold tracking-wider uppercase text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                <span>
                  {isKm ? 'ប្រព័ន្ធដំណើរការធម្មតា • កូដនីយកម្មសុវត្ថិភាព' : 'System Operational • Zero-Trust Gateway'}
                </span>
              </div>

              <h1 className="text-4xl xl:text-[2.85rem] font-black tracking-tight text-white leading-[1.12]">
                {isKm ? 'មជ្ឈមណ្ឌលគ្រប់គ្រង' : 'TechTonic'}{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400">
                  {isKm ? 'TechTonic Admin' : 'Command Center'}
                </span>
              </h1>

              <p className="text-sm xl:text-base text-slate-400 leading-relaxed max-w-xl">
                {isKm
                  ? 'ច្រកចូលដាច់ដោយឡែកសម្រាប់អ្នកគ្រប់គ្រងហាង ដើម្បីត្រួតពិនិត្យការកុម្ម៉ង់ ថ្លៃដឹកជញ្ជូន ប្រូម៉ូសិន និងសុវត្ថិភាពប្រព័ន្ធ។'
                  : 'Dedicated operations console for store administrators. Monitor orders, configure custom shipping fees, manage inventory, and audit security telemetry.'}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3.5 max-w-xl">
              {securityHighlights.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:border-white/[0.14] hover:bg-white/[0.045] transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${item.accent}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{item.title}</h3>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-[11px] font-mono text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-sky-400" />
                Route: <span className="text-slate-300">{adminBase}/login</span>
              </span>
              <span>•</span>
              <span>Toul Kork Flagship Hub</span>
              <span>•</span>
              <span className="text-emerald-400">RBAC Enforced</span>
            </div>
          </div>

          {/* Right Column: Layered Dark-Glass Login Card */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto">
            <div className="relative rounded-[28px] p-[1px] bg-gradient-to-b from-white/20 via-white/10 to-white/[0.03] shadow-[0_32px_80px_-20px_rgba(0,0,0,0.9)]">
              <div className="rounded-[27px] bg-[#0b1120]/95 backdrop-blur-2xl p-6 sm:p-8">
                {/* Card Header */}
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-400/30 flex items-center justify-center shadow-inner mb-3.5">
                    <ShieldCheck className="w-6 h-6 text-sky-400" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-400 mb-1">
                    {isKm ? 'ផ្លូវចូលដាច់ដោយឡែក' : 'Restricted Access'}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {isKm ? 'ចូលគណនី Admin' : 'Administrator Sign In'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    {isKm
                      ? 'សម្រាប់តែគណនីអ្នកគ្រប់គ្រងហាង TechTonic ប៉ុណ្ណោះ។'
                      : 'Authorize with your TechTonic administrator credentials.'}
                  </p>
                </div>

                {error && (
                  <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs font-medium flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                    <div className="space-y-1">
                      <p className="leading-relaxed">{error}</p>
                      <Link to="/login" className="inline-block text-sky-400 hover:underline font-bold">
                        {isKm ? 'ទៅទំព័រចូលសម្រាប់អតិថិជន (/login)' : 'Go to Customer Login (/login)'}
                      </Link>
                    </div>
                  </div>
                )}

                {/* Signed-in as non-admin customer */}
                {isAuthenticated && !isAdmin && user?.role !== 'admin' ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-amber-100 text-xs space-y-1.5">
                      <p className="font-bold text-amber-300">
                        {isKm ? 'គណនីបច្ចុប្បន្នមិនមែនជា Admin ទេ' : 'Signed In as Customer Account'}
                      </p>
                      <p className="text-amber-200/80 leading-relaxed">
                        {isKm
                          ? `អ្នកកំពុងចូលដោយប្រើ ${user?.email || 'គណនីអតិថិជន'} ដែលមិនមានសិទ្ធិគ្រប់គ្រងប្រព័ន្ធ Admin ឡើយ។`
                          : `You are currently signed in as ${user?.email || 'a customer account'}, which lacks administrator privileges.`}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={logout}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      {isKm ? 'ចាកចេញ ដើម្បីចូលគណនី Admin' : 'Sign Out & Switch to Admin Account'}
                    </button>

                    <Link
                      to="/account"
                      className="w-full py-2.5 rounded-xl border border-white/10 hover:bg-white/[0.06] text-slate-300 text-xs font-bold flex items-center justify-center transition"
                    >
                      {isKm ? 'ត្រឡប់ទៅគណនីអតិថិជន' : 'Return to Customer Account'}
                    </Link>
                  </div>
                ) : pending2fa ? (
                  /* 2FA Step */
                  <form onSubmit={handleVerifyTwoFactor} className="space-y-4">
                    <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-400/25 text-xs text-blue-200 flex items-center gap-2.5">
                      <KeyRound className="w-4 h-4 text-sky-400 shrink-0" />
                      <span>
                        {isKm
                          ? `បញ្ចូលកូដ 2FA សម្រាប់ ${pending2fa.email}`
                          : `Enter 2FA code for ${pending2fa.email}`}
                      </span>
                    </div>

                    {!twoFaUseRecovery ? (
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5">
                          {isKm ? 'កូដ Authenticator (6 ខ្ទង់)' : '6-Digit Authenticator Code'}
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={twoFaCode}
                          onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="000000"
                          className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white font-mono text-center text-lg tracking-widest font-bold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25"
                          required
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5">
                          {isKm ? 'កូដសង្គ្រោះ (Recovery Code)' : 'Recovery Code'}
                        </label>
                        <input
                          type="text"
                          value={twoFaRecoveryCode}
                          onChange={(e) => setTwoFaRecoveryCode(e.target.value)}
                          placeholder="XXXX-XXXX"
                          className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white font-mono text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25"
                          required
                        />
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setTwoFaUseRecovery((v) => !v)}
                      className="text-xs font-semibold text-sky-400 hover:text-sky-300 hover:underline cursor-pointer"
                    >
                      {twoFaUseRecovery
                        ? isKm ? 'ប្រើកូដ Authenticator ជំនួសវិញ' : 'Use Authenticator Code instead'
                        : isKm ? 'ប្រើកូដសង្គ្រោះ (Recovery Code)' : 'Use a Recovery Code instead'}
                    </button>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-[0_12px_28px_-8px_rgba(37,99,235,0.6)] transition cursor-pointer disabled:opacity-60"
                    >
                      <span>
                        {loading
                          ? isKm ? 'កំពុងផ្ទៀងផ្ទាត់...' : 'Verifying...'
                          : isKm ? 'ផ្ទៀងផ្ទាត់ និងចូល Admin' : 'Verify & Enter Console'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  /* Standard Admin Email & Google Sign-In */
                  <div className="space-y-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5">
                          {isKm ? 'អ៊ីមែល Admin' : 'Admin Email'}
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="email"
                            autoComplete="username"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@techtonic.store"
                            className={DARK_INPUT_CLASSES}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5">
                          {isKm ? 'ពាក្យសម្ងាត់' : 'Password'}
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className={`${DARK_INPUT_CLASSES} pr-11`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition cursor-pointer"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading || isLockedOut}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-[0_12px_28px_-8px_rgba(37,99,235,0.65)] hover:shadow-[0_16px_34px_-8px_rgba(59,130,246,0.75)] transition-all cursor-pointer disabled:opacity-60"
                      >
                        <span>
                          {loading
                            ? isKm ? 'កំពុងផ្ទៀងផ្ទាត់...' : 'Authenticating...'
                            : isKm ? 'ចូលផ្ទាំង Admin' : 'Sign In to Console'}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>

                    <div className="relative flex items-center justify-center py-1">
                      <div className="border-t border-white/[0.08] w-full" />
                      <span className="bg-[#0b1120] px-3 text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                        {isKm ? 'ឬ' : 'or'}
                      </span>
                      <div className="border-t border-white/[0.08] w-full" />
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleAdminSignIn}
                      disabled={loading || isLockedOut}
                      className="w-full py-2.5 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 hover:border-white/20 text-slate-100 text-xs sm:text-sm font-bold flex items-center justify-center gap-2.5 transition cursor-pointer disabled:opacity-60"
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

                    <div className="pt-4 mt-1 border-t border-white/[0.08] text-center text-xs text-slate-400">
                      {isKm ? 'តើអ្នកជាអតិថិជនមែនទេ?' : 'Shopping as a customer?'}{' '}
                      <Link to="/login" className="font-bold text-sky-400 hover:text-sky-300 hover:underline">
                        {isKm ? 'ចូលគណនីអតិថិជន' : 'Customer Sign In'}
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 py-4 px-6 text-center text-[11px] text-slate-500 border-t border-white/[0.06] bg-[#040711]/70">
        TechTonic Cambodia • Protected Admin Gateway ({adminBase}/login)
      </footer>
    </div>
  );
}
