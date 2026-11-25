import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Copy, Check, RefreshCw, Loader2, Clock, AlertCircle } from 'lucide-react';
import { formatUSD, formatKHR } from '../../utils/formatPrice';
import { useToast, useLanguage } from '../../store/StoreContext';
import { paymentService } from '../../services/paymentService';
import VerifiedCheckmark from '../common/VerifiedCheckmark';

// Celebratory 4-note chord chime when KHQR payment is auto-verified
function playSuccessSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.11);
      gain.gain.setValueAtTime(0.16, ctx.currentTime + idx * 0.11);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.11 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.11);
      osc.stop(ctx.currentTime + idx * 0.11 + 0.35);
    });
  } catch {
    // Ignore audio context autoplay restriction errors
  }
}

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
  const [awaitingAdmin, setAwaitingAdmin] = useState(false);
  const [paidConfirmed, setPaidConfirmed] = useState(false);
  // 5-minute countdown timer (300 seconds) matching https://khqr-aba-autoverify.vercel.app
  const [secondsLeft, setSecondsLeft] = useState(300);

  const onSessionChangeRef = useRef(onSessionChange);
  const onPaymentSuccessRef = useRef(onPaymentSuccess);
  const languageRef = useRef(language);
  const addToastRef = useRef(addToast);
  const cartItemsRef = useRef(cartItems);
  const promoCodeRef = useRef(promoCode);
  const settledOnceRef = useRef(false);

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

  const handleVerifiedPaid = useCallback((paidResult) => {
    if (settledOnceRef.current) return;
    settledOnceRef.current = true;
    setPaidConfirmed(true);
    setAwaitingAdmin(false);
    playSuccessSound();
    addToastRef.current?.(
      languageRef.current === 'km'
        ? '✅ ការទូទាត់ KHQR ត្រូវបានផ្ទៀងផ្ទាត់ដោយស្វ័យប្រវត្តិ!'
        : '✅ KHQR Payment Auto-Verified Successfully!',
      'success'
    );
    const payerName =
      paidResult?.payerAccountName ||
      paidResult?.bakongData?.fromAccountName ||
      paidResult?.transaction?.paymentDetails?.fromAccountId ||
      paidResult?.bakongData?.fromAccountId ||
      null;
    onPaymentSuccessRef.current?.({
      ...paidResult,
      status: 'PAID',
      payerAccountName: payerName,
    });
  }, []);

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
    settledOnceRef.current = false;
    try {
      const requestAmount = currency === 'KHR' ? Math.max(1, Math.round(numericAmount * 4100)) : numericAmount;
      const data = await paymentService.initiateKHQRPayment(requestAmount, currency, {
        items: cartItemsRef.current,
        promoCode: promoCodeRef.current,
      });
      setSession(data);
      onSessionChangeRef.current?.(data);
      if (data?.expiresAt) {
        const expMs = typeof data.expiresAt === 'number' ? data.expiresAt : new Date(data.expiresAt).getTime();
        const diff = Math.max(0, Math.floor((expMs - Date.now()) / 1000));
        setSecondsLeft(diff > 0 && diff <= 300 ? diff : 300);
      } else {
        setSecondsLeft(300);
      }
    } catch (err) {
      setSession(null);
      onSessionChangeRef.current?.(null);
      setQrError(
        err?.message ||
          (languageRef.current === 'km'
            ? 'មិនអាចបង្កើតកូដ QR Bakong បានទេ — សូមពិនិត្យការភ្ជាប់ រួចសាកម្តងទៀត'
            : 'Unable to generate Bakong KHQR code — please retry.')
      );
    } finally {
      setLoadingQr(false);
    }
  }, [totalAmount, currency, cartSignature]);

  useEffect(() => {
    generateSession();
  }, [generateSession]);

  // 5-minute Countdown timer
  useEffect(() => {
    if (!session || paidConfirmed || isExpired) return undefined;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [session, paidConfirmed, isExpired]);

  // 2-second Auto-Verify polling calling POST /api/check-payment with md5 & txToken + backend database sync
  useEffect(() => {
    const md5 = session?.md5 || session?.md5Hash;
    const txToken = session?.txToken;
    const verifyTarget = session?.transactionId || md5;
    if (!verifyTarget || paidConfirmed || isExpired || awaitingAdmin) {
      return undefined;
    }

    const intervalMs = 2000;
    const maxPolls = 180;
    let stopped = false;
    let inFlight = false;
    let pollCount = 0;

    const runPoll = async () => {
      if (stopped || inFlight || settledOnceRef.current) return;
      pollCount += 1;
      if (pollCount > maxPolls) {
        window.clearInterval(pollId);
        return;
      }
      inFlight = true;
      try {
        const res = await paymentService.verifyKHQRPayment(verifyTarget, {
          md5,
          txToken,
          amount: session.amount,
          mode: 'poll',
        });
        if (!stopped && res?.status === 'PAID') {
          stopped = true;
          window.clearInterval(pollId);
          handleVerifiedPaid(res);
        }
      } catch {
        // Silent retry on next 2-second poll tick
      } finally {
        inFlight = false;
      }
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        runPoll();
      }
    };

    const pollId = window.setInterval(runPoll, intervalMs);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);

    return () => {
      stopped = true;
      window.clearInterval(pollId);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [session, paidConfirmed, isExpired, awaitingAdmin, handleVerifiedPaid]);

  // Fast 2.5s polling if awaiting Admin 1-Tap Confirm on Telegram Order Bot
  useEffect(() => {
    if (!awaitingAdmin || !session?.transactionId || paidConfirmed || isExpired) {
      return undefined;
    }

    let stopped = false;
    const pollAdmin = async () => {
      if (stopped || settledOnceRef.current) return;
      try {
        const res = await paymentService.verifyKHQRPayment(session.transactionId, {
          md5: session.md5 || session.md5Hash,
          txToken: session.txToken,
          amount: session.amount,
          mode: 'poll',
        });
        if (stopped) return;
        if (res?.status === 'PAID') {
          stopped = true;
          window.clearInterval(timerId);
          handleVerifiedPaid(res);
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
  }, [awaitingAdmin, session, paidConfirmed, isExpired, handleVerifiedPaid]);

  const handleCopy = () => {
    const rawQr = session?.khqrString || session?.qr;
    if (!rawQr) return;
    navigator.clipboard?.writeText(rawQr);
    setCopied(true);
    addToast(
      language === 'km'
        ? 'បានចម្លងកូដទូទាត់ KHQR ទៅកាន់ក្ដារតម្បៀតខ្ទាស់'
        : 'KHQR payment string copied to clipboard',
      'info'
    );
    setTimeout(() => setCopied(false), 2000);
  };

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');

  // Format card price number matching official KHQR standee
  const numericTotal = Number(totalAmount || 0);
  const displayAmountNumber =
    currency === 'KHR'
      ? Math.max(1, Math.round(numericTotal * 4100)).toLocaleString('en-US')
      : numericTotal.toFixed(2);
  const currencySymbol = currency === 'KHR' ? '៛' : '$';

  return (
    <div className="flex flex-col items-center p-4 sm:p-7 rounded-2xl bg-[#fafafa] border border-slate-200 text-center">
      {/* Currency Selector (USD / KHR) */}
      <div className="inline-flex flex-wrap justify-center items-center p-1 rounded-xl bg-white border border-slate-200 shadow-2xs mb-5 max-w-full">
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

      {/* Exact Official KHQR Standee Card matching reference screenshot */}
      <div
        className="w-full bg-white text-[#09090b] overflow-hidden mb-4"
        style={{
          maxWidth: '340px',
          borderRadius: '22px',
          boxShadow: '0 18px 45px rgba(15, 23, 42, 0.16)',
          border: '2px solid rgba(226, 232, 240, 0.9)',
        }}
      >
        {/* Top Red KHQR Header with Bottom-Right Diagonal Notch */}
        <div
          className="relative flex items-center justify-center"
          style={{
            backgroundColor: '#e1232e',
            height: '48px',
          }}
        >
          <span
            className="text-white font-black select-none"
            style={{
              fontSize: '1.35rem',
              letterSpacing: '2.5px',
            }}
          >
            KHQR
          </span>
          <div
            style={{
              position: 'absolute',
              bottom: '-12px',
              right: 0,
              width: '30px',
              height: '24px',
              backgroundColor: '#e1232e',
              clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
            }}
          />
        </div>

        {/* White Card Body */}
        <div style={{ padding: '16px 20px 14px' }}>
          {/* Merchant Row: TECHTONIC STORE + Price on left, ABA / Bakong pill on right */}
          <div className="flex items-start justify-between text-left">
            <div>
              <p
                className="uppercase tracking-tight"
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  color: '#52525b',
                }}
              >
                TECHTONIC STORE
              </p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    color: '#09090b',
                  }}
                >
                  {currencySymbol}
                </span>
                <span
                  style={{
                    fontSize: '1.85rem',
                    fontWeight: 900,
                    color: '#09090b',
                    lineHeight: 1.15,
                  }}
                >
                  {displayAmountNumber}
                </span>
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#eff6ff',
                color: '#1d4ed8',
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '6px',
              }}
            >
              ABA / Bakong
            </div>
          </div>

          {/* Dashed Divider */}
          <div
            style={{
              borderTop: '2px dashed #e4e4e7',
              margin: '10px 0',
            }}
          />

          {/* QR Code Stage (230x230) with Black Circle Currency Center Badge */}
          <div
            className="relative mx-auto flex items-center justify-center"
            style={{
              width: '230px',
              height: '230px',
            }}
          >
            {loadingQr ? (
              <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                <Loader2 className="w-7 h-7 animate-spin text-[#e1232e]" />
                <span className="text-xs font-medium">
                  {language === 'km' ? 'កំពុងបង្កើតកូដ KHQR...' : 'Generating KHQR...'}
                </span>
              </div>
            ) : qrError ? (
              <div className="flex flex-col items-center justify-center gap-3 px-2 text-center">
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
              <>
                <img
                  src={session.qrDataUrl}
                  alt="Bakong KHQR Payment Code"
                  className={`w-full h-full object-contain ${isExpired ? 'opacity-25 blur-[1px]' : ''}`}
                />

                {/* Center Black Circle Currency Symbol Badge */}
                {!isExpired && !paidConfirmed && (
                  <div
                    className="absolute flex items-center justify-center select-none pointer-events-none"
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      backgroundColor: '#09090b',
                      color: '#ffffff',
                      border: '3px solid #ffffff',
                      fontWeight: 900,
                      fontSize: '1rem',
                    }}
                  >
                    {currencySymbol}
                  </div>
                )}

                {isExpired && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <span className="text-xs font-bold text-slate-800 bg-white/95 px-2.5 py-1 rounded shadow-xs">
                      {language === 'km' ? 'QR ផុតកំណត់ហើយ' : 'QR Expired'}
                    </span>
                    <button
                      type="button"
                      onClick={generateSession}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#e1232e] text-white text-xs font-bold hover:bg-red-700 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>{language === 'km' ? 'បង្កើត QR ថ្មី' : 'New QR'}</span>
                    </button>
                  </div>
                )}

                {paidConfirmed && (
                  <div className="absolute inset-0 bg-white/96 rounded-xl flex flex-col items-center justify-center gap-2 p-3 text-center">
                    <VerifiedCheckmark size="sm" />
                    <h4 className="text-sm font-extrabold text-emerald-800">
                      {language === 'km' ? 'ទទួលការទូទាត់ជោគជ័យ!' : 'Payment Verified!'}
                    </h4>
                    <p className="text-xs font-mono font-bold text-slate-800">
                      {currency === 'KHR' ? formatKHR(totalAmount) : formatUSD(totalAmount)}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Card Footer: Ref on Left, ID on Right */}
          <div
            className="flex items-center justify-between"
            style={{
              marginTop: '10px',
              paddingTop: '8px',
              borderTop: '1px solid #f4f4f5',
              fontFamily: "'Fira Code', ui-monospace, SFMono-Regular, Consolas, monospace",
              fontSize: '0.7rem',
              color: '#71717a',
            }}
          >
            <span>
              Ref:{' '}
              <strong style={{ color: '#52525b', fontWeight: 700 }}>
                {session?.billNumber || 'ORDER-000000'}
              </strong>
            </span>
            <span>
              ID:{' '}
              <strong style={{ color: '#52525b', fontWeight: 700 }}>
                {session?.bakongAccountId || 'seng_koemnan@bkrt'}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Live 5-Minute Countdown & Auto-Verify Telemetry Pill */}
      {session && !paidConfirmed && (
        <div className="mb-3 inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-2xs text-[11px] font-mono text-slate-600">
          <Clock className="w-3.5 h-3.5 text-[#e1232e]" />
          <span className="font-bold text-slate-800">{mins}:{secs}</span>
          <span className="text-slate-300">|</span>
          {!awaitingAdmin ? (
            <span className="inline-flex items-center gap-1.5 text-slate-700 font-sans font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {language === 'km' ? 'កំពុងឆែកស្វ័យប្រវត្តិ (2s)' : 'Auto-verifying every 2s'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-slate-700 font-sans font-semibold">
              <span className="w-2 h-2 rounded-full bg-slate-700 animate-pulse" />
              {language === 'km' ? 'រង់ចាំបញ្ជាក់លើ Telegram' : 'Waiting Telegram'}
            </span>
          )}
        </div>
      )}

      {/* Concise Instructions & Single Action Row */}
      <div className="w-full max-w-xs space-y-3">
        <p className="text-[11px] text-slate-500 leading-relaxed">
          {language === 'km'
            ? 'ស្កេនកូដ KHQR ជាមួយកម្មវិធី ABA Mobile, ACLEDA ឬ Bakong — ប្រព័ន្ធនឹងផ្ទៀងផ្ទាត់ស្វ័យប្រវត្តិរៀងរាល់ ២ វិនាទី'
            : 'Scan KHQR with ABA Mobile, ACLEDA, or Bakong — auto-verifies every 2 seconds'}
        </p>

        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={!session?.khqrString && !session?.qr}
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
      </div>
    </div>
  );
}
