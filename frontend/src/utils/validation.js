export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export const validateEmail = isValidEmail;

export function canonicalizeGmail(email = '') {
  const clean = String(email || '').trim().toLowerCase();
  const parts = clean.split('@');
  if (parts.length !== 2) return clean;
  const [local, domain] = parts;
  if (domain === 'gmail.com') {
    const baseLocal = local.split('+')[0].replace(/\./g, '');
    return `${baseLocal}@gmail.com`;
  }
  return clean;
}

/**
 * Validates account registration email: must strictly be @gmail.com and not an alias (+tag or malformed dots).
 */
export function validateRegistrationGmail(email = '') {
  const clean = String(email || '').trim().toLowerCase();
  if (!clean || !isValidEmail(clean)) {
    return { valid: false, reasonCode: 'INVALID_FORMAT' };
  }

  const [localPart, domain] = clean.split('@');
  if (domain !== 'gmail.com') {
    return { valid: false, reasonCode: 'GMAIL_ONLY' };
  }

  if (localPart.includes('+')) {
    return { valid: false, reasonCode: 'ALIAS_NOT_ALLOWED' };
  }

  // Gmail local part only permits letters, numbers, and single non-consecutive periods (no leading/trailing dot)
  if (!/^[a-z0-9]+(\.[a-z0-9]+)*$/.test(localPart) || localPart.length < 3 || localPart.length > 64) {
    return { valid: false, reasonCode: 'INVALID_GMAIL_LOCAL' };
  }

  return {
    valid: true,
    reasonCode: null,
    normalizedEmail: clean,
    canonicalEmail: canonicalizeGmail(clean),
  };
}

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

const COMMON_WEAK_PASSWORDS = new Set([
  'password',
  'password123',
  '123456',
  '12345678',
  '123456789',
  '1234567890',
  'qwerty',
  'qwerty123',
  'abc123',
  'admin',
  'admin123',
  'welcome',
  'letmein',
  'techtonic',
  'cambodia',
  'iloveyou',
  'passw0rd',
  'p@ssword',
]);

const BANNED_WEAK_SUBSTRINGS = ['password', 'passw0rd', 'p@ssword', '123456', 'qwerty', 'admin123', 'letmein', 'iloveyou'];

export function sanitizeDisplayName(name) {
  return String(name || '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 80);
}

/**
 * Evaluates password strength across OWASP-inspired complexity rules and blocks common/personal passwords.
 */
export function evaluatePasswordStrength(password = '', email = '', fullName = '') {
  const pwd = String(password || '');
  const lowerPwd = pwd.toLowerCase();
  const emailLocal = String(email || '').split('@')[0].trim().toLowerCase();
  const nameTokens = String(fullName || '')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length >= 3);

  const checks = {
    minLength: pwd.length >= 8,
    hasUpper: /[A-Z]/.test(pwd),
    hasLower: /[a-z]/.test(pwd),
    hasNumber: /[0-9]/.test(pwd),
    hasSpecial: /[^A-Za-z0-9]/.test(pwd),
  };

  const hasRepeatedChars = pwd.length >= 6 && /^([a-zA-Z0-9])\1+$/.test(pwd);
  const containsEmail = emailLocal.length >= 3 && lowerPwd.includes(emailLocal);
  const containsName = nameTokens.some((tok) => lowerPwd.includes(tok));
  const isCommon =
    COMMON_WEAK_PASSWORDS.has(lowerPwd) ||
    BANNED_WEAK_SUBSTRINGS.some((word) => lowerPwd.includes(word));

  const notCommonOrPersonal = pwd.length > 0 && !isCommon && !containsEmail && !containsName && !hasRepeatedChars;

  const passedCoreCount = Object.values(checks).filter(Boolean).length;
  let score = passedCoreCount * 16;
  if (pwd.length >= 12) score += 10;
  if (notCommonOrPersonal && pwd.length > 0) score += 10;
  if (!notCommonOrPersonal && pwd.length > 0) score = Math.min(score, 35);
  score = Math.min(100, score);

  let level = 'weak';
  if (score >= 85 && passedCoreCount === 5 && notCommonOrPersonal) {
    level = 'strong';
  } else if (score >= 65 && passedCoreCount >= 4 && notCommonOrPersonal) {
    level = 'good';
  } else if (score >= 40) {
    level = 'fair';
  }

  return {
    checks,
    notCommonOrPersonal,
    isCommon,
    containsEmail,
    containsName,
    passedCoreCount,
    score,
    level,
    isValid: passedCoreCount === 5 && notCommonOrPersonal,
  };
}

export function validateStrongPassword(password = '', email = '', fullName = '') {
  const evaluation = evaluatePasswordStrength(password, email, fullName);
  if (evaluation.isValid) {
    return { valid: true, reasonCode: null, evaluation };
  }
  if (!evaluation.checks.minLength) return { valid: false, reasonCode: 'TOO_SHORT', evaluation };
  if (evaluation.isCommon) return { valid: false, reasonCode: 'COMMON_PASSWORD', evaluation };
  if (evaluation.containsEmail || evaluation.containsName) {
    return { valid: false, reasonCode: 'CONTAINS_PERSONAL_INFO', evaluation };
  }
  return { valid: false, reasonCode: 'WEAK_COMPLEXITY', evaluation };
}
