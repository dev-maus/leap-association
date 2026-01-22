import { useState, useEffect, useCallback } from 'react';
import { supabaseClient } from './supabase';
import { clearUserDetails, syncUserDetailsFromSupabase } from './userStorage';
import { clearAssessmentData } from './assessmentStorage';
import { buildUrl } from './utils';

interface AuthState {
  isAuthenticated: boolean;
  userEmail: string | null;
  isLoading: boolean;
  isSigningOut: boolean;
}

interface UseAuthReturn extends AuthState {
  signOut: () => Promise<void>;
  signIn: () => void;
}

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    userEmail: null,
    isLoading: true,
    isSigningOut: false,
  });

  useEffect(() => {
    let mounted = true;
    let hasResolved = false;

    const resolveAuthState = (isAuthenticated: boolean, userEmail: string | null) => {
      if (!mounted || hasResolved) return;
      hasResolved = true;
      setState(prev => ({
        ...prev,
        isAuthenticated,
        userEmail,
        isLoading: false,
      }));
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabaseClient.supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      if (session?.user) {
        resolveAuthState(true, session.user.email || null);
        // Sync user details in background (don't block)
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          syncUserDetailsFromSupabase().catch(() => {});
        }
      } else {
        resolveAuthState(false, null);
      }
    });

    // Also check session directly as a fallback
    const checkAuth = async () => {
      try {
        // Small delay to let onAuthStateChange potentially fire first
        await new Promise(resolve => setTimeout(resolve, 50));
        
        if (hasResolved) return; // Already resolved by onAuthStateChange
        
        const { data, error } = await supabaseClient.supabase.auth.getSession();
        
        if (error) {
          resolveAuthState(false, null);
          return;
        }
        
        const session = data?.session;
        resolveAuthState(!!session?.user, session?.user?.email || null);
      } catch {
        resolveAuthState(false, null);
      }
    };

    checkAuth();

    // Timeout fallback - ensure we never stay in loading state forever
    const timeoutId = setTimeout(() => {
      if (!hasResolved && mounted) {
        resolveAuthState(false, null);
      }
    }, 5000);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    setState(prev => ({ ...prev, isSigningOut: true }));
    
    try {
      clearUserDetails();
      clearAssessmentData();
      
      if (typeof window !== 'undefined') {
        try {
          const keys = Object.keys(localStorage);
          keys.forEach(key => {
            if (key.startsWith('leap_') || key.startsWith('sb-')) {
              localStorage.removeItem(key);
            }
          });
        } catch {
          // Ignore localStorage errors
        }
      }
      
      const signOutPromise = supabaseClient.supabase.auth.signOut();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 2000)
      );
      
      try {
        await Promise.race([signOutPromise, timeoutPromise]);
      } catch {
        // Proceed with redirect even if sign out fails
      }

      const homeUrl = buildUrl('/');
      window.location.href = homeUrl;
    } catch {
      const homeUrl = buildUrl('/');
      window.location.href = homeUrl;
    }
  }, []);

  const signIn = useCallback(() => {
    const magicLinkUrl = buildUrl('/auth/magic-link');
    window.location.href = magicLinkUrl;
  }, []);

  return {
    ...state,
    signOut,
    signIn,
  };
}
