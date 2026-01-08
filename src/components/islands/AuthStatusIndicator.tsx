import { useState, useEffect, useRef } from 'react';
import { supabaseClient } from '../../lib/supabase';
import { LogOut, User, LogIn } from 'lucide-react';
import { clearUserDetails, syncUserDetailsFromSupabase } from '../../lib/userStorage';
import { clearAssessmentData } from '../../lib/assessmentStorage';
import { buildUrl } from '../../lib/utils';

export default function AuthStatusIndicator() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    // Listen for auth state changes FIRST - this will fire INITIAL_SESSION if session exists
    const { data: { subscription } } = supabaseClient.supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthStatusIndicator] onAuthStateChange:', event, 'hasSession:', !!session, 'userEmail:', session?.user?.email);
      
      if (!mounted) return;
      
      if (session?.user) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email || null);
        setIsLoading(false);
        // Sync user details from Supabase when user logs in or session is initialized
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          await syncUserDetailsFromSupabase();
        }
      } else {
        setIsAuthenticated(false);
        setUserEmail(null);
        setIsLoading(false);
      }
      setIsOpen(false); // Close dropdown on auth state change
    });

    // Also check session directly as fallback
    const checkAuth = async () => {
      try {
        // Small delay to let onAuthStateChange fire first
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const { data: { session }, error: sessionError } = await supabaseClient.supabase.auth.getSession();
        console.log('[AuthStatusIndicator] Direct getSession check:', { hasSession: !!session, error: sessionError, userEmail: session?.user?.email });
        
        if (mounted) {
          if (session?.user) {
            setIsAuthenticated(true);
            setUserEmail(session.user.email || null);
            setIsLoading(false);
          } else {
            // Only update if we haven't been set by onAuthStateChange yet
            setIsAuthenticated(prev => prev ? prev : false);
            setUserEmail(prev => prev ? prev : null);
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error('[AuthStatusIndicator] Auth check error:', error);
        if (mounted) {
          setIsAuthenticated(prev => prev ? prev : false);
          setUserEmail(prev => prev ? prev : null);
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setIsOpen(false);
    
    try {
      // Clear localStorage first
      clearUserDetails();
      clearAssessmentData();
      
      // Clear all localStorage to be sure
      if (typeof window !== 'undefined') {
        try {
          // Get all keys
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
      
      // Sign out from Supabase with timeout
      const signOutPromise = supabaseClient.supabase.auth.signOut();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 2000)
      );
      
      try {
        await Promise.race([signOutPromise, timeoutPromise]);
      } catch (err) {
        console.warn('Sign out timeout or error (proceeding anyway):', err);
      }

      // Force redirect with full page reload to clear all state
      const homeUrl = buildUrl('/');
      window.location.href = homeUrl;
    } catch (error) {
      console.error('Sign out error:', error);
      // Force redirect even on error
      const homeUrl = buildUrl('/');
      window.location.href = homeUrl;
    }
  };

  const handleSignIn = () => {
    setIsOpen(false);
    const magicLinkUrl = buildUrl('/auth/magic-link');
    window.location.href = magicLinkUrl;
  };

  // Always show the icon, even while loading
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
        aria-label={isLoading ? 'Loading...' : (isAuthenticated ? 'User menu' : 'Sign in')}
      >
        <User className={`w-5 h-5 ${isLoading ? 'opacity-50' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
          {isAuthenticated ? (
            <>
              <div className="px-4 py-3 border-b border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Signed in as</p>
                <p className="text-sm font-medium text-slate-900 truncate">{userEmail || 'User'}</p>
              </div>
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
                {isSigningOut ? 'Signing out...' : 'Sign Out'}
              </button>
            </>
          ) : (
            <button
              onClick={handleSignIn}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
          )}
        </div>
      )}
    </div>
  );
}

