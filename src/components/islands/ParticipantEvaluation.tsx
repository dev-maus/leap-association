import { useState, useEffect, useRef } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { supabaseClient } from '../../lib/supabase';
import { createPageUrl } from '../../lib/utils';
import {
  User,
  Mail,
  Building,
  Briefcase,
  MessageSquare,
  Loader2,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Star,
  ClipboardList,
  Calendar,
  Phone,
  Clock,
  Send,
  AlertCircle,
} from 'lucide-react';

export interface EvaluationCaptchaConfig {
  enabled: boolean;
  siteKey?: string;
}

interface ParticipantEvaluationProps {
  ratingQuestions: string[];
  ratingLabels: readonly string[];
  captchaConfig?: EvaluationCaptchaConfig;
}

interface FormData {
  seminar_title: string;
  seminar_date_location: string;
  presenter_names: string;
  ratings: (number | null)[];
  presenter_comments: string;
  most_impactful: string;
  program_comments: string;
  may_use_comments: string | null;
  contact_for_coaching: boolean;
  name: string;
  email: string;
  organization: string;
  title: string;
  best_times_to_contact: string;
  best_ways_to_contact: string;
}

function emptyRatings(n: number): (number | null)[] {
  return Array.from({ length: n }, () => null);
}

function buildInitialForm(n: number): FormData {
  return {
    seminar_title: '',
    seminar_date_location: '',
    presenter_names: '',
    ratings: emptyRatings(n),
    presenter_comments: '',
    most_impactful: '',
    program_comments: '',
    may_use_comments: null,
    contact_for_coaching: false,
    name: '',
    email: '',
    organization: '',
    title: '',
    best_times_to_contact: '',
    best_ways_to_contact: '',
  };
}

