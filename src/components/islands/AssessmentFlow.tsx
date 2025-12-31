import { useState, useEffect, useRef } from 'react';
import { supabaseClient } from '../../lib/supabase';
import { buildUrl, createPageUrl } from '../../lib/utils';
import { ArrowLeft, ArrowRight, Loader2, CheckCircle, Calendar } from 'lucide-react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { validateEmail, validatePhone } from '../../lib/validation';
import { getUserDetails, saveUserDetails } from '../../lib/userStorage';

const defaultRatingLabels: Record<number, string> = {
  1: 'Strongly Disagree',
  2: 'Disagree',
  3: 'Neutral',
  4: 'Agree',
  5: 'Strongly Agree'
};

export interface AssessmentQuestion {
  questionId: string;
  category: 'habit' | 'ability' | 'talent' | 'skill';
  text: string;
}

export interface RatingLabels {
  rating1: string;
  rating2: string;
  rating3: string;
  rating4: string;
  rating5: string;
}

export interface CaptchaConfig {
  enabled: boolean;
  siteKey?: string;
}

interface AssessmentFlowProps {
  type: 'individual' | 'team';
  questions: AssessmentQuestion[];
  ratingLabels?: RatingLabels;
  captchaConfig?: CaptchaConfig;
  leadId?: string;
}

