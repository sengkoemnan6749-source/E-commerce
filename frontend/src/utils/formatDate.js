/**
 * Parse ISO strings, numbers, Date instances, or serialized Firestore Timestamps safely.
 * Returns null instead of throwing RangeError on malformed/unserialized values.
 */
export function parseValidDate(input) {
  if (!input) return null;

  let date = null;
  if (input instanceof Date) {
    date = input;
  } else if (typeof input?.toDate === 'function') {
    date = input.toDate();
  } else if (typeof input === 'object') {
    const rawSec = input._seconds ?? input.seconds;
    const rawNs = input._nanoseconds ?? input.nanoseconds ?? 0;
    if (typeof rawSec === 'number' && Number.isFinite(rawSec)) {
      const ms = rawSec * 1000 + Math.floor((Number(rawNs) || 0) / 1e6);
      date = new Date(ms);
    }
  } else if (typeof input === 'string' || typeof input === 'number') {
    date = new Date(input);
  }

  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

export function formatDate(dateInput) {
  const date = parseValidDate(dateInput);
  if (!date) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(dateInput) {
  const date = parseValidDate(dateInput);
  if (!date) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
