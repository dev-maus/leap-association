import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { buildUrl } from '../../lib/utils';
import { Loader2, AlertCircle } from 'lucide-react';
import { syncUserDetailsFromSupabase, getUserDetails } from '../../lib/userStorage';

type AuthType = 'recovery' | 'signup' | 'magiclink' | 'invite' | null;

export default function AuthCallback() {
  const [error, setError] = useState<string | null>(null);
  const [authType, setAuthType] = useState<AuthType>(null);
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    // Only run once - use a ref that persists across strict mode double-invocations
    if (hasProcessedRef.current) {
      return;
    }
    hasProcessedRef.current = true;

    // Capture URL params immediately (before any async operations)
    const urlParams = new URLSearchParams(window.location.search);
    const nextUrl = urlParams.get('next');
    const errorDescription = urlParams.get('error_description');
    
    // Check URL hash for auth type
    const hash = window.location.hash.substring(1);
    const hashParams = new URLSearchParams(hash);
    const type = hashParams.get('type') as AuthType;
    setAuthType(type);

    if (errorDescription) {
      setError(errorDescription);
      return;
    }

    let hasRedirected = false;

    // Use onAuthStateChange - Supabase will automatically process hash tokens with detectSessionInUrl: true
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (hasRedirected) return;
      
      // Handle successful authentication
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        hasRedirected = true;
        subscription.unsubscribe();
        
        // Clear hash
        if (hash) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
        
        // Sync user details
        await syncUserDetailsFromSupabase();

        // Handle redirect
        await handleRedirect(nextUrl, type, session.user.id);
      } else if (event === 'SIGNED_OUT') {
        hasRedirected = true;
        subscription.unsubscribe();
        window.location.replace(buildUrl('/'));
      }
    });

    // Also check for existing session immediately (fallback)
    const checkSession = async () => {
      // Small delay to let Supabase process hash tokens
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (hasRedirected) return;
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user && !hasRedirected) {
        hasRedirected = true;
        subscription.unsubscribe();
        
        // Clear hash
        if (hash) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
        
        await syncUserDetailsFromSupabase();
        await handleRedirect(nextUrl, type, session.user.id);
      } else if (!session && !hash) {
        // No session and no hash tokens - show error
        setError('No active session found. Please sign in again.');
      }
    };

    checkSession();

    // Timeout fallback
    const timeoutId = setTimeout(() => {
      if (!hasRedirected) {
        console.warn('[AuthCallback] Timeout reached, redirecting to home');
        subscription.unsubscribe();
        window.location.replace(buildUrl('/'));
      }
    }, 8000);

    // Allowed redirect patterns for security
    const ALLOWED_REDIRECT_PATTERNS = [
      /^\/practice\//,
      /^\/practice\/results/,
      /^\/admin$/,
      /^\/resources\//,
      /^\/$/,
      /^\/about$/,
      /^\/contact$/,
      /^\/faq$/,
      /^\/schedule$/,
      /^\/solutions$/,
    ];

    function isValidRedirect(url: string): boolean {
      // Prevent protocol-relative URLs and external redirects
      if (url.startsWith('//') || /^https?:\/\//i.test(url)) {
        return false;
      }
      // Remove query string and hash for pattern matching
      const pathOnly = url.split('?')[0].split('#')[0];
      return ALLOWED_REDIRECT_PATTERNS.some(pattern => pattern.test(pathOnly));
    }

    // Helper function to handle redirect
    async function handleRedirect(nextUrl: string | null, type: AuthType, userId: string) {
      // Small delay to ensure session is fully established
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Verify session is still valid
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (!session?.user) {
        console.error('[AuthCallback] Session lost before redirect', sessionError);
        setError('Authentication session expired. Please try again.');
        return;
      }

      // If nextUrl is explicitly provided, validate it
      if (nextUrl) {
        const decodedNext = decodeURIComponent(nextUrl);
        
        // Validate redirect URL against allowlist
        if (!isValidRedirect(decodedNext)) {
          console.warn('[AuthCallback] Invalid redirect URL, redirecting to home:', decodedNext);
          const redirectPath = buildUrl('/');
          const redirectUrl = typeof window !== 'undefined' 
            ? `${window.location.origin}${redirectPath}`
            : redirectPath;
          window.location.href = redirectUrl;
          return;
        }
        
        const baseUrl = import.meta.env.BASE_URL || '/';
        let redirectPath = decodedNext.startsWith(baseUrl) ? decodedNext : buildUrl(decodedNext);
        
        // Prevent redirect loops - don't redirect to auth pages
        if (redirectPath.includes('/auth/')) {
          redirectPath = buildUrl('/');
        }
        
        // Construct absolute URL for reliable redirect
        const redirectUrl = typeof window !== 'undefined' 
          ? `${window.location.origin}${redirectPath}`
          : redirectPath;
        
        // Use window.location.href for more reliable navigation (works better with SPAs)
        window.location.href = redirectUrl;
        return;
      }

      if (type === 'recovery') {
        window.location.replace(buildUrl('auth/reset-password'));
        return;
      }

      // For magic link/signup, check for existing assessment or pending assessment
      if (type === 'magiclink' || type === 'signup') {
        try {
          const { data: existingAssessment, error: assessmentError } = await supabase
            .from('assessment_responses')
            .select('id, assessment_type')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();


          if (!assessmentError && existingAssessment) {
            const resultsPath = buildUrl(`/practice/results?id=${existingAssessment.id}`);
            const resultsUrl = typeof window !== 'undefined' 
              ? `${window.location.origin}${resultsPath}`
              : resultsPath;
            // Use window.location.href for more reliable navigation (works better with SPAs)
            window.location.href = resultsUrl;
            return;
          }

          // No existing assessment - check localStorage for pending assessment type
          const userDetails = getUserDetails();
          if (userDetails.pendingAssessmentType) {
            const assessmentPath = buildUrl(`/practice/${userDetails.pendingAssessmentType}`);
            const assessmentUrl = typeof window !== 'undefined' 
              ? `${window.location.origin}${assessmentPath}`
              : assessmentPath;
            // Use window.location.href for more reliable navigation (works better with SPAs)
            window.location.href = assessmentUrl;
            return;
          }
        } catch (error) {
          console.error('[AuthCallback] Error checking assessment:', error);
        }
      }

      // Default redirect: Check user role for admin or home
      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('user_role')
          .eq('id', userId)
          .single();

        const redirectPath = profile?.user_role === 'admin' ? buildUrl('admin') : buildUrl('/');
        const redirectUrl = typeof window !== 'undefined' 
          ? `${window.location.origin}${redirectPath}`
          : redirectPath;
        // Use window.location.href for more reliable navigation (works better with SPAs)
        window.location.href = redirectUrl;
      } catch {
        const redirectPath = buildUrl('/');
        const redirectUrl = typeof window !== 'undefined' 
          ? `${window.location.origin}${redirectPath}`
          : redirectPath;
        // Use window.location.href for more reliable navigation (works better with SPAs)
        window.location.href = redirectUrl;
      }
    }

    // Cleanup subscription and timeout on unmount
    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-primary mb-4">Authentication Failed</h2>
        <p className="text-slate-600 mb-6">{error}</p>
        <a
          href={buildUrl('auth/login')}
          className="inline-block px-8 py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors"
        >
          Back to Sign In
        </a>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center">
      <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-6" />
      <h2 className="text-xl font-semibold text-primary mb-2">
        {authType === 'recovery' ? 'Verifying Reset Link...' : 'Authenticating...'}
      </h2>
      <p className="text-slate-600">Please wait while we process your request.</p>
    </div>
  );
}
