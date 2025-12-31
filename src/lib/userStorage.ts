/**
 * User storage utility for managing user details in localStorage
 * Stores user information to prepopulate forms across the website
 */

export interface UserDetails {
  full_name?: string;
  email?: string;
  company?: string;
  role?: string;
  phone?: string;
  leadId?: string;
}

const STORAGE_KEY = 'leap_user_details';

const isClient = typeof window !== 'undefined';

/**
 * Get user details from localStorage
 */
export function getUserDetails(): UserDetails {
  if (!isClient) return {};

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Failed to read user details from localStorage:', error);
    return {};
  }
}

/**
 * Save user details to localStorage
 * Only saves non-empty values
 */
export function saveUserDetails(details: Partial<UserDetails>): void {
  if (!isClient) return;

  try {
    const updated = {
      ...getUserDetails(),
      ...Object.fromEntries(
        Object.entries(details).filter(([_, value]) => 
          typeof value === 'string' ? value.trim() : value
        )
      ),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save user details to localStorage:', error);
  }
}

/**
 * Clear user details from localStorage
 */
export function clearUserDetails(): void {
  if (!isClient) return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear user details from localStorage:', error);
  }
}

