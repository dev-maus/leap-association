import { useState } from 'react';
import { supabaseClient } from '../../lib/supabase';
import { buildUrl } from '../../lib/utils';
import { Mail, Loader2, CheckCircle } from 'lucide-react';

export default function MagicLinkForm() {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setError(null);

    try {
      const returnUrl = new URLSearchParams(window.location.search).get('returnUrl');
      await supabaseClient.auth.signInWithMagicLink(email, returnUrl || undefined);
      setIsSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send magic link. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  if (isSent) {
    return (
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-primary mb-4">Check Your Email</h2>
        <p className="text-slate-600 mb-2">
          We've sent a magic link to <strong>{email}</strong>
        </p>
        <p className="text-slate-500 text-sm mb-6">
          Click the link in the email to sign in. The link will expire in 1 hour.
        </p>
        <button
          onClick={() => {
            setIsSent(false);
            setEmail('');
          }}
          className="text-primary hover:text-primary-dark text-sm font-medium"
        >
          Send another link
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-slate-700 font-medium mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSending || !email}
          className="w-full bg-primary hover:bg-primary-dark text-white py-6 rounded-xl font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Sending Magic Link...
            </>
          ) : (
            'Send Magic Link'
          )}
        </button>

        <div className="text-center">
          <a
            href={buildUrl('auth/login')}
            className="text-sm text-slate-600 hover:text-primary transition-colors"
          >
            Sign in with password instead
          </a>
        </div>
      </form>
    </div>
  );
}

