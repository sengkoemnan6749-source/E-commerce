import React from 'react';
import Input from '../common/Input';
import { CreditCard, Calendar, Lock, User } from 'lucide-react';
import { formatCardNumber, formatExpiryDate } from '../../utils/validation';

export default function CardPayment({ cardData, onChange, errors = {} }) {
  const handleCardNumber = (e) => {
    const formatted = formatCardNumber(e.target.value);
    onChange({ ...cardData, cardNumber: formatted });
  };

  const handleExpiry = (e) => {
    const formatted = formatExpiryDate(e.target.value);
    onChange({ ...cardData, expiryDate: formatted });
  };

  const handleCvv = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    onChange({ ...cardData, cvv: val });
  };

  const handleName = (e) => {
    onChange({ ...cardData, cardholderName: e.target.value.toUpperCase() });
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4">
      {/* Mini Visual Preview */}
      <div className="relative h-40 w-full max-w-sm mx-auto rounded-2xl p-5 text-white bg-gradient-to-tr from-slate-900 via-slate-800 to-blue-900 shadow-xl overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold tracking-widest text-slate-300">
            TECHTONIC SECURE
          </span>
          <CreditCard className="w-6 h-6 text-slate-200" />
        </div>

        <div className="text-lg sm:text-xl font-mono tracking-widest font-semibold text-slate-100">
          {cardData.cardNumber || '•••• •••• •••• ••••'}
        </div>

        <div className="flex items-center justify-between text-xs">
          <div>
            <div className="text-[9px] uppercase tracking-wider text-slate-400">Cardholder</div>
            <div className="font-medium tracking-wider truncate max-w-[150px]">
              {cardData.cardholderName || 'YOUR FULL NAME'}
            </div>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-wider text-slate-400">Expires</div>
            <div className="font-mono font-medium">
              {cardData.expiryDate || 'MM/YY'}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <Input
          label="Cardholder Name *"
          placeholder="SARA MENG"
          icon={User}
          value={cardData.cardholderName || ''}
          onChange={handleName}
          error={errors.cardholderName}
          required
        />

        <Input
          label="Card Number *"
          placeholder="4532 0123 4567 8910"
          icon={CreditCard}
          value={cardData.cardNumber || ''}
          onChange={handleCardNumber}
          maxLength={19}
          error={errors.cardNumber}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Expiry Date *"
            placeholder="MM/YY"
            icon={Calendar}
            value={cardData.expiryDate || ''}
            onChange={handleExpiry}
            maxLength={5}
            error={errors.expiryDate}
            required
          />

          <Input
            label="CVV / CVC *"
            placeholder="123"
            icon={Lock}
            type="password"
            value={cardData.cvv || ''}
            onChange={handleCvv}
            maxLength={4}
            error={errors.cvv}
            helperText="3 digits on back"
            required
          />
        </div>
      </div>
    </div>
  );
}
