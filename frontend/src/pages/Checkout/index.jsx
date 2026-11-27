import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ShieldCheck, CheckCircle2, Lock, UserCheck } from 'lucide-react';
import { useCart, useAuth, useToast, useLanguage } from '../../store/StoreContext';
import ShippingForm from '../../components/checkout/ShippingForm';
import PaymentMethod from '../../components/checkout/PaymentMethod';
import KHQRPayment from '../../components/checkout/KHQRPayment';
import OrderSummary from '../../components/checkout/OrderSummary';
import Button from '../../components/common/Button';
import { orderService } from '../../services/orderService';
import { paymentService } from '../../services/paymentService';
import { shippingService } from '../../services/shippingService';
import { validatePhone, validateEmail } from '../../utils/validation';

function buildInitialShippingData(user) {
  const defaultAddr =
    user?.addresses?.find((a) => a.isDefault) ||
    user?.addresses?.[0] ||
    user?.savedAddresses?.[0] ||
    null;

  return {
    fullName: user?.fullName || user?.name || defaultAddr?.fullName || '',
    phone: user?.phone || defaultAddr?.phone || '',
    address: defaultAddr?.address || '',
    city: defaultAddr?.city || '',
    province: defaultAddr?.province || 'Phnom Penh',
    postalCode: defaultAddr?.postalCode || '',
    deliveryPartner: 'vireak_buntham',
    saveAddress: false,
  };
}

