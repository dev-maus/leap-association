import { useState, useEffect } from 'react';
import { supabaseClient } from '../../lib/supabase';
import { buildUrl } from '../../lib/utils';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';

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

interface AssessmentFlowProps {
  type: 'individual' | 'team';
  questions: AssessmentQuestion[];
  ratingLabels?: RatingLabels;
  leadId?: string;
}

export default function AssessmentFlow({ type, questions, ratingLabels, leadId }: AssessmentFlowProps) {
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

  const handleNext = () => {
    if (needsContactInfo) {
      // Validate contact info before proceeding
      if (!contactData.full_name || !contactData.email) {
        alert('Please fill in all required fields');
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

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      let finalLeadId = leadId;

      // Create lead if not provided
      if (!finalLeadId) {
        const lead = await supabaseClient.entities.Lead.create({
          ...contactData,
          source: type === 'team' ? 'team_assessment' : 'individual_assessment',
        });
        finalLeadId = lead.id;
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

      const response = await supabaseClient.entities.AssessmentResponse.create({
        lead_id: finalLeadId,
        assessment_type: type,
        scores: leapScores,
        habit_score: habitScore,
        ability_score: abilityScore,
        talent_score: talentScore,
        skill_score: skillScore,
        answers: answersArray,
      });

      // Redirect to results page
      window.location.href = `${buildUrl('/practice/results')}?id=${response.id}`;
    } catch (error) {
      console.error('Failed to submit assessment:', error);
      alert('Failed to submit assessment. Please try again.');
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
                onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                required
                placeholder="john@company.com"
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
                  onChange={(e) => setContactData({ ...contactData, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

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

