import { useState } from 'react';
import { supabaseClient } from '../../lib/supabase';
import { buildUrl } from '../../lib/utils';
import { Mail, Lock, Loader2, Sparkles } from 'lucide-react';

export default function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingMagicLink, setIsSendingMagicLink] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await supabaseClient.auth.signInWithPassword(formData.email, formData.password);
      // Redirect to admin or home
      const returnUrl = new URLSearchParams(window.location.search).get('returnUrl');
      window.location.href = returnUrl || buildUrl('admin');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      setError('Please enter your email address');
      return;
    }

    setIsSendingMagicLink(true);
    setError(null);

    try {
      const returnUrl = new URLSearchParams(window.location.search).get('returnUrl');
      await supabaseClient.auth.signInWithMagicLink(formData.email, returnUrl || undefined);
      setMagicLinkSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send magic link. Please try again.');
    } finally {
      setIsSendingMagicLink(false);
    }
  };

  if (magicLinkSent) {
    return (
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <Mail className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-primary mb-4">Check Your Email</h2>
        <p className="text-slate-600 mb-2">
          We've sent a magic link to <strong>{formData.email}</strong>
        </p>
        <p className="text-slate-500 text-sm mb-6">
          Click the link in the email to sign in. The link will expire in 1 hour.
        </p>
        <button
          onClick={() => {
            setMagicLinkSent(false);
            setFormData({ email: formData.email, password: '' });
          }}
          className="text-primary hover:text-primary-dark text-sm font-medium"
        >
          Use password instead
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
      <form onSubmit={handleMagicLink} className="space-y-5">
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
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSendingMagicLink || !formData.email}
          className="w-full bg-primary hover:bg-primary-dark text-white py-6 rounded-xl font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
        >
          {isSendingMagicLink ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Sending Magic Link...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Sign in with Magic Link
            </>
          )}
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-slate-500">Or use password</span>
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-slate-700 font-medium mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || !formData.email || !formData.password}
          className="w-full border-2 border-slate-300 text-slate-700 hover:bg-slate-50 py-6 rounded-xl font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              <Lock className="w-5 h-5" />
              Sign in with Password
            </>
          )}
        </button>
      </form>
    </div>
  );
}

