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
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabaseClient.supabase.auth.getSession();
        if (session?.user) {
          setIsAuthenticated(true);
          setUserEmail(session.user.email || null);
        } else {
          setIsAuthenticated(false);
          setUserEmail(null);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
        setUserEmail(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabaseClient.supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email || null);
        // Sync user details from Supabase when user logs in
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await syncUserDetailsFromSupabase();
        }
      } else {
        setIsAuthenticated(false);
        setUserEmail(null);
      }
      setIsOpen(false); // Close dropdown on auth state change
    });

    return () => {
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
    try {
      // Clear localStorage
      clearUserDetails();
      clearAssessmentData();

      // Sign out from Supabase
      const { error } = await supabaseClient.supabase.auth.signOut();
      if (error) throw error;

      // Close dropdown
      setIsOpen(false);

      // Redirect to home page
      const homeUrl = buildUrl('/');
      window.location.href = homeUrl;
    } catch (error) {
      console.error('Sign out error:', error);
      alert('Failed to sign out. Please try again.');
      setIsSigningOut(false);
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

