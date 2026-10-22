export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export const validateEmail = isValidEmail;

export function isValidPhone(phone) {
  if (!phone) return false;
  // Support local Cambodian format (012..., 098..., +855...)
  const clean = phone.replace(/[\s-]/g, '');
  return /^(\+?855|0)\d{8,9}$/.test(clean);
}

export const validatePhone = isValidPhone;

export function isValidCardNumber(card) {
  if (!card) return false;
  const clean = card.replace(/\s+/g, '');
  return /^\d{15,19}$/.test(clean);
}

export function isValidExpiry(exp) {
  return /^(0[1-9]|1[0-2])\/?([0-9]{2})$/.test(exp);
}

export function isValidCVV(cvv) {
  return /^\d{3,4}$/.test(cvv);
}

export function formatCardNumber(value) {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').slice(0, 16);
  const groups = digits.match(/.{1,4}/g);
  return groups ? groups.join(' ') : digits;
}

export function formatExpiryDate(value) {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) {
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
  }
  return digits;
}
