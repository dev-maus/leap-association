import { useState, useEffect, useRef, useMemo } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  BarChart3,
  Target,
  Users,
  Shield,
  HeartHandshake,
  AlertTriangle,
  TrendingUp,
  Award,
  Lightbulb,
  Calendar,
  Compass,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { createPageUrl, buildUrl } from '../../lib/utils';
import { supabaseClient } from '../../lib/supabase';
import { validateEmail, validatePhone } from '../../lib/validation';
import { getUserDetails, saveUserDetails, syncUserDetailsFromSupabase } from '../../lib/userStorage';
import {
  getAssessmentData as getStoredAssessment,
  saveAssessmentData as saveStoredAssessment,
} from '../../lib/assessmentStorage';

export interface CaptchaConfig {
  enabled: boolean;
  siteKey?: string;
}

/** Serializable section payload from Astro / Sanity */
export interface ScorecardSectionProp {
  title: string;
  key: string;
  questions: string[];
}

type SectionColor = {
  bg: string;
  text: string;
  border: string;
  light: string;
  ring: string;
};

type RuntimeSection = {
  title: string;
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  color: SectionColor;
  questions: string[];
};

const ICON_BY_KEY: Record<string, React.ComponentType<{ className?: string }>> = {
  'role-clarity': Target,
  'leadership-expectations': Users,
  'performance-measurement': BarChart3,
  'support-resources': HeartHandshake,
};

const COLOR_BY_KEY: Record<string, SectionColor> = {
  'role-clarity': {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-500',
    light: 'bg-blue-50',
    ring: 'ring-blue-500',
  },
  'leadership-expectations': {
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    border: 'border-emerald-500',
    light: 'bg-emerald-50',
    ring: 'ring-emerald-500',
  },
  'performance-measurement': {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-500',
    light: 'bg-purple-50',
    ring: 'ring-purple-500',
  },
  'support-resources': {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-500',
    light: 'bg-amber-50',
    ring: 'ring-amber-500',
  },
};

const DEFAULT_COLOR: SectionColor = {
  bg: 'bg-slate-100',
  text: 'text-slate-700',
  border: 'border-slate-500',
  light: 'bg-slate-50',
  ring: 'ring-slate-500',
};

function toRuntimeSections(props: ScorecardSectionProp[]): RuntimeSection[] {
  return props.map((s) => ({
    title: s.title,
    key: s.key,
    icon: ICON_BY_KEY[s.key] ?? Target,
    color: COLOR_BY_KEY[s.key] ?? DEFAULT_COLOR,
    questions: s.questions,
  }));
}