export default function ParticipantEvaluation({
  ratingQuestions,
  ratingLabels,
  captchaConfig,
}: ParticipantEvaluationProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(() => buildInitialForm(ratingQuestions.length));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha>(null);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      ratings: emptyRatings(ratingQuestions.length).map((_, i) => prev.ratings[i] ?? null),
    }));
  }, [ratingQuestions.length]);

  useEffect(() => {
    supabaseClient.supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) setUserId(session.user.id);
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    // Clear validation error for field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleRatingChange = (questionIndex: number, value: number) => {
    setFormData(prev => {
      const newRatings = [...prev.ratings];
      newRatings[questionIndex] = value;
      return { ...prev, ratings: newRatings };
    });
    if (validationErrors.ratings) {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next.ratings;
        return next;
      });
    }
  };

  const validateStep = (currentStep: number): boolean => {
    const errors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.seminar_title.trim()) {
        errors.seminar_title = 'Seminar / Course Title is required.';
      }
      const hasAnyRating = formData.ratings.some((r) => r !== null);
      if (!hasAnyRating) {
        errors.ratings = 'Please provide at least one rating.';
      }
      if (captchaConfig?.enabled && !userId && !captchaToken) {
        errors.captcha = 'Please complete the captcha verification.';
      }
    }

    if (currentStep === 3) {
      if (!formData.name.trim()) {
        errors.name = 'Name is required.';
      }
      if (!formData.email.trim()) {
        errors.email = 'Email is required.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'Please enter a valid email address.';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(3)) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const ratingsObj: Record<string, number | null> = {};
      ratingQuestions.forEach((_q, i) => {
        ratingsObj[`q${i + 1}`] = formData.ratings[i] ?? null;
      });

      await supabaseClient.submitEvaluation({
        captchaToken: captchaToken || '',
        userId: userId || undefined,
        seminar_title: formData.seminar_title.trim(),
        seminar_date_location: formData.seminar_date_location.trim() || null,
        presenter_names: formData.presenter_names.trim() || null,
        ratings: ratingsObj,
        presenter_comments: formData.presenter_comments.trim() || null,
        most_impactful: formData.most_impactful.trim() || null,
        program_comments: formData.program_comments.trim() || null,
        may_use_comments: formData.may_use_comments,
        contact_for_coaching: formData.contact_for_coaching,
        name: formData.name.trim(),
        email: formData.email.trim(),
        organization: formData.organization.trim() || null,
        title: formData.title.trim() || null,
        best_times_to_contact: formData.best_times_to_contact.trim() || null,
        best_ways_to_contact: formData.best_ways_to_contact.trim() || null,
      });

      setIsSubmitted(true);
    } catch (err: unknown) {
      console.error('Failed to submit evaluation:', err);
      const msg = err instanceof Error ? err.message : 'Failed to submit evaluation. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-10 text-center max-w-2xl mx-auto">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-primary mb-4">Thank You for Attending!</h2>
        <p className="text-lg text-slate-600 mb-8">
          Your feedback is invaluable and helps us continue to improve our programs.
          We appreciate you taking the time to complete this evaluation.
        </p>
        <a href={createPageUrl('Home')} className="btn-primary inline-flex items-center gap-2">
          Back to Home
        </a>
      </div>
    );
  }

  const stepIndicator = (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
              s === step
                ? 'bg-primary text-white'
                : s < step
                ? 'bg-green-100 text-green-700'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            {s < step ? <CheckCircle className="w-5 h-5" /> : s}
          </div>
          {s < 3 && (
            <div className={`w-12 h-0.5 ${s < step ? 'bg-green-300' : 'bg-slate-200'}`} />
          )}
        </div>
      ))}
    </div>
  );

  const stepLabels = ['Seminar Info & Ratings', 'Open-Ended Feedback', 'Contact Information'];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 lg:p-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <ClipboardList className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary">Participant Evaluation Form</h2>
            <p className="text-slate-500 text-sm">Step {step} of 3: {stepLabels[step - 1]}</p>
          </div>
        </div>

        {stepIndicator}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Step 1: Seminar Info & Ratings */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Seminar Info Fields */}
              <div>
                <label htmlFor="seminar_title" className="block text-slate-700 font-medium mb-1.5">
                  Seminar / Course Title *
                </label>
                <div className="relative">
                  <ClipboardList className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="seminar_title"
                    name="seminar_title"
                    type="text"
                    value={formData.seminar_title}
                    onChange={handleChange}
                    placeholder="e.g., Leadership Excellence Workshop"
                    className={`w-full pl-11 pr-4 py-3 rounded-xl border bg-white text-sm focus:ring-2 focus:ring-primary focus:border-primary ${
                      validationErrors.seminar_title ? 'border-red-300' : 'border-slate-200'
                    }`}
                  />
                </div>
                {validationErrors.seminar_title && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.seminar_title}</p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="seminar_date_location" className="block text-slate-700 font-medium mb-1.5">
                    Seminar Date / Location
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="seminar_date_location"
                      name="seminar_date_location"
                      type="text"
                      value={formData.seminar_date_location}
                      onChange={handleChange}
                      placeholder="e.g., March 15, 2026 / Dallas, TX"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="presenter_names" className="block text-slate-700 font-medium mb-1.5">
                    Presenter Name(s)
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="presenter_names"
                      name="presenter_names"
                      type="text"
                      value={formData.presenter_names}
                      onChange={handleChange}
                      placeholder="e.g., Dr. Jane Doe"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Rating Scale Legend */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-slate-700">Please Rate the Following</h3>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
                  {ratingLabels.map((label, i) => (
                    <span key={`${i}-${label}`}>{i + 1} = {label}</span>
                  ))}
                </div>
              </div>

              {validationErrors.ratings && (
                <p className="text-red-500 text-xs -mt-2">{validationErrors.ratings}</p>
              )}

              {/* Rating Questions */}
              <div className="space-y-4">
                {ratingQuestions.map((question, qIndex) => (
                  <div key={qIndex} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-sm text-slate-700 font-medium mb-3">
                      {qIndex + 1}. {question}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleRatingChange(qIndex, value)}
                          className={`w-12 h-10 rounded-lg text-sm font-semibold border transition-all ${
                            formData.ratings[qIndex] === value
                              ? 'bg-primary text-white border-primary shadow-sm'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-primary hover:text-primary'
                          }`}
                          title={ratingLabels[value - 1] ?? String(value)}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {captchaConfig?.enabled && captchaConfig.siteKey && !userId && (
                <div className="flex flex-col items-center gap-2">
                  <HCaptcha
                    ref={captchaRef}
                    sitekey={captchaConfig.siteKey}
                    onVerify={(t) => {
                      setCaptchaToken(t);
                      setValidationErrors((prev) => {
                        const next = { ...prev };
                        delete next.captcha;
                        return next;
                      });
                    }}
                    onError={() => {
                      setCaptchaToken(null);
                      setError('Captcha verification failed.');
                    }}
                    onExpire={() => setCaptchaToken(null)}
                  />
                  {validationErrors.captcha && (
                    <p className="text-red-500 text-xs">{validationErrors.captcha}</p>
                  )}
                </div>
              )}

              {/* Presenter Comments */}
              <div>
                <label htmlFor="presenter_comments" className="block text-slate-700 font-medium mb-1.5">
                  Comment on Presenter(s)
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <textarea
                    id="presenter_comments"
                    name="presenter_comments"
                    value={formData.presenter_comments}
                    onChange={handleChange}
                    placeholder="Share any feedback about the presenter(s)..."
                    rows={3}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                  />
                </div>
              </div>

              {/* Next Button */}
              <button
                type="button"
                onClick={handleNext}
                className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-colors"
              >
                Continue to Feedback
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Step 2: Open-Ended Feedback */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label htmlFor="most_impactful" className="block text-slate-700 font-medium mb-1.5">
                  What was the most impactful portion of the course/seminar and how do you plan to use the insights/skills learned?
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <textarea
                    id="most_impactful"
                    name="most_impactful"
                    value={formData.most_impactful}
                    onChange={handleChange}
                    placeholder="Share what resonated with you most and how you plan to apply it..."
                    rows={5}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="program_comments" className="block text-slate-700 font-medium mb-1.5">
                  Comments on the program and/or suggestions for improvement
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <textarea
                    id="program_comments"
                    name="program_comments"
                    value={formData.program_comments}
                    onChange={handleChange}
                    placeholder="Any suggestions or additional comments..."
                    rows={5}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                  />
                </div>
              </div>

              {/* Permission to use comments */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <p className="text-sm text-slate-700 font-medium mb-3">
                  May we use your comments within future programs or marketing?
                </p>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="may_use_comments"
                      value="yes"
                      checked={formData.may_use_comments === 'yes'}
                      onChange={handleChange}
                      className="w-4 h-4 text-primary focus:ring-primary border-slate-300"
                    />
                    <span className="text-sm text-slate-700">Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="may_use_comments"
                      value="no"
                      checked={formData.may_use_comments === 'no'}
                      onChange={handleChange}
                      className="w-4 h-4 text-primary focus:ring-primary border-slate-300"
                    />
                    <span className="text-sm text-slate-700">No</span>
                  </label>
                </div>
              </div>

              {/* Coaching consultation */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="contact_for_coaching"
                    checked={formData.contact_for_coaching}
                    onChange={handleChange}
                    className="w-4 h-4 mt-0.5 text-primary focus:ring-primary border-slate-300 rounded"
                  />
                  <span className="text-sm text-slate-700">
                    Please contact me concerning personal coaching and a complimentary consultation.
                  </span>
                </label>
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-4 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 bg-primary hover:bg-primary-dark text-white py-4 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-colors"
                >
                  Continue to Contact Info
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Contact Information */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="name" className="block text-slate-700 font-medium mb-1.5">
                    Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Smith"
                      className={`w-full pl-11 pr-4 py-3 rounded-xl border bg-white text-sm focus:ring-2 focus:ring-primary focus:border-primary ${
                        validationErrors.name ? 'border-red-300' : 'border-slate-200'
                      }`}
                    />
                  </div>
                  {validationErrors.name && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.name}</p>
                  )}
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
                      placeholder="john@company.com"
                      className={`w-full pl-11 pr-4 py-3 rounded-xl border bg-white text-sm focus:ring-2 focus:ring-primary focus:border-primary ${
                        validationErrors.email ? 'border-red-300' : 'border-slate-200'
                      }`}
                    />
                  </div>
                  {validationErrors.email && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="organization" className="block text-slate-700 font-medium mb-1.5">
                    Organization
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="organization"
                      name="organization"
                      type="text"
                      value={formData.organization}
                      onChange={handleChange}
                      placeholder="Acme Inc."
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="title" className="block text-slate-700 font-medium mb-1.5">
                    Title
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="title"
                      name="title"
                      type="text"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="Director of Operations"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="best_times_to_contact" className="block text-slate-700 font-medium mb-1.5">
                    Best Time(s) to Contact
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="best_times_to_contact"
                      name="best_times_to_contact"
                      type="text"
                      value={formData.best_times_to_contact}
                      onChange={handleChange}
                      placeholder="e.g., Mornings, 9-11 AM"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="best_ways_to_contact" className="block text-slate-700 font-medium mb-1.5">
                    Best Way(s) to Contact
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="best_ways_to_contact"
                      name="best_ways_to_contact"
                      type="text"
                      value={formData.best_ways_to_contact}
                      onChange={handleChange}
                      placeholder="e.g., Email, Phone"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-4 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-primary hover:bg-primary-dark text-white py-4 rounded-xl font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit Evaluation
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          Your information is secure and will never be shared.
        </p>
      </div>
    </div>
  );
}
