import { useState, useEffect } from 'react';
import { supabaseClient } from '../../lib/supabase';
import { Calendar, Users, Mail, Building, Loader2, CheckCircle } from 'lucide-react';
import { getUserDetails, saveUserDetails } from '../../lib/userStorage';

interface EventRegistrationProps {
  eventId: string;
}

export default function EventRegistration({ eventId }: EventRegistrationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    company: '',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Load user details after hydration to prevent SSR mismatch
  useEffect(() => {
    const stored = getUserDetails();
    if (stored.full_name || stored.email) {
      setFormData(prev => ({
        ...prev,
        full_name: stored.full_name || '',
        email: stored.email || '',
        company: stored.company || '',
        phone: stored.phone || '',
      }));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await supabaseClient.entities.SignatureEventRegistration.create({
        ...formData,
        event_id: eventId,
      });

      saveUserDetails(formData);

      setIsSubmitted(true);
      setFormData({
        full_name: formData.full_name,
        email: formData.email,
        company: formData.company,
        phone: formData.phone,
      });
    } catch (error) {
      console.error('Failed to register:', error);
      alert('Failed to register. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
        <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
        <p className="text-green-800 font-semibold">Registration Successful!</p>
        <p className="text-green-700 text-sm">Check your email for confirmation details.</p>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors"
      >
        Register Now
      </button>

      {isOpen && (
        <div className="mt-6 bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-primary mb-4">Event Registration</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                  Email *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-slate-700 mb-1">
                  Company
                </label>
                <input
                  id="company"
                  name="company"
                  type="text"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">
                  Phone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-white py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <Calendar className="w-5 h-5" />
                  Complete Registration
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

