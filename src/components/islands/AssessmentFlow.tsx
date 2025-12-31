import { useState, useEffect, useRef } from 'react';
import { supabaseClient } from '../../lib/supabase';
import { buildUrl, createPageUrl } from '../../lib/utils';
import { ArrowLeft, ArrowRight, Loader2, CheckCircle, Calendar } from 'lucide-react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { validateEmail, validatePhone } from '../../lib/validation';
import { getUserDetails, saveUserDetails } from '../../lib/userStorage';
import { 
  getAssessmentData, 
  saveAssessmentData 
} from '../../lib/assessmentStorage';

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
  const [contactData, setContactData] = useState({
    full_name: '',
    email: '',
    company: '',
    role: '',
    phone: '',
  });
  
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    phone?: string;
  }>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdLeadId, setCreatedLeadId] = useState<string | null>(leadId || null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha>(null);
  
  // Initialize states to prevent hydration mismatch - updated in useEffect
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [submittedResponseId, setSubmittedResponseId] = useState<string | null>(null);
  const [hasScheduledCall, setHasScheduledCall] = useState(false);
  const [hasStoredUserDetails, setHasStoredUserDetails] = useState(false);

  // Read from localStorage after hydration to prevent SSR mismatch
  useEffect(() => {
    // Check submission status
    const assessmentData = getAssessmentData();
    
    if (assessmentData.submittedEmail) {
      setAlreadySubmitted(true);
      setSubmittedEmail(assessmentData.submittedEmail);
      setSubmittedResponseId(assessmentData.responseId || null);
    }
    setHasScheduledCall(!!assessmentData.callScheduled);

    // Load user details for form prepopulation
    const stored = getUserDetails();
    if (stored.full_name && stored.email) {
      setContactData({
        full_name: stored.full_name,
        email: stored.email,
        company: stored.company || '',
        role: stored.role || '',
        phone: stored.phone || '',
      });
      // If we have a stored leadId, use it
      if (stored.leadId) {
        setCreatedLeadId(stored.leadId);
      }
      // If we have both name and email, skip contact form
      setHasStoredUserDetails(true);
    }
  }, []);

  // Additional useEffect for URL params - must be before any returns
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('leadId');
    if (id) {
      // Lead ID provided, skip contact form
    }
  }, []);

  const currentQuestion = questions[currentIndex];
  // Skip contact form if we have stored user details or a leadId was provided
  const needsContactInfo = !leadId && !hasStoredUserDetails && currentIndex === 0;

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
            <p className="text-slate-500 text-sm mb-6">
              Submitted with: <span className="font-medium">{submittedEmail}</span>
            </p>
          )}

          {/* View Results Button */}
          {submittedResponseId && (
            <div className="mb-8">
              <a
                href={`${buildUrl('/practice/results')}?id=${submittedResponseId}`}
                className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-white rounded-xl font-semibold hover:bg-accent/90 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                View My Results
              </a>
            </div>
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

  const handleNext = async () => {
    if (needsContactInfo) {
      // Clear any previous errors
      setErrorMessage(null);
      
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

      // Verify captcha before proceeding
      if (captchaConfig?.enabled && !captchaToken) {
        setErrorMessage('Please complete the captcha verification.');
        return;
      }

      // Save user details immediately when starting assessment
      saveUserDetails(contactData);

      // Create lead before starting assessment (skip if we have stored user details with leadId)
      if (!createdLeadId && !hasStoredUserDetails) {
        setIsSubmitting(true);
        try {
          const lead = await supabaseClient.entities.Lead.create({
            ...contactData,
            source: type === 'team' ? 'team_assessment' : 'individual_assessment',
          });
          setCreatedLeadId(lead.id);
          // Store leadId with user details
          saveUserDetails({ ...contactData, leadId: lead.id });
          setErrorMessage(null);
        } catch (createError: any) {
          console.error('Failed to create lead:', createError);
          setIsSubmitting(false);
          
          // Check if error is due to unique constraint violation on email
          if (createError.code === '23505' || 
              createError.message?.includes('duplicate') || 
              createError.message?.includes('unique') ||
              createError.message?.includes('violates unique constraint')) {
            setErrorMessage('An assessment has already been submitted with this email address. Please use a different email or contact support.');
          } else {
            setErrorMessage(createError.message || 'Failed to start assessment. Please try again.');
          }
          return;
        }
        setIsSubmitting(false);
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
    setErrorMessage('Captcha verification failed. Please try again.');
  };

  const handleSubmit = async () => {
    console.log('handleSubmit called, createdLeadId:', createdLeadId);
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Check localStorage to prevent duplicate submissions from same device
      const assessmentData = getAssessmentData();
      if (assessmentData.submittedEmail) {
        console.log('Assessment already submitted with email:', assessmentData.submittedEmail);
        setAlreadySubmitted(true);
        setSubmittedEmail(assessmentData.submittedEmail);
        return;
      }

      // If captcha is enabled, ensure we have a token
      if (captchaConfig?.enabled && !captchaToken) {
        setErrorMessage('Please complete the captcha verification before submitting.');
        return;
      }

      const { leapScores, habitScore, abilityScore, talentScore, skillScore } = calculateScores();
      console.log('Calculated scores:', { leapScores, habitScore, abilityScore, talentScore, skillScore });

      const answersArray = Object.entries(answers).map(([qId, score]) => {
        const question = questions.find((q) => q.questionId === qId);
        return {
          question_id: qId,
          category: question?.category,
          score,
          question_text: question?.text,
        };
      });
      console.log('Answers array length:', answersArray.length);

      let response;

      // Use Edge Function if captcha is enabled, otherwise use direct insert
      if (captchaConfig?.enabled && captchaToken) {
        console.log('Submitting via Edge Function with captcha');
        response = await supabaseClient.submitAssessmentWithCaptcha({
          contactData: {
            ...contactData,
            source: type === 'team' ? 'team_assessment' : 'individual_assessment',
          },
          leadId: createdLeadId || undefined,
          assessmentType: type,
          scores: leapScores,
          habitScore,
          abilityScore,
          talentScore,
          skillScore,
          answers: answersArray,
          captchaToken,
        });
        console.log('Edge Function response:', response);
      } else {
        // Direct insert (no captcha or captcha disabled)
        let finalLeadId = createdLeadId;
        console.log('Direct insert, initial finalLeadId:', finalLeadId);

        // Create lead if not already created (e.g., when using stored user details)
        if (!finalLeadId) {
          console.log('Creating lead for direct insert...');
          const lead = await supabaseClient.entities.Lead.create({
            ...contactData,
            source: type === 'team' ? 'team_assessment' : 'individual_assessment',
          });
          finalLeadId = lead.id;
          // Store leadId for future use
          saveUserDetails({ leadId: lead.id });
          console.log('Lead created:', finalLeadId);
        }

        console.log('Creating assessment response...');
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
        console.log('Assessment response created:', response);
      }

      // Verify response has an ID
      if (!response || !response.id) {
        throw new Error('Failed to create assessment response - no ID returned');
      }

      // Store submission data in localStorage
      if (contactData.email) {
        saveAssessmentData({
          submittedEmail: contactData.email,
          responseId: response.id,
          submittedAt: new Date().toISOString(),
        });
      }

      // Reset captcha for next submission
      if (captchaRef.current) {
        captchaRef.current.resetCaptcha();
        setCaptchaToken(null);
      }

      // Redirect to results page
      const resultsUrl = `${buildUrl('/practice/results')}?id=${response.id}`;
      console.log('Redirecting to:', resultsUrl);
      window.location.href = resultsUrl;
    } catch (error: any) {
      console.error('Failed to submit assessment:', error);
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        fullError: error
      });
      
      // Try to extract detailed error message from response
      let errorMsg = 'Failed to submit assessment. Please try again.';
      
      if (error?.message) {
        errorMsg = error.message;
      } else if (error?.error) {
        errorMsg = error.error;
        if (error.details && Array.isArray(error.details)) {
          errorMsg += ` (${error.details.join(', ')})`;
        }
        if (error.message) {
          errorMsg += `: ${error.message}`;
        }
      }
      
      setErrorMessage(errorMsg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Reset captcha on error
      if (captchaRef.current) {
        captchaRef.current.resetCaptcha();
        setCaptchaToken(null);
      }
    } finally {
      // Ensure spinner always stops
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

          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm text-red-800 font-medium">{errorMessage}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                  aria-label="Dismiss error"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          )}

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

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-sm text-red-800 font-medium">{errorMessage}</p>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-red-600 hover:text-red-800 transition-colors"
                aria-label="Dismiss error"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

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


