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

    const { data: { subscription } } = supabaseClient.supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      if (session?.user) {
        setState(prev => ({
          ...prev,
          isAuthenticated: true,
          userEmail: session.user.email || null,
          isLoading: false,
        }));
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          await syncUserDetailsFromSupabase();
        }
      } else {
        setState(prev => ({
          ...prev,
          isAuthenticated: false,
          userEmail: null,
          isLoading: false,
        }));
      }
    });

    const checkAuth = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 100));
        const { data: { session } } = await supabaseClient.supabase.auth.getSession();
        
        if (mounted) {
          setState(prev => ({
            ...prev,
            isAuthenticated: !!session?.user,
            userEmail: session?.user?.email || null,
            isLoading: false,
          }));
        }
      } catch (error) {
        console.error('[useAuth] Auth check error:', error);
        if (mounted) {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      }
    };

    checkAuth();

    return () => {
      mounted = false;
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
        } catch (e) {
          console.warn('Error clearing localStorage:', e);
        }
      }
      
      const signOutPromise = supabaseClient.supabase.auth.signOut();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 2000)
      );
      
      try {
        await Promise.race([signOutPromise, timeoutPromise]);
      } catch (err) {
        console.warn('Sign out timeout or error (proceeding anyway):', err);
      }

      const homeUrl = buildUrl('/');
      window.location.href = homeUrl;
    } catch (error) {
      console.error('Sign out error:', error);
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