const RATING_OPTIONS = [
  { value: 1, label: 'Strongly Disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'Agree' },
  { value: 5, label: 'Strongly Agree' },
];

interface ResultCategory {
  headline: string;
  subtitle: string;
  indicators: string[];
  nextSteps: string[];
  badgeColor: string;
  iconColor: string;
}

function getResultCategory(score: number): ResultCategory {
  if (score >= 85) {
    return {
      headline: 'Leadership Role is Well Designed',
      subtitle: 'Strong Role Design',
      indicators: [
        'Strong leadership accountability',
        'Clear performance expectations',
        'Higher leadership confidence',
        'Stronger team alignment',
      ],
      nextSteps: [
        'Leadership development programs',
        'Executive coaching',
        'Strategic leadership alignment sessions',
      ],
      badgeColor: 'bg-green-100 text-green-700 border-green-200',
      iconColor: 'text-green-600',
    };
  }
  if (score >= 70) {
    return {
      headline: 'Leadership Role is Solid but Could Be Stronger',
      subtitle: 'Opportunity for Optimization',
      indicators: [
        'Occasional leadership confusion',
        'Inconsistent accountability',
        'Unclear decision authority',
      ],
      nextSteps: [
        'Review lowest scoring sections',
        'Clarify expected outcomes and leadership authority',
        'Strengthen performance measurement systems',
      ],
      badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
      iconColor: 'text-blue-600',
    };
  }
  if (score >= 50) {
    return {
      headline: 'Leadership Role Needs Clarification',
      subtitle: 'Structural Improvement Needed',
      indicators: [
        'Leaders unsure of priorities',
        'Confusion about accountability',
        'Difficulty measuring success',
        'Leadership frustration',
      ],
      nextSteps: [
        'Redesign role structure for core responsibilities',
        'Define clear performance expectations',
        'Establish decision authority boundaries',
        'Create measurable success metrics',
      ],
      badgeColor: 'bg-amber-100 text-amber-700 border-amber-200',
      iconColor: 'text-amber-600',
    };
  }
  return {
    headline: 'Leadership Role Design is Likely Limiting Success',
    subtitle: 'High Risk Role Design',
    indicators: [
      'Constant role confusion',
      'Limited authority',
      'Poor accountability systems',
      'Leadership turnover and frustration',
    ],
    nextSteps: [
      'Structured leadership role redesign focusing on role clarity',
      'Redefine leadership expectations',
      'Implement performance measurement systems',
      'Build organizational support systems',
    ],
    badgeColor: 'bg-red-100 text-red-700 border-red-200',
    iconColor: 'text-red-600',
  };
}

interface LeadershipScorecardProps {
  sections: ScorecardSectionProp[];
  captchaConfig?: CaptchaConfig;
}

export default function LeadershipScorecard({ sections: sectionsProp, captchaConfig }: LeadershipScorecardProps) {
  const SECTIONS = useMemo(() => toRuntimeSections(sectionsProp), [sectionsProp]);
  const totalSections = SECTIONS.length;

  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Record<number, number>>>({});
  const [showResults, setShowResults] = useState(false);
  const [isCheckingAssessment, setIsCheckingAssessment] = useState(true);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [submittedResponseId, setSubmittedResponseId] = useState<string | null>(null);

  const [contactData, setContactData] = useState({
    full_name: '',
    email: '',
    company: '',
    role: '',
    phone: '',
  });
  const [contactFormCompleted, setContactFormCompleted] = useState(false);
  const [hasStoredUserDetails, setHasStoredUserDetails] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha>(null);
  const [validationErrors, setValidationErrors] = useState<{ email?: string; phone?: string }>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      try {
        const sessionPromise = supabaseClient.supabase.auth.getSession();
        const timeoutPromise = new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 5000),
        );
        const result = await Promise.race([sessionPromise, timeoutPromise]);
        if (!result || !('data' in result)) throw new Error('auth');
        const session = result.data.session;
        if (!isMounted) return;

        if (session?.user) {
          setIsAuthenticated(true);
          setUserId(session.user.id);
          setUserEmail(session.user.email || null);
          syncUserDetailsFromSupabase().catch(() => {});
          const synced = getUserDetails();
          if (synced.full_name || synced.email) {
            setContactData({
              full_name: synced.full_name || '',
              email: synced.email || session.user.email || '',
              company: synced.company || '',
              role: synced.role || '',
              phone: synced.phone || '',
            });
          } else if (session.user.email) {
            setContactData({
              full_name: session.user.user_metadata?.full_name || '',
              email: session.user.email,
              company: session.user.user_metadata?.company || '',
              role: session.user.user_metadata?.role || '',
              phone: '',
            });
          }
          setContactFormCompleted(true);
          setHasStoredUserDetails(true);

          try {
            const { data: existing, error } = await supabaseClient.supabase
              .from('assessment_responses')
              .select('id')
              .eq('user_id', session.user.id)
              .eq('assessment_type', 'leadership')
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            if (!isMounted) return;
            if (!error && existing?.id) {
              saveStoredAssessment('leadership', { responseId: existing.id });
              window.location.href =
                typeof window !== 'undefined'
                  ? `${window.location.origin}${buildUrl(`/practice/results?id=${existing.id}`)}`
                  : buildUrl(`/practice/results?id=${existing.id}`);
              return;
            }
          } catch {
            /* continue */
          }
        }
      } catch {
        /* unauthenticated ok */
      } finally {
        if (isMounted) setIsCheckingAssessment(false);
      }
    };
    run();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const data = getStoredAssessment('leadership');
    if (data.submittedEmail) {
      setAlreadySubmitted(true);
      setSubmittedEmail(data.submittedEmail);
      setSubmittedResponseId(data.responseId || null);
    } else {
      setAlreadySubmitted(false);
      setSubmittedEmail(null);
      setSubmittedResponseId(null);
    }
  }, []);

  useEffect(() => {
    const stored = getUserDetails();
    if (stored.full_name && stored.email) {
      setContactData((prev) => ({
        ...prev,
        full_name: stored.full_name || prev.full_name,
        email: stored.email || prev.email,
        company: stored.company || prev.company,
        role: stored.role || prev.role,
        phone: stored.phone || prev.phone,
      }));
      setHasStoredUserDetails(true);
    }
  }, []);

  const needsContactInfo =
    !contactFormCompleted &&
    !isAuthenticated &&
    (!hasStoredUserDetails || !!captchaConfig?.enabled);

  const sectionAnswerCount = (sIdx: number) => Object.keys(answers[sIdx] ?? {}).length;
  const qCount = (sIdx: number) => SECTIONS[sIdx]?.questions.length ?? 0;
  const isSectionComplete = (sIdx: number) => sectionAnswerCount(sIdx) === qCount(sIdx);
  const allComplete = SECTIONS.every((_, i) => isSectionComplete(i));

  const sectionScore = (sIdx: number) =>
    Object.values(answers[sIdx] ?? {}).reduce((sum, v) => sum + v, 0);

  const maxPerSection = (sIdx: number) => qCount(sIdx) * 5;
  const totalScore = SECTIONS.reduce((sum, _, i) => sum + sectionScore(i), 0);
  const maxTotal = SECTIONS.reduce((sum, _, i) => sum + maxPerSection(i), 0);

  const handleRate = (questionIdx: number, value: number) => {
    setAnswers((prev) => ({
      ...prev,
      [currentSection]: {
        ...(prev[currentSection] ?? {}),
        [questionIdx]: value,
      },
    }));
  };

  const handleNext = () => {
    if (currentSection < totalSections - 1) {
      setCurrentSection((p) => p + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (currentSection > 0) {
      setCurrentSection((p) => p - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleEmailBlur = () => {
    const e = contactData.email.trim();
    if (e && !validateEmail(e)) {
      setValidationErrors((prev) => ({ ...prev, email: 'Please enter a valid email address.' }));
    }
  };

  const handlePhoneBlur = () => {
    const p = contactData.phone.trim();
    if (p && !validatePhone(p)) {
      setValidationErrors((prev) => ({ ...prev, phone: 'Please enter a valid phone number.' }));
    }
  };

  const completeContactStep = () => {
    if (!contactData.full_name.trim() || !contactData.email.trim()) {
      setErrorMessage('Please enter your full name and email.');
      return;
    }
    if (!validateEmail(contactData.email.trim())) {
      setValidationErrors((prev) => ({ ...prev, email: 'Please enter a valid email address.' }));
      return;
    }
    if (contactData.phone.trim() && !validatePhone(contactData.phone.trim())) {
      setValidationErrors((prev) => ({ ...prev, phone: 'Please enter a valid phone number.' }));
      return;
    }
    if (captchaConfig?.enabled && !captchaToken) {
      setErrorMessage('Please complete the captcha verification.');
      return;
    }
    setErrorMessage(null);
    saveUserDetails(contactData);
    setContactFormCompleted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!allComplete || totalSections === 0) return;

    const stored = getStoredAssessment('leadership');
    if (stored.submittedEmail) {
      setAlreadySubmitted(true);
      setSubmittedEmail(stored.submittedEmail);
      return;
    }

    if (captchaConfig?.enabled && !captchaToken && !isAuthenticated) {
      setErrorMessage('Please complete the captcha verification before submitting.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const s = SECTIONS.map((_, i) => sectionScore(i));
      const s0 = s[0] ?? 0;
      const s1 = s[1] ?? 0;
      const s2 = s[2] ?? 0;
      const s3 = s[3] ?? 0;

      const scoresPayload: Record<string, number> = {
        roleClarity: s0,
        leadershipExpectations: s1,
        performanceMeasurement: s2,
        supportResources: s3,
        total: totalScore,
      };

      const answersArray: Array<{
        question_id: string;
        score: number;
        question_text?: string;
        response_label?: string;
      }> = [];

      SECTIONS.forEach((sec, si) => {
        sec.questions.forEach((qText, qi) => {
          const pts = answers[si]?.[qi];
          if (pts != null) {
            answersArray.push({
              question_id: `${sec.key}-q${qi}`,
              score: pts,
              question_text: qText,
              response_label: RATING_OPTIONS.find((o) => o.value === pts)?.label,
            });
          }
        });
      });

      const res = await supabaseClient.submitAssessmentWithCaptcha({
        contactData: {
          ...contactData,
          source: 'leadership_scorecard',
        },
        userId: userId || undefined,
        assessmentType: 'leadership',
        scores: scoresPayload,
        habitScore: s0,
        abilityScore: s1,
        talentScore: s2,
        skillScore: s3,
        answers: answersArray,
        captchaToken: captchaToken || '',
      });

      if (!res?.id) throw new Error('No assessment id returned');

      if (contactData.email) {
        saveStoredAssessment('leadership', {
          submittedEmail: contactData.email,
          responseId: res.id,
          submittedAt: new Date().toISOString(),
        });
      }

      if (captchaRef.current) {
        captchaRef.current.resetCaptcha();
        setCaptchaToken(null);
      }

      setShowResults(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit. Please try again.';
      setErrorMessage(msg);
      if (captchaRef.current) {
        captchaRef.current.resetCaptcha();
        setCaptchaToken(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestart = () => {
    setAnswers({});
    setCurrentSection(0);
    setShowResults(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  if (alreadySubmitted && !showResults) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 lg:p-10 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-primary mb-4">Scorecard Already Submitted</h2>
          <p className="text-slate-600 mb-6">
            This device already submitted the Leadership Role Scorecard
            {submittedEmail ? ` (${submittedEmail})` : ''}.
          </p>
          {submittedResponseId && (
            <a
              href={buildUrl(`/practice/results?id=${submittedResponseId}`)}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors"
            >
              View Results
            </a>
          )}
          <div className="mt-6">
            <a href={createPageUrl('Practice')} className="text-primary font-medium hover:underline">
              Back to Practice
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (needsContactInfo) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 lg:p-10">
          <h2 className="text-2xl font-bold text-primary mb-2">Start Your Scorecard</h2>
          <p className="text-slate-500 mb-8">Enter your details to begin the Leadership Role Scorecard</p>
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">{errorMessage}</div>
          )}
          <div className="space-y-5">
            <div>
              <label htmlFor="ls_full_name" className="block text-slate-700 font-medium mb-1.5">
                Full Name *
              </label>
              <input
                id="ls_full_name"
                type="text"
                value={contactData.full_name}
                onChange={(e) => setContactData({ ...contactData, full_name: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="ls_email" className="block text-slate-700 font-medium mb-1.5">
                Email *
              </label>
              <input
                id="ls_email"
                type="email"
                value={contactData.email}
                onChange={(e) => {
                  setContactData({ ...contactData, email: e.target.value });
                  if (validationErrors.email) setValidationErrors((p) => ({ ...p, email: undefined }));
                }}
                onBlur={handleEmailBlur}
                className={`w-full px-4 py-3 rounded-xl border bg-white text-sm focus:ring-2 focus:ring-primary ${
                  validationErrors.email ? 'border-red-300' : 'border-slate-200'
                }`}
              />
              {validationErrors.email && <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>}
            </div>
            <div>
              <label htmlFor="ls_role" className="block text-slate-700 font-medium mb-1.5">
                Your Role
              </label>
              <input
                id="ls_role"
                type="text"
                value={contactData.role}
                onChange={(e) => setContactData({ ...contactData, role: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="ls_company" className="block text-slate-700 font-medium mb-1.5">
                  Company
                </label>
                <input
                  id="ls_company"
                  type="text"
                  value={contactData.company}
                  onChange={(e) => setContactData({ ...contactData, company: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label htmlFor="ls_phone" className="block text-slate-700 font-medium mb-1.5">
                  Phone
                </label>
                <input
                  id="ls_phone"
                  type="tel"
                  value={contactData.phone}
                  onChange={(e) => {
                    setContactData({ ...contactData, phone: e.target.value });
                    if (validationErrors.phone) setValidationErrors((p) => ({ ...p, phone: undefined }));
                  }}
                  onBlur={handlePhoneBlur}
                  className={`w-full px-4 py-3 rounded-xl border bg-white text-sm focus:ring-2 focus:ring-primary ${
                    validationErrors.phone ? 'border-red-300' : 'border-slate-200'
                  }`}
                />
                {validationErrors.phone && <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>}
              </div>
            </div>
            {captchaConfig?.enabled && captchaConfig.siteKey && (
              <div className="flex justify-center">
                <HCaptcha
                  ref={captchaRef}
                  sitekey={captchaConfig.siteKey}
                  onVerify={(t) => setCaptchaToken(t)}
                  onError={() => {
                    setCaptchaToken(null);
                    setErrorMessage('Captcha verification failed.');
                  }}
                  onExpire={() => setCaptchaToken(null)}
                />
              </div>
            )}
            <button
              type="button"
              onClick={completeContactStep}
              className="w-full bg-primary hover:bg-primary-dark text-white py-6 rounded-xl font-semibold"
            >
              Continue to Scorecard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (totalSections === 0) {
    return (
      <div className="text-center py-12 text-slate-600">
        Scorecard content is not available. Please configure sections in Sanity CMS.
      </div>
    );
  }

  if (showResults) {
    const normalized100 = maxTotal > 0 ? Math.round((totalScore / maxTotal) * 100) : 0;
    const result = getResultCategory(normalized100);
    const sectionScores = SECTIONS.map((s, i) => ({
      index: i,
      title: s.title,
      score: sectionScore(i),
      max: maxPerSection(i),
      color: s.color,
      icon: s.icon,
    }));
    const lowestSection = sectionScores.reduce((min, s) => (s.score < min.score ? s : min));

    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 lg:p-10 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Award className={`w-10 h-10 ${result.iconColor}`} />
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-2">
            Your Score: {totalScore} / {maxTotal}
          </h2>
          <span className={`inline-block mt-2 px-4 py-1.5 rounded-full text-sm font-semibold border ${result.badgeColor}`}>
            {result.subtitle}
          </span>
          <p className="text-xl lg:text-2xl font-semibold text-slate-700 mt-6 mb-2">{result.headline}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 lg:p-10">
          <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Section Scores
          </h3>
          <div className="space-y-4">
            {sectionScores.map((s) => {
              const SectionIcon = s.icon;
              const pct = s.max > 0 ? (s.score / s.max) * 100 : 0;
              const isLowest = s.index === lowestSection.index;
              return (
                <div
                  key={s.index}
                  className={`rounded-2xl border-2 p-4 transition-colors ${
                    isLowest ? `${s.color.border} ${s.color.light}` : 'border-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color.bg}`}>
                        <SectionIcon className={`w-5 h-5 ${s.color.text}`} />
                      </div>
                      <span className="font-semibold text-slate-700">{s.title}</span>
                      {isLowest && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <AlertTriangle className="w-3 h-3" />
                          Lowest
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-primary">
                      {s.score} / {s.max}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isLowest ? 'bg-amber-500' : 'bg-accent'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
            <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              What This Indicates
            </h3>
            <ul className="space-y-3">
              {result.indicators.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                  </div>
                  <span className="text-slate-600 text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
            <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
              <Compass className="w-5 h-5" />
              Recommended Next Steps
            </h3>
            <ul className="space-y-3">
              {result.nextSteps.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-600 text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 lg:p-10">
          <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            Reflection Questions
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              'What areas scored lowest and why?',
              'What expectations are unclear or undefined?',
              'Where might leaders lack authority or support?',
              'What improvements would make this role easier to succeed in?',
            ].map((q, i) => (
              <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-slate-700 text-sm font-medium">{q}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-primary to-primary-dark rounded-3xl p-8 lg:p-10 text-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/70 mb-2">LEAP Insight</p>
              <p className="text-lg leading-relaxed font-medium">
                &quot;Strong leadership performance requires strong leadership role design. When roles are unclear,
                leaders struggle. When expectations are clear, leaders can LEAP higher.&quot;
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href={createPageUrl('Solutions')}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors"
          >
            <Compass className="w-5 h-5" />
            Explore Leadership Solutions
          </a>
          <a
            href={createPageUrl('ScheduleCall')}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-accent text-white rounded-xl font-semibold hover:bg-accent/90 transition-colors"
          >
            <Calendar className="w-5 h-5" />
            Schedule a Leadership Conversation
          </a>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={handleRestart}
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary transition-colors font-medium"
          >
            <RotateCcw className="w-4 h-4" />
            Retake Assessment
          </button>
        </div>
      </div>
    );
  }

  const section = SECTIONS[currentSection];
  const SectionIcon = section.icon;
  const progress = ((currentSection + 1) / totalSections) * 100;
  const nQuestions = qCount(currentSection);

  return (
    <div className="max-w-3xl mx-auto">
      {errorMessage && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">{errorMessage}</div>
      )}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 lg:p-10">
        <div className="flex items-center justify-between mb-8">
          {SECTIONS.map((s, i) => {
            const Icon = s.icon;
            const done = isSectionComplete(i);
            const active = i === currentSection;
            return (
              <div key={s.key} className="flex items-center flex-1 last:flex-none">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentSection(i);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                    active
                      ? `${s.color.bg} ${s.color.text} ring-2 ${s.color.ring} ring-offset-2`
                      : done
                        ? 'bg-green-100 text-green-600'
                        : 'bg-slate-100 text-slate-400'
                  }`}
                  aria-label={`Go to section ${i + 1}: ${s.title}`}
                >
                  {done && !active ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </button>
                {i < SECTIONS.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-2 rounded-full ${done ? 'bg-green-300' : 'bg-slate-200'}`} />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3 mb-2">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${section.color.bg}`}>
            <SectionIcon className={`w-5 h-5 ${section.color.text}`} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Section {currentSection + 1} of {totalSections}
            </p>
            <h2 className="text-xl font-bold text-primary">{section.title}</h2>
          </div>
        </div>

        <div className="w-full h-2 bg-slate-100 rounded-full mb-8 overflow-hidden">
          <div className="h-full bg-accent rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        <div className="space-y-5 mb-8">
          {section.questions.map((question, qIdx) => {
            const selected = answers[currentSection]?.[qIdx];
            return (
              <div key={qIdx} className="rounded-2xl border border-slate-100 p-5 hover:border-slate-200 transition-colors">
                <p className="text-slate-700 font-medium mb-4 text-sm lg:text-base">
                  <span className={`font-bold ${section.color.text} mr-2`}>{qIdx + 1}.</span>
                  {question}
                </p>
                <div className="flex flex-wrap gap-2">
                  {RATING_OPTIONS.map((opt) => {
                    const isSelected = selected === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleRate(qIdx, opt.value)}
                        className={`flex-1 min-w-[100px] px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                          isSelected
                            ? `${section.color.border} ${section.color.bg} ${section.color.text}`
                            : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                        title={opt.label}
                      >
                        <span className="block font-bold">{opt.value}</span>
                        <span className="block text-[11px] leading-tight mt-0.5 opacity-80">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-sm text-slate-500 mb-6">
          <span>
            {sectionAnswerCount(currentSection)} of {nQuestions} questions answered
          </span>
          {isSectionComplete(currentSection) && (
            <span className="flex items-center gap-1 text-green-600 font-medium">
              <CheckCircle className="w-4 h-4" />
              Section complete
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentSection === 0}
            className="flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Previous
          </button>

          {currentSection === totalSections - 1 ? (
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={!allComplete || isSubmitting}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  View Results
                  <BarChart3 className="w-5 h-5" />
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-colors"
            >
              Next Section
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
