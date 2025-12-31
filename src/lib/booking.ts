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
    const userDetails = getUserDetails();
    const url = new URL(baseUrl);
    
    if (userDetails.full_name) {
      url.searchParams.set('name', userDetails.full_name);
    }
    if (userDetails.email) {
      url.searchParams.set('email', userDetails.email);
    }
    
    return url.toString();
  } catch (error) {
    // If URL parsing fails, return original URL
    return baseUrl;
  }
}

