import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { buildUrl } from '../../lib/utils';
import { Loader2, AlertCircle } from 'lucide-react';

type AuthType = 'recovery' | 'signup' | 'magiclink' | 'invite' | null;

export default function AuthCallback() {
  const [error, setError] = useState<string | null>(null);
  const [authType, setAuthType] = useState<AuthType>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check URL hash for tokens (Supabase redirect)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type') as AuthType;

        setAuthType(type);

        // Check URL query params for redirect destination
        const urlParams = new URLSearchParams(window.location.search);
        const nextUrl = urlParams.get('next');
        const errorDescription = urlParams.get('error_description');

        if (errorDescription) {
          throw new Error(errorDescription);
        }

        if (accessToken) {
          // Exchange tokens for session
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (sessionError) throw sessionError;

          // Redirect based on auth type or next parameter
          if (nextUrl) {
            // Use the next parameter if provided
            window.location.href = buildUrl(nextUrl);
            return;
          }

          switch (type) {
            case 'recovery':
              window.location.href = buildUrl('auth/reset-password');
              return;
            case 'signup':
            case 'magiclink':
            case 'invite':
              // Default to admin for admins, home for regular users
              // Check user role to determine redirect
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                const { data: profile } = await supabase
                  .from('user_profiles')
                  .select('user_role')
                  .eq('id', user.id)
                  .single();
                
                if (profile?.user_role === 'admin') {
                  window.location.href = buildUrl('admin');
                } else {
                  window.location.href = buildUrl('/');
                }
              } else {
                window.location.href = buildUrl('/');
              }
              return;
            default:
              window.location.href = buildUrl('/');
              return;
          }
        }

        // No tokens found - check if there's an existing session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          if (nextUrl) {
            window.location.href = buildUrl(nextUrl);
          } else {
            window.location.href = buildUrl('admin');
          }
          return;
        }

        // No tokens, no session - invalid callback
        throw new Error('Invalid authentication callback');
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError(err.message || 'Authentication failed. Please try again.');
      }
    };

    handleAuthCallback();
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

