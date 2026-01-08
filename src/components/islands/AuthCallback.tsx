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
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    // Only run once - use a ref that persists across strict mode double-invocations
    if (hasProcessedRef.current) {
      return;
    }
    hasProcessedRef.current = true;

    // Capture URL params immediately (before any async operations)
    let urlParams = new URLSearchParams(window.location.search);
    let nextUrl = urlParams.get('next');
    const errorDescription = urlParams.get('error_description');
    
    // Check URL hash for auth type (but DON'T manually parse tokens)
    const hash = window.location.hash.substring(1);
    const hashParams = new URLSearchParams(hash);
    const type = hashParams.get('type') as AuthType;
    const hasTokens = !!hashParams.get('access_token');
    
    // Extract redirect_to from hash if present (Supabase sometimes puts it in the hash)
    const redirectToFromHash = hashParams.get('redirect_to');
    if (redirectToFromHash && !nextUrl) {
      // Parse the redirect_to URL to extract next parameter if it exists
      try {
        const redirectUrl = new URL(redirectToFromHash);
        const nextParam = redirectUrl.searchParams.get('next');
        if (nextParam) {
          // Store the next parameter for use in redirect
          nextUrl = nextParam;
        }
      } catch (e) {
        // Invalid URL, ignore
      }
    }
    
    setAuthType(type);

    if (errorDescription) {
      setError(errorDescription);
      return;
    }

    // DON'T clear hash immediately - let Supabase process it first
    // We'll clear it after session is established

    let sessionEstablished = false;
    let subscriptionCleanup: (() => void) | null = null;

    // Use onAuthStateChange to wait for Supabase to process the tokens
    // This is the recommended approach - let Supabase handle token processing internally
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthCallback] onAuthStateChange event:', event, 'hasSession:', !!session);
      
      // Only proceed on SIGNED_IN or INITIAL_SESSION events
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        // Prevent multiple redirects
        if (hasRedirectedRef.current || sessionEstablished) {
          return;
        }
        sessionEstablished = true;
        hasRedirectedRef.current = true;
        
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
    // This ensures Supabase processes the hash tokens even if onAuthStateChange hasn't fired yet
    if (hasTokens) {
      console.log('[AuthCallback] Hash tokens detected, triggering session check...');
      // Call getSession() to trigger Supabase to process hash tokens
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        console.log('[AuthCallback] Initial session check after token detection:', { hasSession: !!session, error });
      });
    }

    // Also check for existing session with retries (in case auth already happened)
    const checkExistingSession = async () => {
      // Wait longer for Supabase to process hash tokens if present
      // Magic links need time for Supabase to exchange tokens
      const maxRetries = hasTokens ? 15 : 3; // More retries if we have tokens (increased from 10)
      const delayMs = hasTokens ? 400 : 200; // Longer delay if we have tokens (increased from 300)
      
      for (let i = 0; i < maxRetries; i++) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
        
        // Explicitly call getSession to trigger processing
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log('[AuthCallback] Session check attempt', i + 1, 'hasSession:', !!session, 'error:', sessionError);
        
        if (session?.user) {
          // Prevent multiple redirects
          if (hasRedirectedRef.current || sessionEstablished) {
            return;
          }
          sessionEstablished = true;
          hasRedirectedRef.current = true;
          
          // Unsubscribe since we found session
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
      
      // After all retries, if we had tokens but no session, wait for onAuthStateChange
      // If we had no tokens and no session, show error
      if (!hasTokens && !sessionEstablished) {
        console.error('[AuthCallback] No tokens and no session after retries');
        setError('No active session found. Please sign in again.');
      } else if (hasTokens && !sessionEstablished) {
        console.warn('[AuthCallback] Had tokens but no session after retries, waiting for onAuthStateChange...');
        // Don't show error yet - onAuthStateChange might still fire
      }
      // If hasTokens but no session yet, onAuthStateChange will handle it
    };

    checkExistingSession();

    // Helper function to handle redirect
    async function handleRedirect(nextUrl: string | null, type: AuthType, userId: string) {
      // Wait longer to ensure session is fully established and persisted
      // This is critical for magic link flows where the session needs to be saved
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verify session is still valid and persisted before redirecting
      let sessionValid = false;
      for (let i = 0; i < 5; i++) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && session.user.id === userId) {
          sessionValid = true;
          break;
        }
        // Wait a bit more and retry
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      if (!sessionValid) {
        console.error('Session not properly established before redirect');
        setError('Authentication session not ready. Please wait a moment and try again.');
        return;
      }
      
      // If nextUrl is explicitly provided, use it (e.g., from assessment flow)
      if (nextUrl) {
        const decodedNext = decodeURIComponent(nextUrl);
        const baseUrl = import.meta.env.BASE_URL || '/';
        let redirectUrl = decodedNext.startsWith(baseUrl) ? decodedNext : buildUrl(decodedNext);
        
        // Prevent redirect loops - don't redirect to callback page or auth pages
        if (redirectUrl.includes('/auth/')) {
          redirectUrl = buildUrl('/');
        }
        
        console.log('Redirecting to:', redirectUrl);
        window.location.replace(redirectUrl);
        return;
      }

      if (type === 'recovery') {
        window.location.replace(buildUrl('auth/reset-password'));
        return;
      }

      // For returning users (magic link), check if they have an existing assessment
      if (type === 'magiclink' || type === 'signup') {
        try {
          // Check for existing assessment
          const { data: existingAssessment, error: assessmentError } = await supabase
            .from('assessment_responses')
            .select('id, assessment_type')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (!assessmentError && existingAssessment) {
            // User has an existing assessment - redirect to results
            const resultsUrl = buildUrl(`/practice/results?id=${existingAssessment.id}`);
            console.log('Redirecting to results:', resultsUrl);
            window.location.replace(resultsUrl);
            return;
          }

          // No existing assessment - check localStorage for pending assessment type
          const userDetails = getUserDetails();
          if (userDetails.pendingAssessmentType) {
            // Redirect to the assessment page they were trying to access
            const assessmentUrl = buildUrl(`/practice/${userDetails.pendingAssessmentType}`);
            console.log('Redirecting to assessment:', assessmentUrl);
            window.location.replace(assessmentUrl);
            return;
          }
        } catch (error) {
          // If error checking assessment, continue with default redirect
          console.error('Error checking assessment:', error);
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
        console.log('Redirecting to default:', redirectUrl);
        window.location.replace(redirectUrl);
      } catch {
        const redirectUrl = buildUrl('/');
        console.log('Redirecting to home (fallback):', redirectUrl);
        window.location.replace(redirectUrl);
      }
    }

    // Cleanup subscription on unmount
    return () => {
      if (subscriptionCleanup) {
        subscriptionCleanup();
      } else {
        subscription.unsubscribe();
      }
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
