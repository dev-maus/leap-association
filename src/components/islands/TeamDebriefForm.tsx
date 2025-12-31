import { useState } from 'react';
import { supabaseClient } from '../../lib/supabase';
import { buildUrl, BASE_URL } from '../../lib/utils';
import { Calendar, Users, Mail, Building, Briefcase, Phone, MessageSquare, Loader2, CheckCircle, Target } from 'lucide-react';

export default function TeamDebriefForm() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    company: '',
    role: '',
    phone: '',
    team_size: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await supabaseClient.entities.Lead.create({
        ...formData,
        source: 'team_debrief',
      });

      setIsSubmitted(true);
    } catch (error) {
      console.error('Failed to submit:', error);
      alert('Failed to submit request. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-10">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-primary mb-4">Debrief Request Received!</h1>
          <p className="text-lg text-slate-600 mb-8">
            Thank you for requesting a Team HATS™ Debrief. Our team will reach out
            within 24 hours to schedule your session and prepare customized insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={BASE_URL} className="btn-primary">
              Back to Home
            </a>
            <a href={buildUrl('practice')} className="btn-outline">
              <Target className="w-4 h-4 mr-2 inline" />
              Take Another Assessment
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-5 gap-12">
      {/* Left - Benefits */}
      <div className="lg:col-span-2">
        <div className="bg-primary rounded-3xl p-8 text-white sticky top-28">
          <h2 className="text-xl font-bold mb-6">What's Included</h2>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Results Analysis</h3>
                <p className="text-slate-300 text-sm">
                  Deep dive into your team's HATS™ scores and LEAP dimension alignment.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Personalized Insights</h3>
                <p className="text-slate-300 text-sm">
                  Receive custom recommendations based on your team's unique patterns.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Action Plan</h3>
                <p className="text-slate-300 text-sm">
                  Leave with clear, prioritized practices to implement immediately.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Team Facilitation</h3>
                <p className="text-slate-300 text-sm">
                  Interactive session with your leadership team to align on next steps.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-white/10">
            <div className="text-sm text-slate-300 space-y-2">
              <p className="font-semibold text-white">Session Details:</p>
              <p>• 90-minute virtual or in-person session</p>
              <p>• Detailed results report included</p>
              <p>• Follow-up resources and tools</p>
              <p>• 30-day check-in included</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right - Form */}
      <div className="lg:col-span-3">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 lg:p-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary">Request Your Team Debrief</h2>
              <p className="text-slate-500 text-sm">We'll respond within 24 hours</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="full_name" className="block text-slate-700 font-medium mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                    placeholder="John Smith"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-slate-700 font-medium mb-1.5">
                  Email Address *
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
                    placeholder="john@company.com"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="company" className="block text-slate-700 font-medium mb-1.5">
                  Company/Organization *
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="company"
                    name="company"
                    type="text"
                    value={formData.company}
                    onChange={handleChange}
                    required
                    placeholder="Acme Inc."
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="role" className="block text-slate-700 font-medium mb-1.5">
                  Your Role *
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="role"
                    name="role"
                    type="text"
                    value={formData.role}
                    onChange={handleChange}
                    required
                    placeholder="Director of Operations"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="phone" className="block text-slate-700 font-medium mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 123-4567"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="team_size" className="block text-slate-700 font-medium mb-1.5">
                  Team Size
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="team_size"
                    name="team_size"
                    type="text"
                    value={formData.team_size}
                    onChange={handleChange}
                    placeholder="e.g., 15 people"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="message" className="block text-slate-700 font-medium mb-1.5">
                Tell us about your team
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="What are your team's biggest challenges? What would success look like after this debrief?"
                  rows={4}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary-dark text-white py-6 rounded-xl font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Calendar className="w-5 h-5" />
                  Request Team Debrief
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6">
            Your information is secure and will never be shared.
          </p>
        </div>
      </div>
    </div>
  );
}

