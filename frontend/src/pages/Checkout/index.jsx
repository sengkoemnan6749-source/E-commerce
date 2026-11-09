import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ShieldCheck, CheckCircle2, Lock, UserCheck } from 'lucide-react';
import { useCart, useAuth, useToast } from '../../store/StoreContext';
import ShippingForm from '../../components/checkout/ShippingForm';
import PaymentMethod from '../../components/checkout/PaymentMethod';
import CardPayment from '../../components/checkout/CardPayment';
import KHQRPayment from '../../components/checkout/KHQRPayment';
import OrderSummary from '../../components/checkout/OrderSummary';
import Button from '../../components/common/Button';
import { orderService } from '../../services/orderService';
import { paymentService } from '../../services/paymentService';
import { validatePhone, validateEmail } from '../../utils/validation';

export default function Checkout() {
  const navigate = useNavigate();
  const { items, subtotal, shippingFee, discountAmount, total, appliedCoupon, clearCart } = useCart();
  const { user } = useAuth();
  const { addToast } = useToast();

  // Enforce Option 2: Must Login to Checkout
  useEffect(() => {
    if (!user) {
      addToast('Please sign in or register to complete your order securely.', 'warning');
      navigate('/login?redirect=/checkout', { replace: true });
    }
  }, [user, navigate, addToast]);

  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // Step 1: Shipping Form State (prefill if user is logged in)
  const defaultAddr = user?.addresses?.find(a => a.isDefault) || user?.addresses?.[0] || user?.savedAddresses?.[0] || null;
  const [shippingData, setShippingData] = useState({
    fullName: user?.fullName || user?.name || 'Sara Meng',
    phone: user?.phone || '012 888 999',
    address: defaultAddr?.address || 'Street 310, Building 24, BKK1',
    city: defaultAddr?.city || 'Phnom Penh',
    province: defaultAddr?.province || 'Phnom Penh',
    postalCode: defaultAddr?.postalCode || '120101',
    saveAddress: true
  });
  const [shippingErrors, setShippingErrors] = useState({});

  // Sync shipping data if user profile loads
  useEffect(() => {
    if (user) {
      const addr = user.addresses?.find(a => a.isDefault) || user.addresses?.[0] || user.savedAddresses?.[0] || null;
      setShippingData(prev => ({
        ...prev,
        fullName: prev.fullName || user.fullName || user.name || '',
        phone: prev.phone || user.phone || '',
        address: prev.address || addr?.address || 'Street 310, Building 24, BKK1',
        city: prev.city || addr?.city || 'Phnom Penh',
        province: prev.province || addr?.province || 'Phnom Penh'
      }));
    }
  }, [user]);

  // Step 2: Payment State
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('khqr'); // 'khqr' | 'card'
  const [cardData, setCardData] = useState({
    cardNumber: '4532 9845 2314 9012',
    cardholderName: (user?.fullName || user?.name || 'Sara Meng').toUpperCase(),
    expiryDate: '12/28',
    cvv: '888'
  });
  const [cardErrors, setCardErrors] = useState({});

  // Auth Guard Screen if not authenticated
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-sm">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Sign In Required</h2>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          Please sign in to your verified TechTonic account or register to complete your order and secure your warranty.
        </p>
        <Link to="/login?redirect=/checkout">
          <Button variant="primary" size="lg" className="w-full">
            Proceed to Sign In / Register
          </Button>
        </Link>
      </div>
    );
  }

  // If cart is empty, render redirect notice
  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">No items to checkout</h2>
        <p className="text-sm text-slate-500 mb-6">Your shopping bag is currently empty.</p>
        <Link to="/shop">
          <Button variant="primary">Return to Shop</Button>
        </Link>
      </div>
    );
  }

  // Step 1 Validation
  const validateStep1 = () => {
    const errs = {};
    if (!shippingData.fullName.trim()) errs.fullName = 'Full Name is required';
    if (!shippingData.phone.trim()) {
      errs.phone = 'Phone number is required';
    } else if (!validatePhone(shippingData.phone)) {
      errs.phone = 'Please enter a valid phone number (e.g. 012 345 678)';
    }
    if (!shippingData.address.trim()) errs.address = 'Street address is required';
    if (!shippingData.city.trim()) errs.city = 'City or Khan is required';

    setShippingErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextToPayment = (e) => {
    e.preventDefault();
    if (validateStep1()) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      addToast('Please fill all required shipping fields', 'error');
    }
  };

  // Complete Order
  const handleFinalizeOrder = async () => {
    setIsProcessing(true);

    try {
      let paymentResult;
      if (selectedPaymentMethod === 'card') {
        paymentResult = await paymentService.processCardPayment(cardData, total);
      } else {
        paymentResult = await paymentService.verifyKHQRPayment('mock_khqr_hash');
      }

      const partnerId = shippingData.deliveryPartner || 'vireak_buntham';
      const carrierInfo = partnerId === 'vireak_buntham'
        ? {
            partnerName: 'Vireak Buntham Express (VET)',
            partnerWebsite: 'https://vireakbuntham.com/',
            trackingNumber: `VET-KH-${Math.floor(100000 + Math.random() * 900000)}`,
            estimatedDelivery: 'Within 24-48 Hours (Vireak Buntham Express)'
          }
        : partnerId === 'jt_express'
        ? {
            partnerName: 'J&T Express Cambodia',
            partnerWebsite: 'https://www.jtexpresskh.com/',
            trackingNumber: `JTH${Math.floor(10000000 + Math.random() * 90000000)}`,
            estimatedDelivery: 'Within 24-36 Hours (J&T Express Door-to-Door)'
          }
        : {
            partnerName: 'GrabExpress Cambodia',
            partnerWebsite: 'https://www.grab.com/kh/express/',
            trackingNumber: `GRAB-PP-${Math.floor(1000 + Math.random() * 9000)}`,
            estimatedDelivery: 'Today by 5:30 PM (GrabExpress Phnom Penh)'
          };

      // Create new persistent Order tied to the authenticated user
      const newOrder = orderService.createOrder({
        userId: user?.id || null,
        customerName: shippingData.fullName || user?.fullName || user?.name || 'Customer',
        customerPhone: shippingData.phone || user?.phone || '012 345 678',
        customerEmail: user?.email || 'customer@techtonic.store',
        shippingAddress: shippingData,
        deliveryPartner: carrierInfo.partnerName,
        carrierWebsite: carrierInfo.partnerWebsite,
        trackingNumber: carrierInfo.trackingNumber,
        items: items,
        subtotal: subtotal,
        shippingFee: shippingFee,
        discountAmount: discountAmount,
        total: total,
        appliedCoupon: appliedCoupon?.code || null,
        paymentMethod: selectedPaymentMethod === 'card' ? 'Credit / Debit Card' : 'KHQR Bakong',
        paymentStatus: 'PAID',
        transactionId: paymentResult.transactionId,
        status: 'confirmed',
        estimatedDelivery: carrierInfo.estimatedDelivery
      });

      // Clear shopping cart
      clearCart();

      // Show toast and navigate to success screen
      addToast('Order confirmed! Generating receipt...', 'success');
      navigate(`/order-success?orderId=${newOrder.id}`);
    } catch (err) {
      addToast(err.message || 'Payment processing failed. Please retry.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-[#f8fafc] min-h-[calc(100vh-80px)] py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Secure Checkout Header & Steps */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-slate-200/80 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs border border-blue-100">
              <Lock className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                Secure Checkout
              </h1>
              <p className="text-xs text-slate-500">
                Official TechTonic Flagship Store • Encrypted Gateway
              </p>
            </div>
          </div>

          {/* Sleek Step Navigation Tabs */}
          <div className="flex items-center bg-white p-1 rounded-full border border-slate-200 shadow-2xs self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                currentStep === 1
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1. Shipping Address
            </button>
            <button
              type="button"
              onClick={() => {
                if (validateStep1()) setCurrentStep(2);
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                currentStep === 2
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              2. Payment Method
            </button>
          </div>
        </div>

        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Interactive Step Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
          {currentStep === 1 ? (
            /* STEP 1: SHIPPING */
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Delivery address</h2>
                  <p className="text-xs text-slate-500">
                    Where should we deliver your order?
                  </p>
                </div>
              </div>

              {/* Account Context Bar */}
              <div className="mb-6 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Account:</span>
                  <span className="font-semibold text-slate-900">{user?.fullName || user?.name}</span>
                  <span className="text-slate-400">({user?.email})</span>
                </div>
                <Link
                  to="/login?redirect=/checkout"
                  className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Switch account
                </Link>
              </div>

              <ShippingForm
                formData={shippingData}
                onChange={setShippingData}
                errors={shippingErrors}
              />

              <div className="pt-8 mt-6 border-t border-slate-100 flex items-center justify-between">
                <Link
                  to="/cart"
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Cart</span>
                </Link>

                <Button variant="primary" size="md" onClick={handleNextToPayment}>
                  <span>Continue to Payment</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          ) : (
            /* STEP 2: PAYMENT */
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Payment method</h2>
                  <p className="text-xs text-slate-500">
                    All transactions are secure and encrypted
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Payment Selection Tabs */}
                <PaymentMethod
                  selectedMethod={selectedPaymentMethod}
                  onSelectMethod={setSelectedPaymentMethod}
                />

                {/* Sub-view: Card or KHQR */}
                {selectedPaymentMethod === 'card' ? (
                  <CardPayment
                    cardData={cardData}
                    onChange={setCardData}
                    errors={cardErrors}
                  />
                ) : (
                  <KHQRPayment
                    totalAmount={total}
                    onSimulateSuccess={handleFinalizeOrder}
                  />
                )}
              </div>

              {/* Bottom Nav Buttons */}
              <div className="pt-8 mt-8 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Shipping</span>
                </button>

                <Button
                  variant="primary"
                  size="lg"
                  loading={isProcessing}
                  onClick={handleFinalizeOrder}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  <span>Confirm & Complete Order</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right Sticky Order Summary */}
        <div className="lg:col-span-5 sticky top-28">
          <OrderSummary
            items={items}
            subtotal={subtotal}
            shippingFee={shippingFee}
            discountAmount={discountAmount}
            total={total}
            appliedCoupon={appliedCoupon}
          />
        </div>
      </div>
    </div>
  </div>
);
}
