/**
 * Email validation regex - RFC 5322 compliant
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Phone validation regex - supports international formats
 * Allows: +, digits, spaces, hyphens, parentheses
 * Minimum 10 digits (US format) or 7-15 digits international)
 */
const PHONE_REGEX = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}[-\s\.]?[0-9]{1,9}$/;

/**
 * Validates email format
 * @param email - Email address to validate
 * @returns Object with isValid boolean and optional error message
 */
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  if (!email || email.trim().length === 0) {
    return { isValid: false, error: 'Email is required' };
  }

  const trimmedEmail = email.trim();

  if (trimmedEmail.length > 254) {
    return { isValid: false, error: 'Email address is too long' };
  }

  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  // Check for common typos
  if (trimmedEmail.includes('..')) {
    return { isValid: false, error: 'Email address cannot contain consecutive dots' };
  }

  if (trimmedEmail.startsWith('.') || trimmedEmail.endsWith('.')) {
    return { isValid: false, error: 'Email address cannot start or end with a dot' };
  }

  return { isValid: true };
}

/**
 * Validates phone number format (supports international formats)
 * @param phone - Phone number to validate (optional field)
 * @returns Object with isValid boolean and optional error message
 */
export function validatePhone(phone: string): { isValid: boolean; error?: string } {
  // Phone is optional, so empty string is valid
  if (!phone || phone.trim().length === 0) {
    return { isValid: true };
  }

  const cleanedPhone = phone.replace(/\s/g, ''); // Remove all whitespace for validation
  const digitCount = cleanedPhone.replace(/\D/g, '').length; // Count only digits

  // Minimum 10 digits (US format) or 7-15 digits (international)
  if (digitCount < 7 || digitCount > 15) {
    return { isValid: false, error: 'Please enter a valid phone number (7-15 digits)' };
  }

  if (!PHONE_REGEX.test(phone)) {
    return { isValid: false, error: 'Please enter a valid phone number' };
  }

  return { isValid: true };
}

