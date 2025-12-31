const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const PHONE_REGEX = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}[-\s\.]?[0-9]{1,9}$/;

export function validateEmail(email: string): { isValid: boolean; error?: string } {
  const trimmed = email?.trim();
  
  if (!trimmed) return { isValid: false, error: 'Email is required' };
  if (trimmed.length > 254) return { isValid: false, error: 'Email address is too long' };
  if (trimmed.includes('..') || trimmed.startsWith('.') || trimmed.endsWith('.')) {
    return { isValid: false, error: 'Email address cannot contain consecutive dots or start/end with a dot' };
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true };
}

export function validatePhone(phone: string): { isValid: boolean; error?: string } {
  const trimmed = phone?.trim();
  if (!trimmed) return { isValid: true };

  const digitCount = trimmed.replace(/\D/g, '').length;
  if (digitCount < 7 || digitCount > 15) {
    return { isValid: false, error: 'Please enter a valid phone number (7-15 digits)' };
  }
  if (!PHONE_REGEX.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid phone number' };
  }

  return { isValid: true };
}

