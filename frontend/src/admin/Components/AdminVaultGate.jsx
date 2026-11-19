import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Lock,
  Copy,
  Download,
  RefreshCw,
  ArrowRight,
  Eye,
  EyeOff,
  LogOut,
  AlertCircle,
  CheckCircle2,
  Shield,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useAuth, useLanguage } from '../../store/StoreContext';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';

const IDLE_LOCK_MS = 15 * 60 * 1000;

export default function AdminVaultGate({ children }) {
  const { user, logout } = useAuth();
  const { language } = useLanguage();

  const [checking, setChecking] = useState(true);
  const [status, setStatus] = useState({ configured: false, unlocked: false, lockedSeconds: 0 });
  const [error, setError] = useState('');

  // Setup state
  const [setupQr, setSetupQr] = useState(null);
  const [setupPin, setSetupPin] = useState('');
  const [setupConfirmPin, setSetupConfirmPin] = useState('');
  const [setupTotp, setSetupTotp] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Unlock state
  const [unlockPin, setUnlockPin] = useState('');
  const [unlockTotp, setUnlockTotp] = useState('');
  const [useRecovery, setUseRecovery] = useState(false);
  const [recoveryInput, setRecoveryInput] = useState('');

  const loadStatus = useCallback(async () => {
    setChecking(true);
    setError('');
    try {
      const data = await adminService.getVaultStatus();
      setStatus(data || { configured: false, unlocked: false, lockedSeconds: 0 });
      if (data && !data.configured && !setupQr) {
        const begin = await adminService.beginVaultSetup();
        setSetupQr(begin);
      }
    } catch (err) {
      setError(err?.message || 'Unable to verify admin session');
    } finally {
      setChecking(false);
    }
  }, [setupQr]);

  useEffect(() => {
    loadStatus();
  }, []);

  useEffect(() => {
    const handleVaultLocked = (e) => {
      setStatus((prev) => ({ ...prev, unlocked: false }));
      if (e?.detail?.message) {
        setError(e.detail.message);
      }
    };
    window.addEventListener('techtonic:admin-vault-locked', handleVaultLocked);
    return () => window.removeEventListener('techtonic:admin-vault-locked', handleVaultLocked);
  }, []);

  useEffect(() => {
    if (!status.unlocked) return undefined;
    let timer;
    const resetIdle = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        await adminService.lockVault();
        setStatus((prev) => ({ ...prev, unlocked: false }));
        setError(
          language === 'km'
            ? 'សម័យប្រជុំត្រូវបានចាក់សោដោយសារអសកម្មភាព ១៥ នាទី។'
            : 'Session locked after 15 minutes of inactivity.'
        );
      }, IDLE_LOCK_MS);
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    events.forEach((ev) => window.addEventListener(ev, resetIdle, { passive: true }));
    resetIdle();
    return () => {
      clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, resetIdle));
    };
  }, [status.unlocked, language]);

  useEffect(() => {
    if (!status.lockedSeconds || status.lockedSeconds <= 0) return undefined;
    const t = setInterval(() => {
      setStatus((prev) => ({
        ...prev,
        lockedSeconds: Math.max(0, (prev.lockedSeconds || 0) - 1),
      }));
    }, 1000);
    return () => clearInterval(t);
  }, [status.lockedSeconds]);

  const handleRegenerateQr = async () => {
    setError('');
    try {
      const begin = await adminService.beginVaultSetup();
      setSetupQr(begin);
    } catch (err) {
      setError(err?.message || 'Failed to refresh QR code');
    }
  };

  const handleCompleteSetup = async (e) => {
    e.preventDefault();
    setError('');
    if (setupPin.trim().length < 6) {
      setError(language === 'km' ? 'Security PIN ត្រូវមានយ៉ាងតិច ៦ តួអក្សរ' : 'Security PIN must be at least 6 characters.');
      return;
    }
    if (setupPin !== setupConfirmPin) {
      setError(language === 'km' ? 'Security PIN ទាំងពីរមិនត្រូវគ្នាទេ' : 'Security PIN confirmation does not match.');
      return;
    }
    if (!/^\d{6}$/.test(setupTotp.trim())) {
      setError(language === 'km' ? 'សូមបញ្ចូលលេខកូដ ៦ ខ្ទង់ពីកម្មវិធី Authenticator' : 'Enter the 6-digit code from your Authenticator app.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await adminService.confirmVaultSetup(setupPin.trim(), setupTotp.trim());
      setRecoveryCodes(res?.recoveryCodes || []);
      setSetupPin('');
      setSetupConfirmPin('');
      setSetupTotp('');
    } catch (err) {
      setError(err?.message || 'Setup confirmation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadRecovery = () => {
    if (!recoveryCodes?.length) return;
    const text = [
      'TechTonic Store — Admin Backup Recovery Codes',
      `Account: ${user?.email || ''}`,
      `Date: ${new Date().toISOString()}`,
      '',
      'Keep these offline. Each code works once:',
      ...recoveryCodes.map((c, i) => `${i + 1}. ${c}`),
    ].join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'techtonic-admin-recovery-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUnlock = async (e) => {
    e.preventDefault();
    setError('');
    if (!unlockPin.trim()) {
      setError(language === 'km' ? 'សូមបញ្ចូល Security PIN' : 'Security PIN is required.');
      return;
    }
    if (!useRecovery && !/^\d{6}$/.test(unlockTotp.trim())) {
      setError(language === 'km' ? 'សូមបញ្ចូលលេខកូដ ៦ ខ្ទង់' : 'Enter your 6-digit verification code.');
      return;
    }
    if (useRecovery && !recoveryInput.trim()) {
      setError(language === 'km' ? 'សូមបញ្ចូល Backup Code' : 'Enter a backup recovery code.');
      return;
    }

    setSubmitting(true);
    try {
      await adminService.unlockVault({
        pin: unlockPin.trim(),
        totpCode: useRecovery ? undefined : unlockTotp.trim(),
        recoveryCode: useRecovery ? recoveryInput.trim() : undefined,
      });
      setUnlockPin('');
      setUnlockTotp('');
      setRecoveryInput('');
      setStatus((prev) => ({ ...prev, configured: true, unlocked: true, lockedSeconds: 0 }));
    } catch (err) {
      setError(err?.message || 'Verification failed');
      if (err?.code === 'ADMIN_VAULT_LOCKED') {
        loadStatus();
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (status.unlocked && !recoveryCodes) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between">
      {/* Brand Header */}
      <header className="w-full border-b border-slate-800/80 bg-[#060b18]/95 backdrop-blur-xl px-3 sm:px-8 py-3 flex items-center justify-between gap-2">
        <Link to="/" className="flex items-center gap-1.5 sm:gap-2 shrink-0 group min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
            <img
              src="/images/logo/techtonic-crest.png"
              alt="TechTonic Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <img
            src="/images/logo/techtonic-script-orange.png"
            alt="TechTonic"
            className="h-5 sm:h-7 w-auto object-contain shrink-0 group-hover:scale-105 transition-transform duration-200"
          />
          <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-[#cafc05] text-slate-950 shadow-sm shrink-0">
            ADMIN
          </span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3 text-xs shrink-0">
          <LanguageSwitcher variant="dark" />
          <span className="hidden sm:inline text-slate-300 font-medium">{user?.email}</span>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white font-semibold cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{language === 'km' ? 'ចាកចេញ' : 'Sign out'}</span>
          </button>
        </div>
      </header>

      {/* Main Card */}
      <main className="flex-1 flex items-center justify-center p-3.5 sm:p-6">
        <div className={`w-full ${!status.configured || recoveryCodes ? 'max-w-lg' : 'max-w-md'} bg-white rounded-2xl border border-slate-200/90 shadow-lg shadow-slate-200/50 p-5 sm:p-8 space-y-5`}>
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {recoveryCodes ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h1 className="text-lg font-bold text-slate-900">
                    {language === 'km' ? 'រក្សាទុកកូដសង្គ្រោះបម្រុង' : 'Save your backup recovery codes'}
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    {language === 'km'
                      ? 'កូដទាំង ៦ នេះបង្ហាញតែម្តងគត់។ សូមរក្សាទុកនៅកន្លែងសុវត្ថិភាពសម្រាប់ប្រើករណីបាត់ទូរស័ព្ទ។'
                      : 'These codes are shown only once. Save them offline in case you lose access to your Authenticator app.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-center">
                {recoveryCodes.map((code) => (
                  <div key={code} className="py-2 px-2.5 rounded-lg bg-white border border-slate-200 text-slate-800 font-bold">
                    {code}
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadRecovery}
                  className="flex-1 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{language === 'km' ? 'ទាញយក (.txt)' : 'Download (.txt)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRecoveryCodes(null);
                    setStatus((prev) => ({ ...prev, configured: true, unlocked: true }));
                  }}
                  className="flex-1 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{language === 'km' ? 'បន្តទៅ Admin' : 'Continue to Admin'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : !status.configured ? (
            <form onSubmit={handleCompleteSetup} className="space-y-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 mb-1">
                  <Shield className="w-3.5 h-3.5" />
                  <span>{language === 'km' ? 'ការការពារគណនី Admin' : 'Admin Security Setup'}</span>
                </div>
                <h1 className="text-xl font-bold text-slate-900">
                  {language === 'km' ? 'ភ្ជាប់ Google Authenticator & PIN' : 'Set up 2-Step Verification'}
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  {language === 'km'
                    ? 'ស្កេន QR Code ដោយកម្មវិធី Authenticator រួចបង្កើត PIN ផ្ទាល់ខ្លួនដាច់ដោយឡែកពី Gmail។'
                    : 'Scan the QR code with Google Authenticator or Authy, then set a private Admin PIN.'}
                </p>
              </div>

              {setupQr && (
                <div className="flex flex-col sm:flex-row items-center gap-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <img
                    src={setupQr.qrDataUrl}
                    alt="Authenticator QR Code"
                    className="w-32 h-32 rounded-lg bg-white p-1.5 border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 w-full space-y-2 text-xs">
                    <span className="font-semibold text-slate-700 block">
                      {language === 'km' ? 'ឬបញ្ចូលកូដដោយដៃ៖' : 'Manual setup key:'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <code className="flex-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 font-mono text-[11px] break-all">
                        {setupQr.secret}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(setupQr.secret);
                          setCopiedSecret(true);
                          setTimeout(() => setCopiedSecret(false), 1500);
                        }}
                        className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 cursor-pointer"
                        title="Copy"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {copiedSecret && <span className="text-[11px] text-emerald-600 font-semibold block">Copied!</span>}
                    <button
                      type="button"
                      onClick={handleRegenerateQr}
                      className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>{language === 'km' ? 'ប្តូរ QR ថ្មី' : 'New QR code'}</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'km' ? 'Security PIN (យ៉ាងតិច ៦ ខ្ទង់)' : 'Security PIN (min 6 chars)'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPin ? 'text' : 'password'}
                      value={setupPin}
                      onChange={(e) => setSetupPin(e.target.value)}
                      placeholder="••••••"
                      className="w-full h-10 pl-3 pr-9 rounded-xl bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-600 text-sm outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'km' ? 'បញ្ជាក់ PIN ម្តងទៀត' : 'Confirm PIN'}
                  </label>
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={setupConfirmPin}
                    onChange={(e) => setSetupConfirmPin(e.target.value)}
                    placeholder="••••••"
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-600 text-sm outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'km' ? 'កូដ ៦ ខ្ទង់ពី Authenticator' : '6-digit Authenticator code'}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={setupTotp}
                  onChange={(e) => setSetupTotp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full h-11 px-4 rounded-xl bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-600 text-center text-lg font-mono tracking-[0.35em] outline-hidden"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {submitting ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{language === 'km' ? 'បញ្ជាក់ និងបន្ត' : 'Verify & Enable'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleUnlock} className="space-y-4">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                  <Lock className="w-5 h-5" />
                </div>
                <h1 className="text-xl font-bold text-slate-900">
                  {language === 'km' ? 'ផ្ទៀងផ្ទាត់អត្តសញ្ញាណ Admin' : 'Verify Admin Access'}
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  {language === 'km'
                    ? 'បញ្ចូល Security PIN និងកូដ ៦ ខ្ទង់ពីទូរស័ព្ទរបស់អ្នកដើម្បីចូលគ្រប់គ្រងហាង។'
                    : 'Enter your Security PIN and Authenticator code to unlock the admin console.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'km' ? 'Security PIN' : 'Security PIN'}
                </label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={unlockPin}
                    onChange={(e) => setUnlockPin(e.target.value)}
                    disabled={status.lockedSeconds > 0}
                    placeholder="••••••"
                    className="w-full h-11 pl-3.5 pr-10 rounded-xl bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-600 text-sm outline-hidden disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {!useRecovery ? (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      {language === 'km' ? 'លេខកូដ Authenticator (៦ ខ្ទង់)' : 'Authenticator Code'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setUseRecovery(true)}
                      className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                    >
                      {language === 'km' ? 'ប្រើ Backup Code' : 'Use backup code'}
                    </button>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    disabled={status.lockedSeconds > 0}
                    value={unlockTotp}
                    onChange={(e) => setUnlockTotp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full h-11 px-4 rounded-xl bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-600 text-center text-lg font-mono tracking-[0.35em] outline-hidden disabled:opacity-50"
                  />
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      {language === 'km' ? 'កូដសង្គ្រោះបម្រុង' : 'Backup Recovery Code'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setUseRecovery(false)}
                      className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                    >
                      {language === 'km' ? 'ប្រើកូដ ៦ ខ្ទង់វិញ' : 'Use authenticator'}
                    </button>
                  </div>
                  <input
                    type="text"
                    disabled={status.lockedSeconds > 0}
                    value={recoveryInput}
                    onChange={(e) => setRecoveryInput(e.target.value.toUpperCase())}
                    placeholder="TTV-XXXX-XXXX"
                    className="w-full h-11 px-4 rounded-xl bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-600 text-center font-mono text-sm uppercase outline-hidden"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || status.lockedSeconds > 0}
                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : status.lockedSeconds > 0 ? (
                  <span>
                    {language === 'km' ? `រង់ចាំ ${status.lockedSeconds} វិនាទី` : `Locked (${status.lockedSeconds}s)`}
                  </span>
                ) : (
                  <>
                    <span>{language === 'km' ? 'ផ្ទៀងផ្ទាត់ និងចូល' : 'Verify & Continue'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="pt-3 border-t border-slate-100 text-center">
            <Link to="/" className="text-xs text-slate-500 hover:text-slate-800 font-medium">
              ← {language === 'km' ? 'ត្រឡប់ទៅហាងវិញ' : 'Back to TechTonic Store'}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
