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

    // Clear hash immediately - Supabase should have already captured it on client init
    if (hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }

    // Use onAuthStateChange to wait for Supabase to process the tokens
    // This is the recommended approach - let Supabase handle token processing internally
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Only proceed on SIGNED_IN or INITIAL_SESSION events
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        // Unsubscribe to prevent multiple firings
        subscription.unsubscribe();
        
        // Sync user details
        await syncUserDetailsFromSupabase();

        // Handle redirect
        await handleRedirect(nextUrl, type, session.user.id);
      }
    });

    // Also check immediately for existing session (in case auth already happened)
    const checkExistingSession = async () => {
      // Small delay to let Supabase process hash tokens if present
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Unsubscribe since we found session
        subscription.unsubscribe();
        
        await syncUserDetailsFromSupabase();
        await handleRedirect(nextUrl, type, session.user.id);
      } else if (!hasTokens) {
        // No tokens and no session - show error
        setError('No active session found. Please sign in again.');
      }
      // If hasTokens but no session yet, wait for onAuthStateChange
    };

    checkExistingSession();

    // Helper function to handle redirect
    async function handleRedirect(nextUrl: string | null, type: AuthType, userId: string) {
      // If nextUrl is explicitly provided, use it (e.g., from assessment flow)
      if (nextUrl) {
        const decodedNext = decodeURIComponent(nextUrl);
        const baseUrl = import.meta.env.BASE_URL || '/';
        const redirectUrl = decodedNext.startsWith(baseUrl) ? decodedNext : buildUrl(decodedNext);
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
            window.location.replace(resultsUrl);
            return;
          }

          // No existing assessment - check localStorage for pending assessment type
          const userDetails = getUserDetails();
          if (userDetails.pendingAssessmentType) {
            // Redirect to the assessment page they were trying to access
            const assessmentUrl = buildUrl(`/practice/${userDetails.pendingAssessmentType}`);
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
        window.location.replace(redirectUrl);
      } catch {
        window.location.replace(buildUrl('/'));
      }
    }

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
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