export default function AssessmentFlow({ type, questions, ratingLabels, captchaConfig, leadId }: AssessmentFlowProps) {
  const labels: Record<number, string> = ratingLabels
    ? {
        1: ratingLabels.rating1,
        2: ratingLabels.rating2,
        3: ratingLabels.rating3,
        4: ratingLabels.rating4,
        5: ratingLabels.rating5,
      }
    : defaultRatingLabels;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Initialize contact data from localStorage
  const [contactData, setContactData] = useState(() => {
    const stored = getUserDetails();
    return {
      full_name: stored.full_name || '',
      email: stored.email || '',
      company: stored.company || '',
      role: stored.role || '',
      phone: stored.phone || '',
    };
  });
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    phone?: string;
  }>({});
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha>(null);
  
  // Initialize from localStorage synchronously
  const getStoredEmail = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('assessment_submitted_email');
    }
    return null;
  };
  
  const getCallScheduled = () => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('call_scheduled');
    }
    return false;
  };
  
  const [alreadySubmitted, setAlreadySubmitted] = useState(() => !!getStoredEmail());
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(() => getStoredEmail());
  const [hasScheduledCall, setHasScheduledCall] = useState(() => getCallScheduled());

  const currentQuestion = questions[currentIndex];
  const needsContactInfo = !leadId && currentIndex === 0;

  // Show error if no questions are configured
  if (questions.length === 0) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 lg:p-10 text-center">
          <h2 className="text-2xl font-bold text-primary mb-4">Assessment Unavailable</h2>
          <p className="text-slate-500">
            No questions have been configured for this assessment yet. Please check back later.
          </p>
        </div>
      </div>
    );
  }

  // Show already submitted UI
  if (alreadySubmitted) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 lg:p-10 text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-primary mb-4">Assessment Already Submitted</h2>
          <p className="text-slate-600 mb-2">
            You have already submitted an assessment.
          </p>
          {submittedEmail && (
            <p className="text-slate-500 text-sm mb-8">
              Submitted with: <span className="font-medium">{submittedEmail}</span>
            </p>
          )}
          
          {!hasScheduledCall && (
            <div className="mt-8 pt-8 border-t border-slate-200">
              <p className="text-slate-600 mb-6">
                Ready to discuss your results? Schedule a strategy call with our team.
              </p>
              <a
                href={createPageUrl('ScheduleCall')}
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors"
              >
                <Calendar className="w-5 h-5" />
                Schedule a LEAP Strategy Call
              </a>
            </div>
          )}
          
          {hasScheduledCall && (
            <div className="mt-8 pt-8 border-t border-slate-200">
              <div className="flex items-center justify-center gap-2 text-green-600 mb-4">
                <CheckCircle className="w-5 h-5" />
                <p className="font-medium">Call Already Scheduled</p>
              </div>
              <p className="text-slate-600 text-sm">
                Check your email for confirmation and calendar invite.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('leadId');
    if (id) {
      // Lead ID provided, skip contact form
    }
  }, []);

  const handleAnswer = (rating: number) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.questionId]: rating,
    }));
  };

  const validateContactForm = (): boolean => {
    const errors: { email?: string; phone?: string } = {};

    // Validate email
    const emailValidation = validateEmail(contactData.email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.error;
    }

    // Validate phone (optional field)
    const phoneValidation = validatePhone(contactData.phone);
    if (!phoneValidation.isValid) {
      errors.phone = phoneValidation.error;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEmailBlur = () => {
    const validation = validateEmail(contactData.email);
    if (!validation.isValid) {
      setValidationErrors((prev) => ({ ...prev, email: validation.error }));
    } else {
      setValidationErrors((prev) => {
        const { email, ...rest } = prev;
        return rest;
      });
    }
  };

  const handlePhoneBlur = () => {
    const validation = validatePhone(contactData.phone);
    if (!validation.isValid) {
      setValidationErrors((prev) => ({ ...prev, phone: validation.error }));
    } else {
      setValidationErrors((prev) => {
        const { phone, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleNext = () => {
    if (needsContactInfo) {
      // Validate required fields
      if (!contactData.full_name || !contactData.email) {
        setValidationErrors({
          email: !contactData.email ? 'Email is required' : validationErrors.email,
        });
        return;
      }

      // Validate email and phone formats
      if (!validateContactForm()) {
        return;
      }
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleSubmit();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const calculateScores = () => {
    if (type === 'individual') {
      const habitScore = (answers.h1 || 0) + (answers.h2 || 0);
      const abilityScore = (answers.a1 || 0) + (answers.a2 || 0);
      const talentScore = (answers.t1 || 0) + (answers.t2 || 0);
      const skillScore = (answers.s1 || 0) + (answers.s2 || 0);

      return {
        leapScores: {
          leadership: habitScore + talentScore,
          effectiveness: habitScore + abilityScore,
          accountability: abilityScore + skillScore,
          productivity: habitScore + skillScore,
        },
        habitScore,
        abilityScore,
        talentScore,
        skillScore,
      };
    } else {
      // Team scoring
      const habitScore = (answers.h1 || 0) + (answers.h2 || 0) + (answers.h3 || 0);
      const abilityScore = (answers.a1 || 0) + (answers.a2 || 0) + (answers.a3 || 0);
      const talentScore = (answers.t1 || 0) + (answers.t2 || 0) + (answers.t3 || 0);
      const skillScore = (answers.s1 || 0) + (answers.s2 || 0) + (answers.s3 || 0);

      return {
        leapScores: {
          leadership: habitScore + talentScore,
          effectiveness: habitScore + abilityScore,
          accountability: abilityScore + skillScore,
          productivity: habitScore + skillScore,
        },
        habitScore,
        abilityScore,
        talentScore,
        skillScore,
      };
    }
  };

  const handleCaptchaVerify = (token: string) => {
    setCaptchaToken(token);
  };

  const handleCaptchaError = () => {
    setCaptchaToken(null);
    alert('Captcha verification failed. Please try again.');
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Check localStorage to prevent duplicate submissions from same device
      const storedEmail = localStorage.getItem('assessment_submitted_email');
      if (storedEmail) {
        setAlreadySubmitted(true);
        setSubmittedEmail(storedEmail);
        setIsSubmitting(false);
        return;
      }

      // If captcha is enabled, ensure we have a token
      if (captchaConfig?.enabled && !captchaToken) {
        // Trigger captcha if not already done
        if (captchaRef.current) {
          captchaRef.current.execute();
        }
        setIsSubmitting(false);
        return;
      }

      const { leapScores, habitScore, abilityScore, talentScore, skillScore } = calculateScores();

      const answersArray = Object.entries(answers).map(([qId, score]) => {
        const question = questions.find((q) => q.questionId === qId);
        return {
          question_id: qId,
          category: question?.category,
          score,
          question_text: question?.text,
        };
      });

      let response;

      // Use Edge Function if captcha is enabled, otherwise use direct insert
      if (captchaConfig?.enabled && captchaToken) {
        response = await supabaseClient.submitAssessmentWithCaptcha({
          contactData: {
            ...contactData,
            source: type === 'team' ? 'team_assessment' : 'individual_assessment',
          },
          leadId,
          assessmentType: type,
          scores: leapScores,
          habitScore,
          abilityScore,
          talentScore,
          skillScore,
          answers: answersArray,
          captchaToken,
        });
      } else {
        // Direct insert (no captcha or captcha disabled)
        let finalLeadId = leadId;

        // Create lead if not provided
        if (!finalLeadId) {
          try {
            const lead = await supabaseClient.entities.Lead.create({
              ...contactData,
              source: type === 'team' ? 'team_assessment' : 'individual_assessment',
            });
            finalLeadId = lead.id;
          } catch (createError: any) {
            // Check if error is due to unique constraint violation on email
            if (createError.code === '23505' || 
                createError.message?.includes('duplicate') || 
                createError.message?.includes('unique') ||
                createError.message?.includes('violates unique constraint')) {
              throw new Error('An assessment has already been submitted with this email address. Please use a different email or contact support.');
            }
            throw createError;
          }
        }

        response = await supabaseClient.entities.AssessmentResponse.create({
          lead_id: finalLeadId,
          assessment_type: type,
          scores: leapScores,
          habit_score: habitScore,
          ability_score: abilityScore,
          talent_score: talentScore,
          skill_score: skillScore,
          answers: answersArray,
        });
      }

      // Store submission flag and user details in localStorage
      if (contactData.email) {
        localStorage.setItem('assessment_submitted_email', contactData.email);
        // Save user details for future form prepopulation
        saveUserDetails({
          full_name: contactData.full_name,
          email: contactData.email,
          company: contactData.company,
          role: contactData.role,
          phone: contactData.phone,
        });
      }

      // Reset captcha for next submission
      if (captchaRef.current) {
        captchaRef.current.resetCaptcha();
        setCaptchaToken(null);
      }

      // Redirect to results page
      window.location.href = `${buildUrl('/practice/results')}?id=${response.id}`;
    } catch (error: any) {
      console.error('Failed to submit assessment:', error);
      
      // Try to extract detailed error message from response
      let errorMessage = 'Failed to submit assessment. Please try again.';
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.error) {
        errorMessage = error.error;
        if (error.details && Array.isArray(error.details)) {
          errorMessage += ` (${error.details.join(', ')})`;
        }
        if (error.message) {
          errorMessage += `: ${error.message}`;
        }
      }
      
      alert(errorMessage);
      
      // Reset captcha on error
      if (captchaRef.current) {
        captchaRef.current.resetCaptcha();
        setCaptchaToken(null);
      }
      
      setIsSubmitting(false);
    }
  };

  const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
    habit: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-500' },
    ability: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-500' },
    talent: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-500' },
    skill: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-500' },
  };

  const colors = categoryColors[currentQuestion?.category] || categoryColors.habit;
  const progress = ((currentIndex + 1) / questions.length) * 100;

  if (needsContactInfo) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 lg:p-10">
          <h2 className="text-2xl font-bold text-primary mb-2">Start Your Assessment</h2>
          <p className="text-slate-500 mb-8">Enter your details to access the HATS™ Assessment</p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleNext();
            }}
            className="space-y-5"
          >
            <div>
              <label htmlFor="full_name" className="block text-slate-700 font-medium mb-1.5">
                Full Name *
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                value={contactData.full_name}
                onChange={(e) => setContactData({ ...contactData, full_name: e.target.value })}
                required
                placeholder="John Smith"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-slate-700 font-medium mb-1.5">
                Email Address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={contactData.email}
                onChange={(e) => {
                  setContactData({ ...contactData, email: e.target.value });
                  // Clear error when user starts typing
                  if (validationErrors.email) {
                    setValidationErrors((prev) => {
                      const { email, ...rest } = prev;
                      return rest;
                    });
                  }
                }}
                onBlur={handleEmailBlur}
                required
                placeholder="john@company.com"
                className={`w-full px-4 py-3 rounded-xl border bg-white text-sm focus:ring-2 focus:ring-primary focus:border-primary ${
                  validationErrors.email
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-slate-200'
                }`}
              />
              {validationErrors.email && (
                <p className="mt-1.5 text-sm text-red-600">{validationErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="role" className="block text-slate-700 font-medium mb-1.5">
                Your Role
              </label>
              <input
                id="role"
                name="role"
                type="text"
                value={contactData.role}
                onChange={(e) => setContactData({ ...contactData, role: e.target.value })}
                placeholder="Director of Operations"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="company" className="block text-slate-700 font-medium mb-1.5">
                  Company/Organization
                </label>
                <input
                  id="company"
                  name="company"
                  type="text"
                  value={contactData.company}
                  onChange={(e) => setContactData({ ...contactData, company: e.target.value })}
                  placeholder="Acme Inc."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-slate-700 font-medium mb-1.5">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={contactData.phone}
                  onChange={(e) => {
                    setContactData({ ...contactData, phone: e.target.value });
                    // Clear error when user starts typing
                    if (validationErrors.phone) {
                      setValidationErrors((prev) => {
                        const { phone, ...rest } = prev;
                        return rest;
                      });
                    }
                  }}
                  onBlur={handlePhoneBlur}
                  placeholder="+1 (555) 123-4567"
                  className={`w-full px-4 py-3 rounded-xl border bg-white text-sm focus:ring-2 focus:ring-primary focus:border-primary ${
                    validationErrors.phone
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-slate-200'
                  }`}
                />
                {validationErrors.phone && (
                  <p className="mt-1.5 text-sm text-red-600">{validationErrors.phone}</p>
                )}
              </div>
            </div>

            {captchaConfig?.enabled && captchaConfig.siteKey && (
              <div className="flex justify-center">
                <HCaptcha
                  ref={captchaRef}
                  sitekey={captchaConfig.siteKey}
                  onVerify={handleCaptchaVerify}
                  onError={handleCaptchaError}
                  onExpire={() => setCaptchaToken(null)}
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary-dark text-white py-6 rounded-xl font-semibold text-base"
            >
              Continue to Assessment
              <ArrowRight className="w-5 h-5 ml-2 inline" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 lg:p-10">
        {/* Progress */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm font-medium text-slate-500">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}>
            {currentQuestion.category.charAt(0).toUpperCase() + currentQuestion.category.slice(1)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-slate-100 rounded-full mb-8 overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Question */}
        <h2 className="text-xl lg:text-2xl font-bold text-primary mb-8 leading-relaxed">
          {currentQuestion.text}
        </h2>

        {/* Rating Scale */}
        <div className="space-y-3 mb-8">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              onClick={() => handleAnswer(rating)}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center justify-between group ${
                answers[currentQuestion.questionId] === rating
                  ? `${colors.border} ${colors.bg}`
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                    answers[currentQuestion.questionId] === rating
                      ? `${colors.bg} ${colors.text}`
                      : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                  }`}
                >
                  {rating}
                </div>
                <span
                  className={`font-medium ${
                    answers[currentQuestion.questionId] === rating ? 'text-primary' : 'text-slate-600'
                  }`}
                >
                  {labels[rating]}
                </span>
              </div>
              {answers[currentQuestion.questionId] === rating && (
                <div className={`w-5 h-5 rounded-full ${colors.bg} flex items-center justify-center`}>
                  <svg className={`w-3 h-3 ${colors.text}`} fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Previous
          </button>

          <button
            onClick={handleNext}
            disabled={!answers[currentQuestion.questionId] || isSubmitting}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : currentIndex === questions.length - 1 ? (
              <>
                Submit Assessment
                <ArrowRight className="w-5 h-5" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


