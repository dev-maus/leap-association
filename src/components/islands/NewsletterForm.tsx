import { useState } from 'react';
import { supabaseClient } from '../../lib/supabase';
import { CheckCircle, Loader2 } from 'lucide-react';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Send Magic Link to create/authenticate user
      await supabaseClient.auth.signInWithMagicLink(email);
      setIsSubscribed(true);
      setEmail('');
    } catch (error: any) {
      console.error('Failed to subscribe:', error);
      alert(error.message || 'Failed to subscribe. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubscribed) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
        <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold mb-2">Welcome to the Community!</h3>
        <p className="text-slate-200">
          Check your inbox for a welcome email with your first resources.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="flex-1 px-6 py-6 rounded-xl bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/60 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-accent hover:bg-accent-light text-white px-8 py-6 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Subscribing...
          </>
        ) : (
          'Subscribe'
        )}
      </button>
    </form>
  );
}

