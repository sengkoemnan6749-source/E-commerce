import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Mail,
  Phone,
  Building,
  Save,
  Lock,
  ShieldCheck,
  Copy,
  Download,
  CheckCircle2,
  AlertCircle,
  Camera,
  Trash2,
} from 'lucide-react';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import { useAuth, useToast, useLanguage } from '../../../store/StoreContext';
import { authService } from '../../../services/authService';
import { evaluatePasswordStrength } from '../../../utils/validation';
import { resizeAvatarImage, hasCustomAvatar } from '../../../utils/imageUtils';

export default function AccountProfile() {
  const { user, updateProfile } = useAuth();
  const { addToast } = useToast();
  const { language } = useLanguage();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    workspace: 'Software Development & Pro Media Studio',
  });
  const [saving, setSaving] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarImgError, setAvatarImgError] = useState(false);
  const avatarFileRef = useRef(null);

  // Password Change / Set State
  const [securityInfo, setSecurityInfo] = useState(() => authService.getSignInSecurityInfo());
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');

  // Optional 2FA State
  const [twoFaLoading, setTwoFaLoading] = useState(true);
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [setupData, setSetupData] = useState(null);
  const [setupCode, setSetupCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState(null);
  const [disableMode, setDisableMode] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [twoFaError, setTwoFaError] = useState('');
  const [twoFaSubmitting, setTwoFaSubmitting] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  useEffect(() => {
    setSecurityInfo(authService.getSignInSecurityInfo());
    let active = true;
    authService
      .getTwoFactorStatus()
      .then((res) => {
        if (!active) return;
        setTwoFaEnabled(Boolean(res?.enabled));
      })
      .finally(() => {
        if (active) setTwoFaLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user?.uid]);

  useEffect(() => {
    setAvatarImgError(false);
  }, [user?.avatar]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAvatarBusy(true);
    try {
      const dataUrl = await resizeAvatarImage(file, 256);
      await updateProfile({ avatar: dataUrl });
    } catch (err) {
      addToast(
        err?.message || (language === 'km' ? 'មិនអាចផ្ទុករូបភាពបានទេ' : 'Failed to upload image'),
        'error'
      );
    } finally {
      setAvatarBusy(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarBusy(true);
    try {
      await updateProfile({ avatar: '' });
    } finally {
      setAvatarBusy(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(formData);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwError('');

    const pwEval = evaluatePasswordStrength(newPassword, user?.email || '', user?.name || '');
    if (!pwEval.isValid) {
      setPwError(
        language === 'km'
          ? 'ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងតិច ៨ តួអក្សរ រួមមាន អក្សរធំ អក្សរតូច លេខ និងនិមិត្តសញ្ញា (!@#$)'
          : 'New password must be 8+ characters with uppercase, lowercase, number, and symbol (!@#$).'
      );
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPwError(
        language === 'km' ? 'ពាក្យសម្ងាត់ថ្មីទាំងពីរមិនត្រូវគ្នាទេ' : 'New passwords do not match.'
      );
      return;
    }

    setPwSaving(true);
    try {
      const res = await authService.changeOrSetPassword({
        currentPassword,
        newPassword,
      });
      setSecurityInfo(authService.getSignInSecurityInfo());
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      addToast(
        res.mode === 'set'
          ? language === 'km'
            ? 'បានបង្កើតពាក្យសម្ងាត់សម្រាប់គណនីដោយជោគជ័យ!'
            : 'Account password set successfully! You can now sign in with Email + Password too.'
          : language === 'km'
            ? 'បានផ្លាស់ប្តូរពាក្យសម្ងាត់ដោយជោគជ័យ!'
            : 'Password updated successfully!',
        'success'
      );
    } catch (err) {
      setPwError(err?.message || 'Failed to update password');
    } finally {
      setPwSaving(false);
    }
  };

  const handleBegin2fa = async () => {
    setTwoFaError('');
    setTwoFaSubmitting(true);
    try {
      const data = await authService.beginTwoFactorSetup();
      setSetupData(data);
    } catch (err) {
      setTwoFaError(err?.message || 'Failed to initialize 2FA setup');
    } finally {
      setTwoFaSubmitting(false);
    }
  };

  const handleConfirm2fa = async (e) => {
    e.preventDefault();
    setTwoFaError('');
    if (!/^\d{6}$/.test(setupCode.trim())) {
      setTwoFaError(
        language === 'km' ? 'សូមបញ្ចូលលេខកូដ ៦ ខ្ទង់' : 'Enter the 6-digit Authenticator code.'
      );
      return;
    }
    setTwoFaSubmitting(true);
    try {
      const res = await authService.confirmTwoFactorSetup(setupCode.trim());
      setTwoFaEnabled(true);
      setSetupData(null);
      setSetupCode('');
      setRecoveryCodes(res?.recoveryCodes || []);
      addToast(
        language === 'km'
          ? 'បានបើកការការពារ 2FA ដោយជោគជ័យ!'
          : 'Two-factor authentication enabled!',
        'success'
      );
    } catch (err) {
      setTwoFaError(err?.message || 'Verification failed');
    } finally {
      setTwoFaSubmitting(false);
    }
  };

  const handleDisable2fa = async (e) => {
    e.preventDefault();
    setTwoFaError('');
    if (!disableCode.trim()) {
      setTwoFaError(
        language === 'km'
          ? 'សូមបញ្ចូលលេខកូដ ៦ ខ្ទង់ ឬ Backup Code ដើម្បីបិទ 2FA'
          : 'Enter your 6-digit Authenticator code or backup code to disable 2FA.'
      );
      return;
    }
    setTwoFaSubmitting(true);
    try {
      const isSixDigits = /^\d{6}$/.test(disableCode.trim());
      await authService.disableTwoFactor({
        totpCode: isSixDigits ? disableCode.trim() : undefined,
        recoveryCode: isSixDigits ? undefined : disableCode.trim(),
      });
      setTwoFaEnabled(false);
      setDisableMode(false);
      setDisableCode('');
      setRecoveryCodes(null);
      addToast(
        language === 'km'
          ? 'បានបិទការការពារ 2FA ហើយ។'
          : 'Two-factor authentication disabled.',
        'info'
      );
    } catch (err) {
      setTwoFaError(err?.message || 'Unable to disable 2FA');
    } finally {
      setTwoFaSubmitting(false);
    }
  };

  const handleDownloadRecovery = () => {
    if (!recoveryCodes?.length) return;
    const text = [
      'TechTonic Store — Account Backup Recovery Codes',
      `Account: ${user?.email || ''}`,
      '',
      ...recoveryCodes.map((c, i) => `${i + 1}. ${c}`),
    ].join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'techtonic-account-recovery-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-10">
      {/* 1. PERSONAL INFORMATION */}
      <div>
        <div className="pb-4 border-b border-slate-100 mb-6">
          <h2 className="text-lg font-bold text-slate-900">
            {language === 'km' ? 'ព័ត៌មានផ្ទាល់ខ្លួន' : 'Personal Information'}
          </h2>
          <p className="text-xs text-slate-500">
            {language === 'km'
              ? 'គ្រប់គ្រងព័ត៌មានទំនាក់ទំនង និងប្រវត្តិរូបរបស់អ្នកសម្រាប់វិក្កយបត្រ។'
              : 'Manage your contact credentials and professional profile for invoices.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
          {/* Profile Photo Picker */}
          <div className="flex flex-wrap items-center gap-4 pb-3 border-b border-slate-100">
            <input
              ref={avatarFileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl font-black overflow-hidden shrink-0 border border-slate-200">
              {hasCustomAvatar(user) && !avatarImgError ? (
                <img
                  src={user.avatar}
                  alt={user?.name || 'Profile'}
                  onError={() => setAvatarImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{(user?.name || user?.fullName || user?.email || 'U').charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1 min-w-[200px]">
              <div className="text-xs font-bold text-slate-800 mb-1.5">
                {language === 'km' ? 'រូបភាពគណនី (Profile Photo)' : 'Profile Photo'}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={avatarBusy}
                  onClick={() => avatarFileRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>
                    {avatarBusy
                      ? language === 'km'
                        ? 'កំពុងផ្ទុក...'
                        : 'Uploading...'
                      : language === 'km'
                      ? 'ប្តូររូបភាព'
                      : 'Upload Photo'}
                  </span>
                </button>
                {hasCustomAvatar(user) && (
                  <button
                    type="button"
                    disabled={avatarBusy}
                    onClick={handleRemoveAvatar}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{language === 'km' ? 'លុបចេញ' : 'Remove'}</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {language === 'km' ? 'ប្រភេទ JPG, PNG ឬ WebP (កាត់ជារាងការ៉េដោយស្វ័យប្រវត្តិ)' : 'JPG, PNG, or WebP · Automatically cropped to square'}
              </p>
            </div>
          </div>

          <Input
            label={language === 'km' ? 'ឈ្មោះពេញផ្លូវការ *' : 'Full Legal Name *'}
            icon={User}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label={language === 'km' ? 'អាសយដ្ឋានអ៊ីមែល *' : 'Email Address *'}
            type="email"
            icon={Mail}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <Input
            label={language === 'km' ? 'លេខទូរស័ព្ទចល័ត *' : 'Mobile Phone Number *'}
            icon={Phone}
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />

          <Input
            label={language === 'km' ? 'កន្លែងធ្វើការ / ស្ថាប័ន' : 'Workspace / Organization'}
            icon={Building}
            value={formData.workspace}
            onChange={(e) => setFormData({ ...formData, workspace: e.target.value })}
            helperText={
              language === 'km'
                ? 'នឹងត្រូវបង្ហាញនៅលើវិញ្ញាបនបត្រធានាផ្លូវការរបស់អ្នក'
                : 'Will be displayed on your official serialized warranty certificate'
            }
          />

          <div className="pt-2">
            <Button type="submit" variant="primary" size="md" loading={saving}>
              <Save className="w-4 h-4 mr-2" />
              <span>{language === 'km' ? 'រក្សាទុកការផ្លាស់ប្តូរ' : 'Save Changes'}</span>
            </Button>
          </div>
        </form>
      </div>

      {/* 2. PASSWORD MANAGEMENT (CHANGE OR SET FOR GOOGLE USERS) */}
      <div className="pt-6 border-t border-slate-100">
        <div className="pb-4 border-b border-slate-100 mb-6">
          <h2 className="text-lg font-bold text-slate-900">
            {securityInfo.hasPassword
              ? language === 'km'
                ? 'ផ្លាស់ប្តូរពាក្យសម្ងាត់'
                : 'Change Password'
              : language === 'km'
                ? 'បង្កើតពាក្យសម្ងាត់បន្ថែម'
                : 'Set Account Password'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {securityInfo.hasPassword
              ? language === 'km'
                ? 'ធ្វើបច្ចុប្បន្នភាពពាក្យសម្ងាត់របស់អ្នកឱ្យកាន់តែមានសុវត្ថិភាព។'
                : 'Update your account password to keep your account secure.'
              : language === 'km'
                ? 'គណនីរបស់អ្នកបានភ្ជាប់តាម Google។ អ្នកអាចកំណត់ពាក្យសម្ងាត់បន្ថែម ដើម្បីចូលតាម Email + Password បានផងដែរ។'
                : 'You currently sign in with Google. Set a password if you also want to sign in with your email and password.'}
          </p>
        </div>

        <form onSubmit={handlePasswordSubmit} className="max-w-xl space-y-4">
          {pwError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{pwError}</span>
            </div>
          )}

          {securityInfo.hasPassword && (
            <Input
              label={language === 'km' ? 'ពាក្យសម្ងាត់បច្ចុប្បន្ន *' : 'Current Password *'}
              type="password"
              icon={Lock}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          )}

          <Input
            label={language === 'km' ? 'ពាក្យសម្ងាត់ថ្មី *' : 'New Password *'}
            type="password"
            icon={Lock}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="8+ chars (Aa1!)"
            required
          />

          <Input
            label={language === 'km' ? 'បញ្ជាក់ពាក្យសម្ងាត់ថ្មី *' : 'Confirm New Password *'}
            type="password"
            icon={Lock}
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            required
          />

          <div className="pt-1">
            <Button type="submit" variant="primary" size="md" loading={pwSaving}>
              <Lock className="w-4 h-4 mr-2" />
              <span>
                {securityInfo.hasPassword
                  ? language === 'km'
                    ? 'ផ្លាស់ប្តូរពាក្យសម្ងាត់'
                    : 'Update Password'
                  : language === 'km'
                    ? 'រក្សាទុកពាក្យសម្ងាត់ថ្មី'
                    : 'Set Password'}
              </span>
            </Button>
          </div>
        </form>
      </div>

      {/* 3. OPTIONAL TWO-FACTOR AUTHENTICATION (2FA) */}
      <div className="pt-6 border-t border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                {language === 'km' ? 'ការផ្ទៀងផ្ទាត់ ២ ជំហាន (2FA)' : 'Two-Factor Authentication (2FA)'}
              </h2>
              {!twoFaLoading && (
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    twoFaEnabled
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {twoFaEnabled
                    ? language === 'km'
                      ? 'បានបើក'
                      : 'Enabled'
                    : language === 'km'
                      ? 'មិនទាន់បើក'
                      : 'Off'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'km'
                ? 'ការពារគណនីរបស់អ្នកបន្ថែមជាមួយកម្មវិធី Google Authenticator នៅពេលចូលប្រើប្រាស់។'
                : 'Add an extra layer of security with a 6-digit code from Google Authenticator when signing in.'}
            </p>
          </div>
        </div>

        <div className="max-w-xl space-y-4">
          {twoFaError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{twoFaError}</span>
            </div>
          )}

          {recoveryCodes ? (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-start gap-2.5 text-emerald-700">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    {language === 'km' ? 'កូដសង្គ្រោះបម្រុងរបស់អ្នក' : 'Save your backup recovery codes'}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {language === 'km'
                      ? 'រក្សាទុកកូដទាំង ៦ នេះ (បង្ហាញម្តងគត់) សម្រាប់ប្រើពេលបាត់ទូរស័ព្ទ៖'
                      : 'Shown once. Save these codes offline in case you lose access to your phone:'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs text-center">
                {recoveryCodes.map((c) => (
                  <div key={c} className="py-1.5 px-2 rounded-lg bg-white border border-slate-200 font-bold text-slate-800">
                    {c}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2.5">
                <Button type="button" variant="secondary" size="sm" onClick={handleDownloadRecovery}>
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  <span>{language === 'km' ? 'ទាញយក (.txt)' : 'Download (.txt)'}</span>
                </Button>
                <Button type="button" variant="primary" size="sm" onClick={() => setRecoveryCodes(null)}>
                  <span>{language === 'km' ? 'រួចរាល់' : 'Done'}</span>
                </Button>
              </div>
            </div>
          ) : setupData ? (
            <form onSubmit={handleConfirm2fa} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <img
                  src={setupData.qrDataUrl}
                  alt="2FA QR Code"
                  className="w-32 h-32 rounded-xl bg-white p-1.5 border border-slate-200 shrink-0"
                />
                <div className="flex-1 w-full space-y-2 text-xs">
                  <div className="font-bold text-slate-800">
                    {language === 'km'
                      ? '១) ស្កេន QR Code ជាមួយ Google Authenticator'
                      : '1) Scan with Google Authenticator'}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <code className="flex-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 font-mono text-[11px] break-all">
                      {setupData.secret}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(setupData.secret);
                        setCopiedSecret(true);
                        setTimeout(() => setCopiedSecret(false), 1500);
                      }}
                      className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {copiedSecret && <span className="text-emerald-600 font-semibold block">Copied!</span>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'km' ? '២) បញ្ចូលលេខកូដ ៦ ខ្ទង់' : '2) Enter 6-digit verification code'}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={setupCode}
                  onChange={(e) => setSetupCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full h-11 px-4 rounded-xl bg-white border border-slate-200 focus:border-blue-600 text-center font-mono text-lg tracking-[0.35em] outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2.5">
                <Button type="submit" variant="primary" size="sm" loading={twoFaSubmitting}>
                  <span>{language === 'km' ? 'បើកដំណើរការ 2FA' : 'Confirm & Enable'}</span>
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSetupData(null);
                    setSetupCode('');
                  }}
                >
                  <span>{language === 'km' ? 'បោះបង់' : 'Cancel'}</span>
                </Button>
              </div>
            </form>
          ) : twoFaEnabled ? (
            <div className="space-y-3">
              {!disableMode ? (
                <Button type="button" variant="secondary" size="sm" onClick={() => setDisableMode(true)}>
                  <span>{language === 'km' ? 'បិទ 2FA' : 'Disable 2FA'}</span>
                </Button>
              ) : (
                <form onSubmit={handleDisable2fa} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <label className="block text-xs font-bold text-slate-700">
                    {language === 'km'
                      ? 'បញ្ចូលកូដ ៦ ខ្ទង់ពី Authenticator ឬ Backup Code ដើម្បីបិទ 2FA'
                      : 'Enter 6-digit Authenticator code or backup code to disable 2FA'}
                  </label>
                  <input
                    type="text"
                    value={disableCode}
                    onChange={(e) => setDisableCode(e.target.value.toUpperCase())}
                    placeholder="000000"
                    className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 text-sm font-mono outline-hidden"
                  />
                  <div className="flex items-center gap-2">
                    <Button type="submit" variant="primary" size="sm" loading={twoFaSubmitting}>
                      <span>{language === 'km' ? 'បញ្ជាក់ការបិទ 2FA' : 'Confirm Disable'}</span>
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setDisableMode(false);
                        setDisableCode('');
                      }}
                    >
                      <span>{language === 'km' ? 'បោះបង់' : 'Cancel'}</span>
                    </Button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <Button
              type="button"
              variant="secondary"
              size="md"
              loading={twoFaSubmitting || twoFaLoading}
              onClick={handleBegin2fa}
            >
              <ShieldCheck className="w-4 h-4 mr-2" />
              <span>{language === 'km' ? 'បើកការការពារ 2FA' : 'Enable Two-Factor Authentication'}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
