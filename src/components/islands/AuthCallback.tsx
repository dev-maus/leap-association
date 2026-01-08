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
    
    // Check URL hash for auth type (but DON'T manually parse tokens)
    const hash = window.location.hash.substring(1);
    const hashParams = new URLSearchParams(hash);
    const type = hashParams.get('type') as AuthType;
    const hasTokens = !!hashParams.get('access_token');
    
    setAuthType(type);

    if (errorDescription) {
      setError(errorDescription);
      return;
    }

    // DON'T clear hash immediately - let Supabase process it first
    let sessionEstablished = false;
    let subscriptionCleanup: (() => void) | null = null;

    // Use onAuthStateChange to wait for Supabase to process the tokens
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthCallback] onAuthStateChange event:', event, 'hasSession:', !!session);
      
      // Only proceed on SIGNED_IN or INITIAL_SESSION events
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        if (sessionEstablished) return;
        sessionEstablished = true;
        
        // Unsubscribe to prevent multiple firings
        subscription.unsubscribe();
        subscriptionCleanup = null;
        
        // Clear hash now that session is established
        if (hash) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
        
        // Sync user details
        await syncUserDetailsFromSupabase();

        // Handle redirect
        await handleRedirect(nextUrl, type, session.user.id);
      }
    });

    subscriptionCleanup = () => subscription.unsubscribe();

    // If we have tokens in the hash, explicitly trigger Supabase to process them
    if (hasTokens) {
      console.log('[AuthCallback] Hash tokens detected, triggering session check...');
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        console.log('[AuthCallback] Initial session check after token detection:', { hasSession: !!session, error });
      });
    }

    // Also check for existing session with retries (in case auth already happened)
    const checkExistingSession = async () => {
      const maxRetries = hasTokens ? 15 : 3;
      const delayMs = hasTokens ? 400 : 200;
      
      for (let i = 0; i < maxRetries; i++) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log('[AuthCallback] Session check attempt', i + 1, 'hasSession:', !!session, 'error:', sessionError);
        
        if (session?.user) {
          if (sessionEstablished) return;
          sessionEstablished = true;
          
          if (subscriptionCleanup) {
            subscriptionCleanup();
            subscriptionCleanup = null;
          }
          
          // Clear hash now that session is established
          if (hash) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }
          
          await syncUserDetailsFromSupabase();
          await handleRedirect(nextUrl, type, session.user.id);
          return;
        }
      }
      
      if (!hasTokens && !sessionEstablished) {
        console.error('[AuthCallback] No tokens and no session after retries');
        setError('No active session found. Please sign in again.');
      } else if (hasTokens && !sessionEstablished) {
        console.warn('[AuthCallback] Had tokens but no session after retries, waiting for onAuthStateChange...');
      }
    };

    checkExistingSession();

    // Timeout fallback - if nothing happens in 10 seconds, redirect to home
    const timeoutId = setTimeout(() => {
      if (subscriptionCleanup) {
        subscriptionCleanup();
      } else {
        subscription.unsubscribe();
      }
      if (!sessionEstablished) {
        console.warn('[AuthCallback] Timeout reached, redirecting to home');
        window.location.replace(buildUrl('/'));
      }
    }, 10000);

    // Helper function to handle redirect
    async function handleRedirect(nextUrl: string | null, type: AuthType, userId: string) {
      // Small delay to ensure session is fully established
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Verify session is still valid
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.error('[AuthCallback] Session lost before redirect');
        setError('Authentication session expired. Please try again.');
        return;
      }

      // If nextUrl is explicitly provided, use it
      if (nextUrl) {
        const decodedNext = decodeURIComponent(nextUrl);
        const baseUrl = import.meta.env.BASE_URL || '/';
        let redirectUrl = decodedNext.startsWith(baseUrl) ? decodedNext : buildUrl(decodedNext);
        
        // Prevent redirect loops - don't redirect to auth pages
        if (redirectUrl.includes('/auth/')) {
          redirectUrl = buildUrl('/');
        }
        
        console.log('[AuthCallback] Redirecting to nextUrl:', redirectUrl);
        window.location.replace(redirectUrl);
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
            const resultsUrl = buildUrl(`/practice/results?id=${existingAssessment.id}`);
            console.log('[AuthCallback] Redirecting to results:', resultsUrl);
            window.location.replace(resultsUrl);
            return;
          }

          // No existing assessment - check localStorage for pending assessment type
          const userDetails = getUserDetails();
          if (userDetails.pendingAssessmentType) {
            const assessmentUrl = buildUrl(`/practice/${userDetails.pendingAssessmentType}`);
            console.log('[AuthCallback] Redirecting to assessment:', assessmentUrl);
            window.location.replace(assessmentUrl);
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

        const redirectUrl = profile?.user_role === 'admin' ? buildUrl('admin') : buildUrl('/');
        console.log('[AuthCallback] Redirecting to default:', redirectUrl);
        window.location.replace(redirectUrl);
      } catch {
        const redirectUrl = buildUrl('/');
        console.log('[AuthCallback] Redirecting to home (fallback):', redirectUrl);
        window.location.replace(redirectUrl);
      }
    }

    // Cleanup subscription and timeout on unmount
    return () => {
      if (subscriptionCleanup) {
        subscriptionCleanup();
      } else {
        subscription.unsubscribe();
      }
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
