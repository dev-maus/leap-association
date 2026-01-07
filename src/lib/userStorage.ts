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

/**
 * Sync user details from Supabase to localStorage
 * Fetches user profile data from Supabase and saves it to localStorage
 */
export async function syncUserDetailsFromSupabase(): Promise<void> {
  if (!isClient) return;

  try {
    // Dynamically import supabase to avoid circular dependencies
    const { supabase } = await import('./supabase');
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return; // Not authenticated, nothing to sync
    }

    // Fetch user profile from user_profiles table
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('full_name, email, company, role, phone')
      .eq('id', session.user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Failed to fetch user profile:', error);
      return;
    }

    // Get user data from auth if profile doesn't exist
    const userData: UserDetails = {
      email: profile?.email || session.user.email || '',
      full_name: profile?.full_name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
      company: profile?.company || session.user.user_metadata?.company || '',
      role: profile?.role || session.user.user_metadata?.role || '',
      phone: profile?.phone || session.user.user_metadata?.phone || '',
    };

    // Save to localStorage, merging with existing data (don't overwrite if localStorage has more recent data)
    const existing = getUserDetails();
    saveUserDetails({
      ...userData,
      // Keep existing values if they're more complete (e.g., user filled out form before logging in)
      ...Object.fromEntries(
        Object.entries(existing).filter(([key, value]) => {
          // Keep existing value if it's more complete than the Supabase value
          const supabaseValue = userData[key as keyof UserDetails];
          return value && (!supabaseValue || (typeof value === 'string' && value.length > (supabaseValue?.length || 0)));
        })
      ),
    });
  } catch (error) {
    console.error('Failed to sync user details from Supabase:', error);
  }
}

