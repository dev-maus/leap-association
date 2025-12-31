/**
 * Booking utility to get booking URL with prepopulated user details
 */

import { getUserDetails } from './userStorage';

/**
 * Get booking URL with user details as query parameters
 * This should be called client-side to access localStorage
 */
export function getBookingUrlWithParams(baseUrl: string): string {
  try {
    const { full_name, email } = getUserDetails();
    const url = new URL(baseUrl);
    
    if (full_name?.trim()) url.searchParams.set('name', full_name.trim());
    if (email?.trim()) url.searchParams.set('email', email.trim());
    
    return url.toString();
  } catch (error) {
    return baseUrl;
  }
}

