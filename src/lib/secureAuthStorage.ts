/**
 * Secure auth storage adapter for Supabase
 * 
 * Filters only the refresh_token from auth data before storing in localStorage.
 * 
 * SECURITY: Excludes refresh_token to minimize XSS attack surface.
 * The refresh_token can be used to generate new access tokens indefinitely,
 * making it the most sensitive piece of auth data.
 */

/**
 * Recursively replaces refresh_token with empty string
 * We keep the key but remove the value to maintain object structure
 */
function sanitizeRefreshToken(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeRefreshToken);
  }

  const filtered: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === 'refresh_token') {
      filtered[key] = ''; // Replace with empty string instead of removing
      continue;
    }
    filtered[key] = sanitizeRefreshToken(value);
  }
  return filtered;
}

/**
 * Check if a session is expired based on expires_at timestamp
 */
function isSessionExpired(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  
  const session = 'session' in data ? (data as { session: unknown }).session : data;
  if (!session || typeof session !== 'object') return false;
  
  const expiresAt = (session as { expires_at?: number }).expires_at;
  if (typeof expiresAt !== 'number') return false;
  
  // expires_at is Unix timestamp in seconds
  const now = Math.floor(Date.now() / 1000);
  return expiresAt < now;
}

/**
 * Custom storage adapter that filters refresh_token from auth data
 */
export const secureAuthStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const value = localStorage.getItem(key);
      
      // Check if this is an expired auth token
      if (key.includes('-auth-token') && value) {
        const parsed = JSON.parse(value);
        if (isSessionExpired(parsed)) {
          // Token is expired - remove it and return null
          localStorage.removeItem(key);
          return null;
        }
      }
      
      return value;
    } catch {
      return null;
    }
  },

  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;

    try {
      // Only filter auth token storage
      if (key.includes('-auth-token')) {
        const parsed = JSON.parse(value);
        const filtered = sanitizeRefreshToken(parsed);
        localStorage.setItem(key, JSON.stringify(filtered));
        return;
      }

      // For non-auth keys, store as-is
      localStorage.setItem(key, value);
    } catch {
      // Silently fail for storage errors
    }
  },

  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(key);
    } catch {
      // Silently fail for storage errors
    }
  },
};
