import { useState } from 'react';
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
} from 'lucide-react';
import { createPageUrl } from '../../lib/utils';

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

interface Section {
  title: string;
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  color: { bg: string; text: string; border: string; light: string; ring: string };
  questions: string[];
}

const SECTIONS: Section[] = [
  {
    title: 'Role Clarity',
    key: 'role-clarity',
    icon: Target,
    color: {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      border: 'border-blue-500',
      light: 'bg-blue-50',
      ring: 'ring-blue-500',
    },
    questions: [
      'The purpose of this leadership role is clearly defined',
      'Success in this role is clearly defined',
      'The top 3\u20135 expected outcomes are clearly stated',
      'Key responsibilities are documented and understood',
      'Decision authority for the role is clearly defined',
    ],
  },
  {
    title: 'Leadership Expectations',
    key: 'leadership-expectations',
    icon: Users,
    color: {
      bg: 'bg-emerald-100',
      text: 'text-emerald-700',
      border: 'border-emerald-500',
      light: 'bg-emerald-50',
      ring: 'ring-emerald-500',
    },
    questions: [
      'Expectations for leading people are clearly defined',
      'The role clearly defines how team performance will be managed',
      'Communication expectations with senior leadership are clear',
      'The leader understands their accountability for results',
      'The role connects clearly to organizational goals',
    ],
  },
  {
    title: 'Performance Measurement',
    key: 'performance-measurement',
    icon: BarChart3,
    color: {
      bg: 'bg-purple-100',
      text: 'text-purple-700',
      border: 'border-purple-500',
      light: 'bg-purple-50',
      ring: 'ring-purple-500',
    },
    questions: [
      'The role includes measurable performance metrics',
      'Performance expectations are realistic and achievable',
      'There are clear indicators of success for this role',
      'Regular performance feedback is provided',
      'The role includes clear accountability for results',
    ],
  },
  {
    title: 'Support and Resources',
    key: 'support-resources',
    icon: HeartHandshake,
    color: {
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      border: 'border-amber-500',
      light: 'bg-amber-50',
      ring: 'ring-amber-500',
    },
    questions: [
      'The leader has the authority needed to succeed',
      'The leader has the resources needed to perform well',
      'Training or development support exists for this role',
      'The reporting structure supports effective leadership',
      'Organizational systems support leadership effectiveness',
    ],
  },
];

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LeadershipScorecard() {
  const [currentSection, setCurrentSection] = useState(0);
  // answers[sectionIndex][questionIndex] = rating (1-5)
  const [answers, setAnswers] = useState<Record<number, Record<number, number>>>({});
  const [showResults, setShowResults] = useState(false);

  const section = SECTIONS[currentSection];
  const totalSections = SECTIONS.length;

  // Helpers
  const sectionAnswerCount = (sIdx: number) => Object.keys(answers[sIdx] ?? {}).length;
  const isSectionComplete = (sIdx: number) => sectionAnswerCount(sIdx) === 5;
  const allComplete = SECTIONS.every((_, i) => isSectionComplete(i));

  const sectionScore = (sIdx: number) =>
    Object.values(answers[sIdx] ?? {}).reduce((sum, v) => sum + v, 0);

  const totalScore = SECTIONS.reduce((sum, _, i) => sum + sectionScore(i), 0);

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

  const handleSubmit = () => {
    setShowResults(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRestart = () => {
    setAnswers({});
    setCurrentSection(0);
    setShowResults(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // -----------------------------------------------------------------------
  // Results view
  // -----------------------------------------------------------------------
  if (showResults) {
    const result = getResultCategory(totalScore);

    // Find lowest scoring section
    const sectionScores = SECTIONS.map((s, i) => ({
      index: i,
      title: s.title,
      score: sectionScore(i),
      color: s.color,
      icon: s.icon,
    }));
    const lowestSection = sectionScores.reduce((min, s) =>
      s.score < min.score ? s : min,
    );

    return (
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Score header card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 lg:p-10 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Award className={`w-10 h-10 ${result.iconColor}`} />
          </div>

          <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-2">
            Your Score: {totalScore} / 100
          </h2>

          <span
            className={`inline-block mt-2 px-4 py-1.5 rounded-full text-sm font-semibold border ${result.badgeColor}`}
          >
            {result.subtitle}
          </span>

          <p className="text-xl lg:text-2xl font-semibold text-slate-700 mt-6 mb-2">
            {result.headline}
          </p>
        </div>

        {/* Section breakdown */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 lg:p-10">
          <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Section Scores
          </h3>

          <div className="space-y-4">
            {sectionScores.map((s) => {
              const SectionIcon = s.icon;
              const pct = (s.score / 25) * 100;
              const isLowest = s.index === lowestSection.index;
              return (
                <div
                  key={s.index}
                  className={`rounded-2xl border-2 p-4 transition-colors ${
                    isLowest
                      ? `${s.color.border} ${s.color.light}`
                      : 'border-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color.bg}`}
                      >
                        <SectionIcon className={`w-5 h-5 ${s.color.text}`} />
                      </div>
                      <span className="font-semibold text-slate-700">
                        {s.title}
                      </span>
                      {isLowest && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <AlertTriangle className="w-3 h-3" />
                          Lowest
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-primary">
                      {s.score} / 25
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

        {/* What this indicates & next steps */}
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

        {/* Reflection questions */}
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
              <div
                key={i}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-100"
              >
                <p className="text-slate-700 text-sm font-medium">{q}</p>
              </div>
            ))}
          </div>
        </div>

        {/* LEAP Insight */}
        <div className="bg-gradient-to-br from-primary to-primary-dark rounded-3xl p-8 lg:p-10 text-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/70 mb-2">
                LEAP Insight
              </p>
              <p className="text-lg leading-relaxed font-medium">
                "Strong leadership performance requires strong leadership role
                design. When roles are unclear, leaders struggle. When
                expectations are clear, leaders can LEAP higher."
              </p>
            </div>
          </div>
        </div>

        {/* CTAs */}
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

        {/* Restart */}
        <div className="text-center">
          <button
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

  // -----------------------------------------------------------------------
  // Multi-step form view
  // -----------------------------------------------------------------------
  const SectionIcon = section.icon;
  const progress = ((currentSection + 1) / totalSections) * 100;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 lg:p-10">
        {/* Section progress steps */}
        <div className="flex items-center justify-between mb-8">
          {SECTIONS.map((s, i) => {
            const Icon = s.icon;
            const done = isSectionComplete(i);
            const active = i === currentSection;
            return (
              <div key={s.key} className="flex items-center flex-1 last:flex-none">
                <button
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
                  {done && !active ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </button>
                {i < SECTIONS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 rounded-full transition-colors ${
                      done ? 'bg-green-300' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Section header */}
        <div className="flex items-center gap-3 mb-2">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${section.color.bg}`}
          >
            <SectionIcon className={`w-5 h-5 ${section.color.text}`} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Section {currentSection + 1} of {totalSections}
            </p>
            <h2 className="text-xl font-bold text-primary">{section.title}</h2>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-slate-100 rounded-full mb-8 overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Questions */}
        <div className="space-y-5 mb-8">
          {section.questions.map((question, qIdx) => {
            const selected = answers[currentSection]?.[qIdx];
            return (
              <div
                key={qIdx}
                className="rounded-2xl border border-slate-100 p-5 hover:border-slate-200 transition-colors"
              >
                <p className="text-slate-700 font-medium mb-4 text-sm lg:text-base">
                  <span className={`font-bold ${section.color.text} mr-2`}>
                    {qIdx + 1}.
                  </span>
                  {question}
                </p>

                {/* Rating buttons */}
                <div className="flex flex-wrap gap-2">
                  {RATING_OPTIONS.map((opt) => {
                    const isSelected = selected === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => handleRate(qIdx, opt.value)}
                        className={`flex-1 min-w-[100px] px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                          isSelected
                            ? `${section.color.border} ${section.color.bg} ${section.color.text}`
                            : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                        title={opt.label}
                      >
                        <span className="block font-bold">{opt.value}</span>
                        <span className="block text-[11px] leading-tight mt-0.5 opacity-80">
                          {opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Section completion indicator */}
        <div className="flex items-center justify-between text-sm text-slate-500 mb-6">
          <span>
            {sectionAnswerCount(currentSection)} of 5 questions answered
          </span>
          {isSectionComplete(currentSection) && (
            <span className="flex items-center gap-1 text-green-600 font-medium">
              <CheckCircle className="w-4 h-4" />
              Section complete
            </span>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentSection === 0}
            className="flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Previous
          </button>

          {currentSection === totalSections - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={!allComplete}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              View Results
              <BarChart3 className="w-5 h-5" />
            </button>
          ) : (
            <button
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