export default function Checkout() {
  const navigate = useNavigate();
  const { items, subtotal, discountAmount, appliedCoupon, clearCart } = useCart();
  const { user, addAddress } = useAuth();
  const { addToast } = useToast();
  const { language } = useLanguage();

  // Enforce Option 2: Must Login to Checkout
  useEffect(() => {
    if (!user) {
      addToast(
        language === 'km'
          ? 'សូមចូលគណនី ឬចុះឈ្មោះដើម្បីបញ្ចប់ការបញ្ជាទិញដោយសុវត្ថិភាព។'
          : 'Please sign in or register to complete your order securely.',
        'warning'
      );
      navigate('/login?redirect=/checkout', { replace: true });
    }
  }, [user, navigate, addToast, language]);

  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const khqrSessionRef = useRef(null);
  const finalizingRef = useRef(false);
  const getUserKey = (u) => u?.id || u?.uid || u?.email || null;
  const lastUserIdRef = useRef(getUserKey(user));

  // Step 1: Shipping Form State (prefill only from real saved user profile/address)
  const [shippingData, setShippingData] = useState(() => buildInitialShippingData(user));
  const [shippingErrors, setShippingErrors] = useState({});
  const [shippingConfig, setShippingConfig] = useState(() => shippingService.getCachedShippingConfig());

  useEffect(() => {
    let active = true;
    shippingService.fetchShippingConfig().then((cfg) => {
      if (active && cfg) setShippingConfig(cfg);
    });
    const onShippingUpdate = (e) => {
      if (e?.detail) setShippingConfig(e.detail);
    };
    window.addEventListener('techtonic:shipping-updated', onShippingUpdate);
    return () => {
      active = false;
      window.removeEventListener('techtonic:shipping-updated', onShippingUpdate);
    };
  }, []);

  const enabledPartners = (shippingConfig?.partners || []).filter((p) => p.enabled !== false);
  const {
    partner: activePartner,
    shippingFee: activeShippingFee,
    freeShippingApplied,
  } = shippingService.calculateShippingFee(shippingConfig, shippingData.deliveryPartner, subtotal);

  const checkoutTotal =
    Math.round(
      Math.max(0, Number(subtotal || 0) + Number(activeShippingFee || 0) - Number(discountAmount || 0)) * 100
    ) / 100;

  useEffect(() => {
    if (activePartner?.id && shippingData.deliveryPartner !== activePartner.id) {
      const currentlyEnabled = enabledPartners.some((p) => p.id === shippingData.deliveryPartner);
      if (!currentlyEnabled) {
        setShippingData((prev) => ({ ...prev, deliveryPartner: activePartner.id }));
      }
    }
  }, [activePartner?.id, enabledPartners, shippingData.deliveryPartner]);

  // Sync shipping data when user profile loads or account switches
  useEffect(() => {
    if (!user) return;
    const nextUserId = getUserKey(user);
    const prevUserId = lastUserIdRef.current;
    lastUserIdRef.current = nextUserId;

    const defaults = buildInitialShippingData(user);
    setShippingData((prev) => {
      if (prevUserId && prevUserId !== nextUserId) {
        return { ...defaults, deliveryPartner: prev.deliveryPartner || 'vireak_buntham' };
      }
      return {
        ...prev,
        fullName: prev.fullName || defaults.fullName,
        phone: prev.phone || defaults.phone,
        address: prev.address || defaults.address,
        city: prev.city || defaults.city,
        province: prev.province || defaults.province,
        postalCode: prev.postalCode || defaults.postalCode,
      };
    });
  }, [user]);

  // Step 2: Payment Method (Bakong KHQR only)
  const selectedPaymentMethod = 'khqr';

  // Auth Guard Screen if not authenticated
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-sm">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">
          {language === 'km' ? 'តម្រូវឱ្យចូលគណនី' : 'Sign In Required'}
        </h2>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          {language === 'km'
            ? 'សូមចូលគណនី TechTonic របស់អ្នក ឬចុះឈ្មោះ ដើម្បីបញ្ចប់ការបញ្ជាទិញ និងទទួលបានការធានា។'
            : 'Please sign in to your verified TechTonic account or register to complete your order and secure your warranty.'}
        </p>
        <Link to="/login?redirect=/checkout">
          <Button variant="primary" size="lg" className="w-full">
            {language === 'km' ? 'បន្តទៅការចូលគណនី / ចុះឈ្មោះ' : 'Proceed to Sign In / Register'}
          </Button>
        </Link>
      </div>
    );
  }

  // If cart is empty, render redirect notice
  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          {language === 'km' ? 'មិនមានទំនិញសម្រាប់ទូទាត់ទេ' : 'No items to checkout'}
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          {language === 'km' ? 'កន្ត្រកទំនិញរបស់អ្នកបច្ចុប្បន្ននៅទទេ។' : 'Your shopping bag is currently empty.'}
        </p>
        <Link to="/shop">
          <Button variant="primary">{language === 'km' ? 'ត្រឡប់ទៅហាងទំនិញ' : 'Return to Shop'}</Button>
        </Link>
      </div>
    );
  }

  // Step 1 Validation
  const validateStep1 = () => {
    const errs = {};
    if (!shippingData.fullName.trim()) {
      errs.fullName = language === 'km' ? 'ត្រូវការឈ្មោះពេញ' : 'Full Name is required';
    }
    if (!shippingData.phone.trim()) {
      errs.phone = language === 'km' ? 'ត្រូវការលេខទូរស័ព្ទ' : 'Phone number is required';
    } else if (!validatePhone(shippingData.phone)) {
      errs.phone =
        language === 'km'
          ? 'សូមបញ្ចូលលេខទូរស័ព្ទត្រឹមត្រូវ (ឧ. 012 345 678)'
          : 'Please enter a valid phone number (e.g. 012 345 678)';
    }
    if (!shippingData.address.trim()) {
      errs.address = language === 'km' ? 'ត្រូវការអាសយដ្ឋានផ្លូវ' : 'Street address is required';
    }
    if (!shippingData.city.trim()) {
      errs.city = language === 'km' ? 'ត្រូវការទីក្រុង ឬខណ្ឌ' : 'City or Khan is required';
    }

    setShippingErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextToPayment = (e) => {
    e.preventDefault();
    if (validateStep1()) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      addToast(
        language === 'km' ? 'សូមបំពេញព័ត៌មានដឹកជញ្ជូនដែលចាំបាច់ទាំងអស់' : 'Please fill all required shipping fields',
        'error'
      );
    }
  };

  // Complete Order
  const handleFinalizeOrder = async (preVerifiedPayment = null) => {
    if (finalizingRef.current) return;
    finalizingRef.current = true;
    setIsProcessing(true);

    try {
      let paymentResult;
      if (Number(checkoutTotal || 0) <= 0) {
        paymentResult = {
          success: true,
          status: 'PAID',
          transactionId: `FREE-${Date.now()}`,
          paymentMethod: 'Promo / Free Checkout ($0.00)',
        };
      } else if (preVerifiedPayment?.status === 'PAID') {
        paymentResult = preVerifiedPayment;
      } else {
        const sessionTarget = khqrSessionRef.current?.md5Hash || khqrSessionRef.current?.transactionId;
        paymentResult = await paymentService.verifyKHQRPayment(sessionTarget, {
          amount: checkoutTotal,
          mode: 'manual',
        });
      }

      const partnerId = activePartner?.id || shippingData.deliveryPartner || 'vireak_buntham';
      const carrierInfo = partnerId === 'vireak_buntham'
        ? {
            partnerName: activePartner?.name || 'Vireak Buntham Express (VET)',
            partnerWebsite: activePartner?.website || 'https://vireakbuntham.com/',
            trackingNumber: `VET-KH-${Math.floor(100000 + Math.random() * 900000)}`,
            estimatedDelivery: 'Within 24-48 Hours (Vireak Buntham Express)'
          }
        : partnerId === 'jt_express'
        ? {
            partnerName: activePartner?.name || 'J&T Express Cambodia',
            partnerWebsite: activePartner?.website || 'https://www.jtexpresskh.com/',
            trackingNumber: `JTH${Math.floor(10000000 + Math.random() * 90000000)}`,
            estimatedDelivery: 'Within 24-36 Hours (J&T Express Door-to-Door)'
          }
        : {
            partnerName: activePartner?.name || 'GrabExpress Cambodia',
            partnerWebsite: activePartner?.website || 'https://www.grab.com/kh/express/',
            trackingNumber: `GRAB-PP-${Math.floor(1000 + Math.random() * 9000)}`,
            estimatedDelivery: 'Today by 5:30 PM (GrabExpress Phnom Penh)'
          };

      // Create new persistent Order via backend transaction (or local fallback)
      const newOrder = await orderService.createOrderAsync({
        userId: user?.id || null,
        customerName: shippingData.fullName || user?.fullName || user?.name || 'Customer',
        customerPhone: shippingData.phone || user?.phone || '',
        customerEmail: user?.email || 'customer@techtonic.store',
        shippingAddress: {
          ...shippingData,
          deliveryPartner: partnerId,
        },
        deliveryPartnerId: partnerId,
        deliveryPartner: carrierInfo.partnerName,
        carrierWebsite: carrierInfo.partnerWebsite,
        trackingNumber: carrierInfo.trackingNumber,
        items: items,
        subtotal: subtotal,
        shippingFee: activeShippingFee,
        discountAmount: discountAmount,
        total: checkoutTotal,
        appliedCoupon: appliedCoupon?.code || null,
        paymentMethod:
          Number(checkoutTotal || 0) <= 0
            ? 'Promo / Free Checkout ($0.00)'
            : paymentResult?.currency === 'KHR'
            ? 'KHQR Bakong (KHR)'
            : 'KHQR Bakong',
        paymentStatus: 'PAID',
        payerAccountName: paymentResult?.payerAccountName || '',
        transactionId: paymentResult.transactionId,
        status: 'confirmed',
        estimatedDelivery: carrierInfo.estimatedDelivery
      });

      if (shippingData.saveAddress && user && typeof addAddress === 'function') {
        const existingList = user.addresses || user.savedAddresses || [];
        const alreadySaved = existingList.some(
          (a) =>
            String(a.address || '').trim().toLowerCase() === shippingData.address.trim().toLowerCase() &&
            String(a.city || '').trim().toLowerCase() === shippingData.city.trim().toLowerCase() &&
            String(a.phone || '').trim() === shippingData.phone.trim()
        );
        if (!alreadySaved) {
          addAddress({
            fullName: shippingData.fullName,
            phone: shippingData.phone,
            address: shippingData.address,
            city: shippingData.city,
            province: shippingData.province,
            postalCode: shippingData.postalCode,
            isDefault: existingList.length === 0,
          }).catch(() => {});
        }
      }

      // Clear shopping cart
      clearCart();

      // Show toast and navigate to success screen
      addToast(
        language === 'km' ? 'ការកុម្ម៉ង់ត្រូវបានបញ្ជាក់! កំពុងបង្កើតវិក្កយបត្រ...' : 'Order confirmed! Generating receipt...',
        'success'
      );
      navigate(`/order-success?orderId=${newOrder.id}`);
    } catch (err) {
      addToast(
        err.message || (language === 'km' ? 'ការទូទាត់បរាជ័យ។ សូមព្យាយាមម្ដងទៀត។' : 'Payment processing failed. Please retry.'),
        'error'
      );
    } finally {
      finalizingRef.current = false;
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-[#f8fafc] min-h-[calc(100vh-80px)] py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Checkout Header & Steps */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-slate-200 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {language === 'km' ? 'ការទូទាត់' : 'Checkout'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'km' ? 'សូមពិនិត្យ និងបញ្ចូលព័ត៌មានដឹកជញ្ជូនរបស់អ្នក' : 'Please review and enter your shipping details'}
            </p>
          </div>

          {/* Clean Step Navigation */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`px-3.5 py-1.5 rounded-lg transition ${
                currentStep === 1
                  ? 'bg-slate-900 text-white font-bold'
                  : 'text-slate-500 hover:text-slate-900 bg-slate-100'
              }`}
            >
              {language === 'km' ? '១. ការដឹកជញ្ជូន' : '1. Shipping'}
            </button>
            <span className="text-slate-300">/</span>
            <button
              type="button"
              onClick={() => {
                if (validateStep1()) setCurrentStep(2);
              }}
              className={`px-3.5 py-1.5 rounded-lg transition ${
                currentStep === 2
                  ? 'bg-slate-900 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-700 bg-slate-100'
              }`}
            >
              {language === 'km' ? '២. ការទូទាត់' : '2. Payment'}
            </button>
          </div>
        </div>

        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Interactive Step Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-8 shadow-xs">
          {currentStep === 1 ? (
            /* STEP 1: SHIPPING */
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {language === 'km' ? 'អាសយដ្ឋានដឹកជញ្ជូន' : 'Delivery address'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {language === 'km' ? 'តើគួរដឹកជញ្ជូនការកុម្ម៉ង់របស់អ្នកទៅទីណា?' : 'Where should we deliver your order?'}
                  </p>
                </div>
              </div>

              {/* Account Context Bar */}
              <div className="mb-6 px-3.5 sm:px-4 py-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 text-xs text-slate-600">
                <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 min-w-0">
                  <span className="text-slate-400 shrink-0">{language === 'km' ? 'គណនី៖' : 'Account:'}</span>
                  <span className="font-semibold text-slate-900 whitespace-nowrap">{user?.fullName || user?.name}</span>
                  <span className="text-slate-400 truncate max-w-full">({user?.email})</span>
                </div>
                <Link
                  to="/login?redirect=/checkout"
                  className="font-semibold text-blue-600 hover:text-blue-700 hover:underline whitespace-nowrap shrink-0 self-start sm:self-center"
                >
                  {language === 'km' ? 'ប្តូរគណនី' : 'Switch account'}
                </Link>
              </div>

              <ShippingForm
                formData={shippingData}
                onChange={setShippingData}
                errors={shippingErrors}
                shippingPartners={enabledPartners}
                freeShippingApplied={freeShippingApplied}
              />

              <div className="pt-8 mt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <Link
                  to="/cart"
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{language === 'km' ? 'ត្រឡប់ទៅកន្ត្រក' : 'Back to Cart'}</span>
                </Link>

                <Button variant="primary" size="md" onClick={handleNextToPayment}>
                  <span>{language === 'km' ? 'បន្តទៅការទូទាត់' : 'Continue to Payment'}</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          ) : (
            /* STEP 2: PAYMENT */
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {language === 'km' ? 'វិធីសាស្ត្រទូទាត់' : 'Payment method'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {language === 'km' ? 'ប្រតិបត្តិការទាំងអស់មានសុវត្ថិភាព និងត្រូវបានអ៊ិនគ្រីប' : 'All transactions are secure and encrypted'}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <PaymentMethod selectedMethod="khqr" onSelectMethod={() => {}} />

                <KHQRPayment
                  totalAmount={checkoutTotal}
                  cartItems={items}
                  promoCode={appliedCoupon?.code || null}
                  deliveryPartner={activePartner?.id || shippingData.deliveryPartner || 'vireak_buntham'}
                  customerInfo={{ name: shippingData.fullName, phone: shippingData.phone }}
                  onSessionChange={(s) => {
                    khqrSessionRef.current = s;
                  }}
                  onPaymentSuccess={(paidReceipt) => handleFinalizeOrder(paidReceipt)}
                />
              </div>

              {/* Bottom Nav Buttons */}
              <div className="pt-8 mt-8 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{language === 'km' ? 'ត្រឡប់ទៅការដឹកជញ្ជូន' : 'Back to Shipping'}</span>
                </button>

                {Number(checkoutTotal || 0) <= 0 && (
                  <Button
                    variant="primary"
                    size="lg"
                    loading={isProcessing}
                    onClick={() => handleFinalizeOrder()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    <span>{language === 'km' ? 'បញ្ជាក់ និងបញ្ចប់ការកុម្ម៉ង់' : 'Confirm & Complete Order'}</span>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Sticky Order Summary */}
        <div className="lg:col-span-5 lg:sticky lg:top-28">
          <OrderSummary
            items={items}
            subtotal={subtotal}
            shippingFee={activeShippingFee}
            discountAmount={discountAmount}
            total={checkoutTotal}
            appliedCoupon={appliedCoupon}
          />
        </div>
      </div>
    </div>
  </div>
);
}
