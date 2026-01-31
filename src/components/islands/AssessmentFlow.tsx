import { useState, useEffect, useRef } from 'react';
import { supabaseClient } from '../../lib/supabase';
import { buildUrl, createPageUrl } from '../../lib/utils';
import { ArrowLeft, ArrowRight, Loader2, CheckCircle, Calendar, User } from 'lucide-react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { validateEmail, validatePhone } from '../../lib/validation';
import { getUserDetails, saveUserDetails, clearUserDetails, syncUserDetailsFromSupabase } from '../../lib/userStorage';
import { 
  getAssessmentData, 
  saveAssessmentData,
  clearAssessmentData
} from '../../lib/assessmentStorage';
import { calculateAllScores, type Answer as AnswerData } from '../../lib/assessmentScoring';

export interface RatingOption {
  label: string;
  points: number;
}

export interface AssessmentQuestion {
  _id: string;
  category: 'habit' | 'ability' | 'talent' | 'skill';
  text: string;
  ratingOptions: RatingOption[];
}

export interface CaptchaConfig {
  enabled: boolean;
  siteKey?: string;
}

interface AssessmentFlowProps {
  type: 'individual' | 'team';
  questions: AssessmentQuestion[];
  captchaConfig?: CaptchaConfig;
}

export default function AssessmentFlow({ type, questions, captchaConfig }: AssessmentFlowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { points: number; optionIndex: number }>>({});
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
  const [rateLimitCountdown, setRateLimitCountdown] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  // Removed magicLinkSent - no longer sending magic links during contact form
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha>(null);
  
  // Initialize states to prevent hydration mismatch - updated in useEffect
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [submittedResponseId, setSubmittedResponseId] = useState<string | null>(null);
  const [hasScheduledCall, setHasScheduledCall] = useState(false);
  const [hasStoredUserDetails, setHasStoredUserDetails] = useState(false);
  const [contactFormCompleted, setContactFormCompleted] = useState(false);
  const [isCheckingAssessment, setIsCheckingAssessment] = useState(true);

  // Check authentication status and existing assessment
  useEffect(() => {
    let isMounted = true;
    
    const checkAuthAndAssessment = async () => {
      try {
        // Add timeout for auth check
        const sessionPromise = supabaseClient.supabase.auth.getSession();
        const timeoutPromise = new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('Auth check timeout')), 5000)
        );
        
        const result = await Promise.race([sessionPromise, timeoutPromise]);
        if (!result || !('data' in result)) {
          throw new Error('Auth check failed');
        }
        
        const session = result.data.session;
        if (!isMounted) return;
        
        if (session?.user) {
          setIsAuthenticated(true);
          setUserId(session.user.id);
          setUserEmail(session.user.email || null);

          // Sync user details from Supabase to localStorage (non-blocking)
          syncUserDetailsFromSupabase().catch(() => {});

          // If authenticated, always skip the contact form
          const syncedDetails = getUserDetails();
          // Pre-populate contact data if available, but always skip form when authenticated
          if (syncedDetails.full_name || syncedDetails.email) {
            setContactData({
              full_name: syncedDetails.full_name || '',
              email: syncedDetails.email || session.user.email || '',
              company: syncedDetails.company || '',
              role: syncedDetails.role || '',
              phone: syncedDetails.phone || '',
            });
          } else if (session.user.email) {
            // Fallback to email from session if no stored details
            setContactData({
              full_name: session.user.user_metadata?.full_name || '',
              email: session.user.email,
              company: session.user.user_metadata?.company || '',
              role: session.user.user_metadata?.role || '',
              phone: '',
            });
          }
          // Always skip form when authenticated
          setHasStoredUserDetails(true);
          setContactFormCompleted(true);

          // Check if user already has an assessment (with timeout)
          try {
            const assessmentPromise = supabaseClient.supabase
              .from('assessment_responses')
              .select('id')
              .eq('user_id', session.user.id)
              .eq('assessment_type', type)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
            
            const assessmentTimeout = new Promise<null>((_, reject) => 
              setTimeout(() => reject(new Error('Assessment check timeout')), 5000)
            );
            
            const assessmentResult = await Promise.race([assessmentPromise, assessmentTimeout]);
            
            if (!isMounted) return;
            
            if (assessmentResult && 'data' in assessmentResult && !assessmentResult.error && assessmentResult.data) {
              const existingAssessment = assessmentResult.data;
              // Save assessment ID to localStorage since it belongs to this user
              saveAssessmentData({ responseId: existingAssessment.id });
              
              // User already has an assessment, redirect to results
              const resultsPath = buildUrl(`/practice/results?id=${existingAssessment.id}`);
              const resultsUrl = typeof window !== 'undefined' 
                ? `${window.location.origin}${resultsPath}`
                : resultsPath;
              window.location.href = resultsUrl;
              return;
            }
          } catch (assessmentError) {
            // No existing assessment or timeout - continue to show assessment form
            console.log('No existing assessment found or check timed out');
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // On error, allow user to proceed as unauthenticated
      } finally {
        if (isMounted) {
          setIsCheckingAssessment(false);
        }
      }
    };
    
    checkAuthAndAssessment();
    
    // Fallback timeout - never stay in loading state forever
    const fallbackTimeout = setTimeout(() => {
      if (isMounted) {
        console.warn('Assessment check fallback timeout reached');
        setIsCheckingAssessment(false);
      }
    }, 8000);
    
    return () => {
      isMounted = false;
      clearTimeout(fallbackTimeout);
    };
  }, [type]);

  // Countdown timer for rate limit
  useEffect(() => {
    if (rateLimitCountdown === null || rateLimitCountdown <= 0) {
      if (rateLimitCountdown === 0) {
        setRateLimitCountdown(null);
        setErrorMessage(null);
      }
      return;
    }

    const timer = setTimeout(() => {
      setRateLimitCountdown(rateLimitCountdown - 1);
      if (rateLimitCountdown > 1) {
        setErrorMessage(`Too many requests. Please try again in ${rateLimitCountdown - 1} seconds.`);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [rateLimitCountdown]);

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
      // If we have both name and email, skip contact form
      setHasStoredUserDetails(true);
    }
  }, []);

  // Show contact form if:
  // - We're on the first step (currentIndex === 0) AND
  // - User is NOT authenticated AND
  // - Contact form has not been completed this session AND
  // - Either: no stored user details OR captcha is enabled (captcha must be re-verified every time)
  // Note: If user is authenticated, always skip the form (they've already provided their info)
  const needsContactInfo = currentIndex === 0 && !isAuthenticated && !contactFormCompleted && (!hasStoredUserDetails || captchaConfig?.enabled);
  
  // Track previous needsContactInfo to detect transition
  const prevNeedsContactInfoRef = useRef(needsContactInfo);
  
  // Scroll to top when transitioning from contact form to questions
  useEffect(() => {
    const wasShowingContactForm = prevNeedsContactInfoRef.current;
    const isShowingQuestions = !needsContactInfo;
    
    // If we just transitioned from contact form to questions, scroll to top
    if (wasShowingContactForm && isShowingQuestions && questions.length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    // Update ref for next render
    prevNeedsContactInfoRef.current = needsContactInfo;
  }, [needsContactInfo, questions.length]);
  
  // Only access currentQuestion when we're actually showing questions (not contact form)
  // currentIndex starts at 0, so the first question will be shown when transitioning from contact form
  const currentQuestion = !needsContactInfo && questions.length > 0 && currentIndex >= 0 && currentIndex < questions.length
    ? questions[currentIndex]
    : undefined;

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

  const handleAnswer = (optionIndex: number, points: number) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion._id]: { points, optionIndex },
    }));
    
    // Auto-advance to next question after a brief delay for visual feedback
    // On the last question, don't auto-advance - let user manually submit
    if (currentIndex < questions.length - 1) {
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 300);
    }
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

      // Save user details and allow them to proceed with assessment
      // Authentication will be handled on submission
      const userDetailsToSave = {
        ...contactData,
        isNewUser: true, // Mark as new user - will be handled on submission
        pendingAssessmentType: type,
      };
      saveUserDetails(userDetailsToSave);
      setHasStoredUserDetails(true);
      setContactFormCompleted(true);
      setCurrentIndex(0);
      setIsCheckingAssessment(false);
      setIsSubmitting(false);
      return; // Continue to assessment questions
    }

    // Only increment if we're moving between questions (not from contact form)
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
    // Convert answers to format expected by scoring utility
    const answerData: AnswerData[] = Object.entries(answers).map(([questionId, answer]) => {
      const question = questions.find((q) => q._id === questionId);
      return {
        questionId,
        category: question?.category || 'habit',
        points: answer.points,
      };
    });

    const { categoryScores, leapScores } = calculateAllScores(answerData);

    return {
      leapScores,
      habitScore: categoryScores.habit,
      abilityScore: categoryScores.ability,
      talentScore: categoryScores.talent,
      skillScore: categoryScores.skill,
    };
  };

  const handleCaptchaVerify = (token: string) => {
    setCaptchaToken(token);
  };

  const handleCaptchaError = () => {
    setCaptchaToken(null);
    setErrorMessage('Captcha verification failed. Please try again.');
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Check localStorage to prevent duplicate submissions from same device
      const assessmentData = getAssessmentData();
      if (assessmentData.submittedEmail) {
        setAlreadySubmitted(true);
        setSubmittedEmail(assessmentData.submittedEmail);
        return;
      }

      // Get user details from localStorage
      const userDetails = getUserDetails();
      const isNewUser = userDetails.isNewUser === true;

      // If captcha is enabled and user is NOT authenticated, ensure we have a token
      if (captchaConfig?.enabled && !captchaToken && !isAuthenticated) {
        setErrorMessage('Please complete the captcha verification before submitting.');
        return;
      }

      // Note: Authentication is not required before submission
      // The Edge Function will handle user creation/lookup automatically
      // Users can complete the assessment without logging in first

      const { leapScores, habitScore, abilityScore, talentScore, skillScore } = calculateScores();

      const answersArray = Object.entries(answers).map(([questionId, answer]) => {
        const question = questions.find((q) => q._id === questionId);
        const responseLabel = question?.ratingOptions?.[answer.optionIndex]?.label;
        return {
          question_id: questionId,
          category: question?.category,
          score: answer.points,
          question_text: question?.text,
          response_label: responseLabel,
        };
      });

      // Always use Edge Function for submission
      // It handles user creation, authentication, and captcha verification
      // This allows users to submit without logging in first
      const response = await supabaseClient.submitAssessmentWithCaptcha({
        contactData: {
          ...contactData,
          source: type === 'team' ? 'team_assessment' : 'individual_assessment',
        },
        userId: userId || undefined, // Pass authenticated user ID if available (optional)
        assessmentType: type,
        scores: leapScores,
        habitScore,
        abilityScore,
        talentScore,
        skillScore,
        answers: answersArray,
        captchaToken: captchaToken || '', // Required for unauthenticated users, optional for authenticated
      });

      // Verify response has an ID
      if (!response || !response.id) {
        throw new Error('Failed to create assessment response - no ID returned');
      }

      // Store submission data in localStorage
      if (contactData.email) {
        const assessmentDataToSave = {
          submittedEmail: contactData.email,
          responseId: response.id,
          submittedAt: new Date().toISOString(),
        };
        saveAssessmentData(assessmentDataToSave);
      }

      // No confirmation email needed - email is auto-confirmed
      // Users will get a magic link when they log in next time

      // Reset captcha for next submission
      if (captchaRef.current) {
        captchaRef.current.resetCaptcha();
        setCaptchaToken(null);
      }

      // Redirect to results page
      const resultsPath = `${buildUrl('/practice/results')}?id=${response.id}`;
      const resultsUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}${resultsPath}`
        : resultsPath;
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

  const colors = currentQuestion?.category 
    ? (categoryColors[currentQuestion.category] || categoryColors.habit)
    : categoryColors.habit;
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

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
                  <p className="text-sm text-red-800 font-medium">
                    {errorMessage}
                    {rateLimitCountdown !== null && rateLimitCountdown > 0 && (
                      <span className="ml-2 font-semibold">(Try again in {rateLimitCountdown} seconds)</span>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setRateLimitCountdown(null);
                  }}
                  className="text-red-600 hover:text-red-800 transition-colors"
                  aria-label="Dismiss error"
                  disabled={rateLimitCountdown !== null && rateLimitCountdown > 0}
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
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary-dark text-white py-6 rounded-xl font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  Continue to Assessment
                  <ArrowRight className="w-5 h-5 ml-2 inline" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Safety check: ensure we have a valid question before rendering
  if (!currentQuestion) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 lg:p-10 text-center">
          <h2 className="text-2xl font-bold text-primary mb-4">Assessment Unavailable</h2>
          <p className="text-slate-500">
            Unable to load assessment questions. Please try refreshing the page.
          </p>
        </div>
      </div>
    );
  }

  // Show loading state while checking for existing assessment
  if (isCheckingAssessment) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 lg:p-10 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 lg:p-10">
        {/* Auth Status Banner */}
        {isAuthenticated && userId && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                <p className="text-sm text-blue-800">
                  Logged in as <strong>{contactData.email || userEmail || 'user'}</strong>
                </p>
              </div>
              <button
                onClick={async () => {
                  // Clear localStorage
                  clearUserDetails();
                  clearAssessmentData();
                  // Sign out
                  await supabaseClient.supabase.auth.signOut();
                  // Reload page to reset state
                  window.location.reload();
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

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
                <p className="text-sm text-red-800 font-medium">
                  {errorMessage}
                  {rateLimitCountdown !== null && rateLimitCountdown > 0 && (
                    <span className="ml-2 font-semibold">(Try again in {rateLimitCountdown} seconds)</span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setRateLimitCountdown(null);
                }}
                className="text-red-600 hover:text-red-800 transition-colors"
                aria-label="Dismiss error"
                disabled={rateLimitCountdown !== null && rateLimitCountdown > 0}
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
          {currentQuestion.ratingOptions.map((option, index) => {
            const isSelected = answers[currentQuestion._id]?.optionIndex === index;
            return (
              <button
                key={index}
                onClick={() => handleAnswer(index, option.points)}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center justify-between group ${
                  isSelected
                    ? `${colors.border} ${colors.bg}`
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                      isSelected
                        ? `${colors.bg} ${colors.text}`
                        : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span
                    className={`font-medium ${
                      isSelected ? 'text-primary' : 'text-slate-600'
                    }`}
                  >
                    {option.label}
                  </span>
                </div>
                {isSelected && (
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
            );
          })}
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

          {currentIndex === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={!answers[currentQuestion._id] || isSubmitting}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Assessment
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          ) : (
            <span className="text-sm text-slate-400">
              Select an answer to continue
            </span>
          )}
        </div>
      </div>
    </div>
  );
}


