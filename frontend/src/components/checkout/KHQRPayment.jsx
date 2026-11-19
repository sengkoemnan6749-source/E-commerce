import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Copy, Check, Smartphone, RefreshCw, Loader2, Clock, AlertCircle } from 'lucide-react';
import { formatUSD, formatKHR } from '../../utils/formatPrice';
import { useToast, useLanguage } from '../../store/StoreContext';
import { paymentService } from '../../services/paymentService';
import Button from '../common/Button';
import VerifiedCheckmark from '../common/VerifiedCheckmark';

export default function KHQRPayment({
  totalAmount = 0,
  cartItems = null,
  promoCode = null,
  customerInfo = null,
  onPaymentSuccess,
  onSessionChange,
}) {
  const { addToast } = useToast();
  const { language } = useLanguage();
  const [currency, setCurrency] = useState('USD');
  const [session, setSession] = useState(null);
  const [loadingQr, setLoadingQr] = useState(true);
  const [qrError, setQrError] = useState('');
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [awaitingAdmin, setAwaitingAdmin] = useState(false);
  const [paidConfirmed, setPaidConfirmed] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(600);

  const onSessionChangeRef = useRef(onSessionChange);
  const onPaymentSuccessRef = useRef(onPaymentSuccess);
  const languageRef = useRef(language);
  const addToastRef = useRef(addToast);
  const cartItemsRef = useRef(cartItems);
  const promoCodeRef = useRef(promoCode);
  useEffect(() => {
    onSessionChangeRef.current = onSessionChange;
    onPaymentSuccessRef.current = onPaymentSuccess;
    languageRef.current = language;
    addToastRef.current = addToast;
    cartItemsRef.current = cartItems;
    promoCodeRef.current = promoCode;
  }, [onSessionChange, onPaymentSuccess, language, addToast, cartItems, promoCode]);

  const cartSignature = JSON.stringify({
    items: Array.isArray(cartItems)
      ? cartItems.map((i) => ({ id: i.id, qty: i.quantity, variant: i.variant || null }))
      : null,
    promoCode: promoCode || null,
  });

  const isExpired = Boolean(session && secondsLeft <= 0 && !paidConfirmed);

  const generateSession = useCallback(async () => {
    const numericAmount = Number(totalAmount || 0);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setSession(null);
      onSessionChangeRef.current?.(null);
      setQrError(
        languageRef.current === 'km'
          ? 'ចំនួនទឹកប្រាក់គឺ $0.00 — Bakong KHQR តម្រូវឱ្យមានទឹកប្រាក់យ៉ាងតិច $0.01 (ឬចុច "បញ្ជាក់ និងបញ្ចប់ការកុម្ម៉ង់" ដោយផ្ទាល់)។'
          : 'Order total is $0.00 — Bakong KHQR requires at least $0.01 (or click "Confirm & Complete Order" directly).'
      );
      setLoadingQr(false);
      return;
    }

    setLoadingQr(true);
    setQrError('');
    setAwaitingAdmin(false);
    setPaidConfirmed(false);
    try {
      const requestAmount = currency === 'KHR' ? Math.max(1, Math.round(numericAmount * 4100)) : numericAmount;
      const data = await paymentService.initiateKHQRPayment(requestAmount, currency, {
        items: cartItemsRef.current,
        promoCode: promoCodeRef.current,
      });
      setSession(data);
      onSessionChangeRef.current?.(data);
      if (data?.expiresAt) {
        const diff = Math.max(0, Math.floor((new Date(data.expiresAt).getTime() - Date.now()) / 1000));
        setSecondsLeft(diff);
      } else {
        setSecondsLeft(600);
      }
    } catch (err) {
      setSession(null);
      onSessionChangeRef.current?.(null);
      setQrError(
        err?.message ||
          (languageRef.current === 'km'
            ? 'មិនអាចបង្កើតកូដ QR Bakong បានទេ — សូមពិនិត្យ Backend Server រួចសាកម្តងទៀត'
            : 'Unable to generate Bakong KHQR code — verify backend server connection and retry.')
      );
    } finally {
      setLoadingQr(false);
    }
  }, [totalAmount, currency, cartSignature]);

  useEffect(() => {
    generateSession();
  }, [generateSession]);

  // Countdown timer
  useEffect(() => {
    if (!session || paidConfirmed || isExpired) return undefined;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [session, paidConfirmed, isExpired]);

  // Conserve NBC Bakong 100 req/day quota: poll every 8s up to 15 checks (~2 min); user can always tap Check Now
  useEffect(() => {
    if (!session?.md5Hash || !session?.liveVerificationEnabled || paidConfirmed || isExpired) {
      return undefined;
    }

    let stopped = false;
    let pollCount = 0;
    const pollId = window.setInterval(async () => {
      if (stopped || document.visibilityState !== 'visible') return;
      pollCount += 1;
      if (pollCount > 15) {
        window.clearInterval(pollId);
        return;
      }
      try {
        const res = await paymentService.verifyKHQRPayment(session.md5Hash, {
          amount: session.amount,
          mode: 'poll',
        });
        if (!stopped && res?.status === 'PAID') {
          setPaidConfirmed(true);
          onPaymentSuccessRef.current?.(res);
        }
      } catch {
        // Silent retry on next poll tick
      }
    }, 8000);

    return () => {
      stopped = true;
      window.clearInterval(pollId);
    };
  }, [session, paidConfirmed, isExpired]);

  // Fast 2.5s polling while awaiting Admin 1-Tap Confirm on Telegram Order Bot
  useEffect(() => {
    if (!awaitingAdmin || !session?.transactionId || paidConfirmed || isExpired) {
      return undefined;
    }

    let stopped = false;
    const pollAdmin = async () => {
      if (stopped) return;
      try {
        const res = await paymentService.verifyKHQRPayment(session.transactionId, {
          amount: session.amount,
          mode: 'poll',
        });
        if (stopped) return;
        if (res?.status === 'PAID') {
          setPaidConfirmed(true);
          setAwaitingAdmin(false);
          onPaymentSuccessRef.current?.({
            ...res,
            payerAccountName: res?.payerAccountName || res?.bakongData?.fromAccountName || res?.bakongData?.fromAccountId || null,
          });
        } else if (res?.status === 'REJECTED') {
          setAwaitingAdmin(false);
          addToastRef.current?.(
            languageRef.current === 'km'
              ? 'ម្ចាស់ហាងមិនទាន់ឃើញប្រាក់ចូលទេ — សូមពិនិត្យការផ្ទេរប្រាក់ម្តងទៀត'
              : 'Shop owner has not received the transfer yet — please verify and try again.',
            'error'
          );
        }
      } catch {
        // Silent retry
      }
    };

    const firstTick = window.setTimeout(pollAdmin, 350);
    const timerId = window.setInterval(pollAdmin, 2500);
    return () => {
      stopped = true;
      window.clearTimeout(firstTick);
      window.clearInterval(timerId);
    };
  }, [awaitingAdmin, session, paidConfirmed, isExpired]);

  const handleCopy = () => {
    if (!session?.khqrString) return;
    navigator.clipboard?.writeText(session.khqrString);
    setCopied(true);
    addToast(
      language === 'km'
        ? 'បានចម្លងកូដទូទាត់ KHQR ទៅកាន់ក្ដារតម្បៀតខ្ទាស់'
        : 'KHQR payment string copied to clipboard',
      'info'
    );
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmPayment = async () => {
    if (!session) return;

    setVerifying(true);
    try {
      const target = session.transactionId || session.md5Hash;
      const mode = session.telegramVerificationEnabled && !session.liveVerificationEnabled ? 'telegram_request' : 'manual';
      const result = await paymentService.verifyKHQRPayment(target, {
        amount: session.amount,
        mode,
        customerName: customerInfo?.name,
        customerPhone: customerInfo?.phone,
      });
      if (result?.status === 'PAID') {
        setPaidConfirmed(true);
        setAwaitingAdmin(false);
        if (onPaymentSuccess) {
          await onPaymentSuccess({
            ...result,
            payerAccountName:
              result?.payerAccountName ||
              result?.bakongData?.fromAccountName ||
              result?.bakongData?.fromAccountId ||
              null,
          });
        }
      } else if (result?.status === 'AWAITING_ADMIN') {
        setAwaitingAdmin(true);
        addToast(
          language === 'km'
            ? 'បានផ្ញើសំណើទៅ Telegram ម្ចាស់ហាងហើយ — កំពុងរង់ចាំការចុច Confirm Paid...'
            : 'Verification sent to shop Telegram — waiting for confirmation...',
          'info'
        );
      } else {
        addToast(
          result?.message ||
            (language === 'km' ? 'មិនទាន់ឃើញការទូទាត់នៅឡើយទេ សូមស្កេនបង់ជាមុនសិន' : 'Payment not received yet. Please complete transfer first.'),
          'info'
        );
      }
    } catch (err) {
      addToast(
        err?.message ||
          (language === 'km' ? 'មិនទាន់ផ្ទៀងផ្ទាត់ការទូទាត់បានទេ' : 'Could not verify payment yet'),
        'error'
      );
    } finally {
      setVerifying(false);
    }
  };

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');

  return (
    <div className="flex flex-col items-center p-4 sm:p-7 rounded-2xl bg-[#fafafa] border border-slate-200 text-center">
      {/* Currency Selector (USD / KHR) */}
      <div className="inline-flex flex-wrap justify-center items-center p-1 rounded-xl bg-white border border-slate-200 shadow-2xs mb-4 max-w-full">
        {[
          { code: 'USD', label: language === 'km' ? 'ដុល្លារ ($ USD)' : 'USD ($)' },
          { code: 'KHR', label: language === 'km' ? 'ប្រាក់រៀល (៛ KHR)' : 'KHR (៛)' },
        ].map((opt) => (
          <button
            key={opt.code}
            type="button"
            disabled={loadingQr || paidConfirmed}
            onClick={() => setCurrency(opt.code)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-60 ${
              currency === opt.code
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Authentic KHQR Card Frame */}
      <div className="w-full max-w-xs bg-white rounded-2xl shadow-xl border-2 border-red-500 overflow-hidden mb-5">
        {/* Red KHQR Top Banner */}
        <div className="bg-red-600 px-4 py-2.5 flex items-center justify-between text-white">
          <div className="flex items-center gap-1.5 font-black text-sm tracking-wider">
            <span className="bg-white text-red-600 px-1.5 py-0.5 rounded font-black text-xs">
              KHQR
            </span>
            <span>BAKONG</span>
          </div>
          <span className="text-[10px] font-semibold tracking-wide uppercase text-red-100">
            {language === 'km' ? 'ស្តង់ដារ NBC' : 'NBC Standard'}
          </span>
        </div>

        {/* Merchant Info */}
        <div className="px-4 pt-3 pb-2 text-center border-b border-slate-100">
          <h4 className="text-xs font-bold text-slate-900 tracking-tight">
            {session?.merchantName || 'TechTonic Store'}
          </h4>
          <p className="text-[11px] font-mono text-slate-500 mt-0.5">
            {session?.bakongAccountId || 'seng_koemnan@bkrt'}
          </p>
        </div>

        {/* Real Scannable Dynamic Bakong QR Code */}
        <div className="p-5 flex items-center justify-center bg-white min-h-[232px]">
          {loadingQr ? (
            <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
              <Loader2 className="w-7 h-7 animate-spin text-red-600" />
              <span className="text-xs font-medium">
                {language === 'km' ? 'កំពុងបង្កើតកូដ KHQR...' : 'Generating Bakong KHQR...'}
              </span>
            </div>
          ) : qrError ? (
            <div className="flex flex-col items-center justify-center gap-3 px-2">
              <AlertCircle className="w-8 h-8 text-rose-500" />
              <p className="text-xs text-slate-600 leading-relaxed">{qrError}</p>
              <button
                type="button"
                onClick={generateSession}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{language === 'km' ? 'ព្យាយាមម្តងទៀត' : 'Retry'}</span>
              </button>
            </div>
          ) : (
            <div className="relative p-2 rounded-xl bg-white border border-slate-200 shadow-inner">
              <img
                src={session.qrDataUrl}
                alt="Bakong KHQR Code"
                className={`w-48 h-48 object-contain ${isExpired ? 'opacity-25 blur-[1px]' : ''}`}
              />
              {isExpired ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <span className="text-xs font-bold text-slate-800 bg-white/90 px-2 py-1 rounded">
                    {language === 'km' ? 'QR ផុតកំណត់ហើយ' : 'QR Expired'}
                  </span>
                  <button
                    type="button"
                    onClick={generateSession}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>{language === 'km' ? 'បង្កើត QR ថ្មី' : 'New QR'}</span>
                  </button>
                </div>
              ) : paidConfirmed ? (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-xs rounded-xl flex flex-col items-center justify-center gap-2 border border-slate-100">
                  <VerifiedCheckmark size="sm" />
                  <span className="text-xs font-semibold text-emerald-700">
                    {language === 'km' ? 'ទទួលការទូទាត់ជោគជ័យ' : 'Payment received'}
                  </span>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center font-black text-[9px] shadow-lg border-2 border-white">
                    KHQR
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Amount & Live Expiry Section */}
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 flex flex-col items-center">
          <div className="text-xl font-extrabold text-slate-900 tracking-tight">
            {currency === 'KHR' ? formatKHR(totalAmount) : formatUSD(totalAmount)}
          </div>
          <div className="text-xs font-semibold text-slate-500">
            {currency === 'KHR' ? formatUSD(totalAmount) : formatKHR(totalAmount)}
          </div>
          {session && !paidConfirmed && (
            <div className="mt-1.5 inline-flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-[11px] font-mono text-slate-500">
              {session.billNumber && (
                <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-bold text-slate-700">
                  Ref: {session.billNumber}
                </span>
              )}
              <Clock className="w-3 h-3 text-red-500" />
              <span>{mins}:{secs}</span>
              {session.liveVerificationEnabled && (
                <span className="ml-1 inline-flex items-center gap-1 text-slate-700 font-sans font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {language === 'km' ? 'រង់ចាំទូទាត់ (ផ្ទៀងផ្ទាត់ស្វ័យប្រវត្តិ)' : 'Auto-checking'}
                </span>
              )}
              {!session.liveVerificationEnabled && awaitingAdmin && (
                <span className="ml-1 inline-flex items-center gap-1 text-slate-700 font-sans font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700 animate-pulse" />
                  {language === 'km' ? 'រង់ចាំបញ្ជាក់លើ Telegram' : 'Waiting Telegram'}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Concise Instructions & Single Action Row */}
      <div className="w-full max-w-xs space-y-3">
        <p className="text-[11px] text-slate-500 leading-relaxed">
          {language === 'km'
            ? 'គាំទ្រ Bakong · ABA · Wing · ACLEDA · Sathapana · Canadia'
            : 'Supports Bakong · ABA · Wing · ACLEDA · Sathapana · Canadia'}
        </p>

        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={!session?.khqrString}
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white px-3 py-2 rounded-xl border border-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>
              {copied
                ? language === 'km'
                  ? 'បានចម្លង'
                  : 'Copied'
                : language === 'km'
                ? 'ចម្លង QR'
                : 'Copy QR'}
            </span>
          </button>

          <button
            type="button"
            disabled={loadingQr}
            onClick={generateSession}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white px-3 py-2 rounded-xl border border-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingQr ? 'animate-spin' : ''}`} />
            <span>{language === 'km' ? 'QR ថ្មី' : 'Refresh'}</span>
          </button>
        </div>

        {awaitingAdmin && !paidConfirmed && (
          <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-700 flex items-center justify-center gap-2.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-700 shrink-0" />
            <span className="font-medium">
              {language === 'km'
                ? 'កំពុងរង់ចាំម្ចាស់ហាងបញ្ជាក់ការទូទាត់លើ Telegram...'
                : 'Waiting for shop confirmation on Telegram...'}
            </span>
          </div>
        )}

        <Button
          type="button"
          variant="secondary"
          size="md"
          loading={verifying}
          disabled={!session || loadingQr || isExpired || paidConfirmed}
          onClick={handleConfirmPayment}
          className="w-full font-semibold rounded-xl"
        >
          <Smartphone className="w-4 h-4 mr-1.5" />
          <span>
            {awaitingAdmin
              ? language === 'km'
                ? 'ផ្ញើសំណើទៅ Telegram ម្តងទៀត'
                : 'Resend Telegram Request'
              : session?.liveVerificationEnabled
              ? language === 'km'
                ? 'ខ្ញុំបានបង់ប្រាក់រួច — ពិនិត្យឥឡូវនេះ'
                : 'I Have Paid — Check Now'
              : session?.telegramVerificationEnabled
              ? language === 'km'
                ? 'ខ្ញុំបានបង់ប្រាក់រួច — ផ្ទៀងផ្ទាត់តាម Telegram'
                : 'I Have Paid — Verify on Telegram'
              : language === 'km'
              ? 'ខ្ញុំបានបង់ប្រាក់រួច — បញ្ចប់ការកុម្ម៉ង់'
              : 'I Have Paid — Complete Order'}
          </span>
        </Button>
      </div>
    </div>
  );
}
