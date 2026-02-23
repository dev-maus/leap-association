import { useState, useEffect } from 'react';
import { supabaseClient } from '../../lib/supabase';
import { getUserDetails } from '../../lib/userStorage';
import { saveAssessmentData } from '../../lib/assessmentStorage';
import { buildUrl } from '../../lib/utils';
import jsPDF from 'jspdf';
import { Download, Loader2, Calendar, Target, Zap, BookOpen, ChevronRight, TrendingUp } from 'lucide-react';

interface LeapDimensionScores {
  leadership: number;
  effectiveness: number;
  accountability: number;
  productivity: number;
}

function getInterpretationText(
  leapScores: LeapDimensionScores,
  maxLEAPScore: number
): { zone: string; description: string } {
  const percentages = Object.values(leapScores).map((s) => (s / maxLEAPScore) * 100);
  const minPct = Math.min(...percentages);
  const maxPct = Math.max(...percentages);
  const avgPct = percentages.reduce((a, b) => a + b, 0) / 4;
  const range = maxPct - minPct;

  if (minPct >= 80) {
    return {
      zone: 'Expert Zone',
      description:
        'Your scores indicate exceptional development across all LEAP dimensions. You demonstrate consistent, high-level practice in Leadership, Effectiveness, Accountability, and Productivity.',
    };
  }
  if (minPct < 40) {
    return {
      zone: 'Growth Zone',
      description:
        'Your scores reveal opportunities for focused development. One or more dimensions would benefit from intentional practice. Start with your lowest area and build systematically.',
    };
  }
  if (range <= 25 && avgPct >= 60) {
    return {
      zone: 'Emerging Leader Zone',
      description:
        "Your scores indicate balanced development across Habits, Abilities, Talents, and Skills. This profile represents the 'Emerging Leader Zone' — high potential with inconsistent execution. You demonstrate the capability for strong leadership but require more consistent practice across LEAP dimensions.",
    };
  }
  return {
    zone: 'Developing Leader Zone',
    description:
      'Your scores show a mix of strengths and growth areas. Focus on building consistency in your strongest dimensions while intentionally developing those that need more attention.',
  };
}

function formatCategory(category: string): string {
  const map: Record<string, string> = {
    habit: 'Habits',
    ability: 'Ability',
    talent: 'Talent',
    skill: 'Skill',
  };
  return map[category] ?? category;
}

function getPracticeLevel(score: number, maxScore: number): { level: string; color: string } {
  // Team scoring: 10-12 = Strong, 7-9 = Emerging, 3-6 = Growth Area (for max 12)
  // Individual: 7-8 = Strong, 5-6 = Emerging, 1-4 = Growth Area (for max 8)
  const pct = (score / maxScore) * 100;
  if (pct >= 80) return { level: 'Strong', color: 'text-emerald-600' };
  if (pct >= 55) return { level: 'Emerging', color: 'text-amber-600' };
  return { level: 'Growth Area', color: 'text-red-500' };
}

function getTeamHATSInterpretation(
  category: string,
  score: number,
  maxScore: number
): { level: string; color: string; description: string } {
  const { level, color } = getPracticeLevel(score, maxScore);
  const interpretations: Record<string, Record<string, string>> = {
    habit: {
      Strong: 'Your team demonstrates excellent daily practices, with strong routines and consistent preparation patterns.',
      Emerging: 'Your team shows emerging consistency in daily practices, but disruptions still occur. Focus on strengthening preparation routines and response patterns when challenges arise.',
      'Growth Area': 'Your team needs to establish stronger daily routines. Focus on building consistent preparation and response habits.',
    },
    ability: {
      Strong: 'Your team consistently follows through on commitments, maintains clear expectations, and adapts quickly when responsibilities shift.',
      Emerging: 'Your team shows promise in execution but needs more consistency in follow-through and adapting to changing responsibilities.',
      'Growth Area': 'Your team should focus on building clearer expectations and better follow-through on commitments.',
    },
    talent: {
      Strong: 'Your team effectively leverages individual strengths and consistently applies natural talents to enhance performance.',
      Emerging: "Your team has recognizable talents, but they're not consistently applied. Intentionally mapping and utilizing individual strengths will enhance team performance.",
      'Growth Area': 'Your team should focus on identifying and systematically applying individual talents to team goals.',
    },
    skill: {
      Strong: 'Your team proactively invests in skill development, demonstrates strong communication, and adapts quickly to new tools and processes.',
      Emerging: 'Your team shows good skill foundations but could benefit from more intentional development and knowledge sharing.',
      'Growth Area': 'Your team should prioritize skill development, communication improvement, and learning new tools and processes.',
    },
  };
  return {
    level,
    color,
    description: interpretations[category]?.[level] || '',
  };
}

const TEAM_RECOMMENDED_ACTIONS = [
  { title: "Identify your team's lowest HATS score", description: 'and begin focusing development there.' },
  { title: 'Choose 1–2 repeatable team practices', description: 'to strengthen over 30 days.' },
  { title: 'Establish team checkpoints', description: 'to reinforce accountability and follow-through.' },
  { title: 'Align team behaviors', description: 'with organizational mission and priorities.' },
  { title: 'Integrate LEAP routines', description: 'into meetings, planning, and execution rhythms.' },
];

interface SchedulingOption {
  buttonText: string;
  url: string;
}

interface SchedulingConfig {
  individual: SchedulingOption;
  team: SchedulingOption;
}

interface AssessmentResultsProps {
  schedulingConfig: SchedulingConfig;
}

export default function AssessmentResults({ schedulingConfig }: AssessmentResultsProps) {
  const [response, setResponse] = useState<any>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    
    // Set a timeout for the fetch request (15 seconds)
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 15000);
    
    // Get ID from URL
    const params = new URLSearchParams(window.location.search);
    const currentResponseId = params.get('id');

    if (!currentResponseId) {
      setError('No assessment ID provided');
      setIsLoading(false);
      clearTimeout(timeoutId);
      return;
    }

    const loadResults = async () => {
      const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || '';
      const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '';
      
      if (!supabaseUrl || !supabaseAnonKey) {
        if (isMounted) {
          setError('Configuration error. Please contact support.');
          setIsLoading(false);
        }
        return;
      }
      
      const functionUrl = `${supabaseUrl}/functions/v1/get-assessment-results`;
      
      // Build headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        apikey: supabaseAnonKey,
      };
      
      // Try to get auth token (with timeout)
      try {
        const sessionPromise = supabaseClient.supabase.auth.getSession();
        const timeoutPromise = new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 3000)
        );
        
        const result = await Promise.race([sessionPromise, timeoutPromise]);
        if (result && 'data' in result) {
          const session = result.data.session;
          if (session?.access_token && session.expires_at && (session.expires_at * 1000) > Date.now()) {
            headers.Authorization = `Bearer ${session.access_token}`;
          }
        }
      } catch {
        // Continue without auth token - Edge Function allows public access
      }
      
      try {
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({ responseId: currentResponseId }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || `Failed to fetch (${response.status})`);
        }

        const foundResponse = await response.json();

        if (!isMounted) return;

        setResponse(foundResponse);
        
        // Save to localStorage if user owns assessment (non-blocking)
        supabaseClient.supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user && foundResponse.user_id === session.user.id) {
            saveAssessmentData({ responseId: foundResponse.id });
          }
        }).catch(() => {
          // Ignore - we already have the results
        });

        // Get user details from localStorage
        const storedUserDetails = getUserDetails();
        if (storedUserDetails.full_name || storedUserDetails.email) {
          setUserDetails(storedUserDetails);
        }
      } catch (fetchError: any) {
        if (!isMounted) return;
        
        if (fetchError.name === 'AbortError') {
          setError('Request timed out. Please try again.');
        } else {
          setError(fetchError?.message || 'Failed to load assessment results.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadResults();
    
    // Cleanup function
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, []); // Run once on mount

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="ml-4 text-slate-600">Loading assessment results...</p>
      </div>
    );
  }

  if (error || !response) {
    return (
      <div className="text-center py-20">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md mx-auto">
          <p className="text-red-800 font-medium mb-2">Unable to load assessment results</p>
          <p className="text-red-600 text-sm mb-4">{error || 'Assessment results not found.'}</p>
          <p className="text-slate-500 text-xs">
            If you just submitted this assessment, the results may still be processing. Please try refreshing the page.
          </p>
        </div>
      </div>
    );
  }

  const isTeam = response.assessment_type === 'team';
  const maxLEAPScore = isTeam ? 24 : 16;  // (12+12) or (8+8)
  const maxHATSScore = isTeam ? 12 : 8;   // 3×4 or 2×4

  const dimensionConfig: Record<
    string,
    { letter: string; formula: string; barColor: string; gradient: string }
  > = {
    leadership: {
      letter: 'L',
      formula: 'Habits + Talents',
      barColor: 'bg-blue-500',
      gradient: 'from-blue-500 to-blue-600',
    },
    effectiveness: {
      letter: 'E',
      formula: 'Habits + Abilities',
      barColor: 'bg-emerald-500',
      gradient: 'from-emerald-500 to-emerald-600',
    },
    accountability: {
      letter: 'A',
      formula: 'Abilities + Skills',
      barColor: 'bg-purple-500',
      gradient: 'from-purple-500 to-purple-600',
    },
    productivity: {
      letter: 'P',
      formula: 'Habits + Skills',
      barColor: 'bg-amber-500',
      gradient: 'from-amber-500 to-amber-600',
    },
  };

  const interpretation = getInterpretationText(
    response.scores || { leadership: 0, effectiveness: 0, accountability: 0, productivity: 0 },
    maxLEAPScore
  );

  const orderedLeapScores = [
    { key: 'leadership', score: response.scores?.leadership || 0 },
    { key: 'effectiveness', score: response.scores?.effectiveness || 0 },
    { key: 'accountability', score: response.scores?.accountability || 0 },
    { key: 'productivity', score: response.scores?.productivity || 0 },
  ].map((s) => ({
    ...s,
    percentage: (s.score / maxLEAPScore) * 100,
  }));

  const answers = (response.answers || []) as Array<{
    question_id?: string;
    question_text?: string;
    response_label?: string;
    category?: string;
    score?: number;
  }>;

  const quickWinItems = [
    'Set a Daily Top 3 — Identify the 3 most important tasks before your day begins',
    "Give one piece of positive feedback — Acknowledge someone's contribution within the first hour",
    "Review tomorrow's priorities before ending your day — Spend 5 minutes planning the next day",
  ];

  // Team-specific data
  const hatsCategories = [
    { key: 'habit', label: 'Habits', score: response.habit_score || 0 },
    { key: 'ability', label: 'Abilities', score: response.ability_score || 0 },
    { key: 'talent', label: 'Talents', score: response.talent_score || 0 },
    { key: 'skill', label: 'Skills', score: response.skill_score || 0 },
  ];

  const sortedHATSCategories = [...hatsCategories].sort((a, b) => b.score - a.score);
  const strongestHATS = sortedHATSCategories[0];
  const weakestHATS = sortedHATSCategories[sortedHATSCategories.length - 1];

  const workshopsUrl = buildUrl('events');

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const purple = [118, 100, 143] as [number, number, number];
    const dateStr = new Date(response.created_at || response.created_date || Date.now()).toLocaleDateString();

    doc.setFontSize(20);
    doc.setTextColor(...purple);
    doc.text(isTeam ? 'LEAP Team HATS™ Diagnostic' : 'LEAP HATS™ Diagnostic Results', 20, 20);

    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(
      isTeam
        ? "A LEAP Framework Analysis of Your Team's Habits, Abilities, Talents, and Skills"
        : 'A LEAP-Branded Practice Insight Report',
      20,
      28
    );

    // Introduction/Summary block (purple background)
    doc.setFillColor(...purple);
    doc.rect(0, 35, 210, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text(isTeam ? 'Team Summary Report' : 'Introduction', 20, 45);
    doc.setFontSize(9);
    doc.text(
      isTeam
        ? "This summary provides a snapshot of your team's collective HATS scores. These reveal the patterns that most influence team performance, alignment, and outcomes."
        : 'Every leader is practicing something — intentionally or unintentionally. Your HATS™ (Habits, Abilities, Talents, and Skills) reveal the truth behind your daily practice and how it impacts your Leadership, Effectiveness, Accountability, and Productivity.',
      20,
      53,
      { maxWidth: 170 }
    );

    let yPos = 80;

    if (isTeam) {
      // Team HATS Practice Profile
      doc.setTextColor(...purple);
      doc.setFontSize(14);
      doc.text('Team HATS™ Practice Profile', 20, yPos);
      yPos += 10;

      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text('HATS Category', 20, yPos);
      doc.text('Score', 80, yPos);
      doc.text('Practice Level', 120, yPos);
      yPos += 6;
      doc.setDrawColor(200, 200, 200);
      doc.line(20, yPos, 190, yPos);
      yPos += 6;

      doc.setTextColor(0, 0, 0);
      hatsCategories.forEach((cat) => {
        const { level } = getPracticeLevel(cat.score, maxHATSScore);
        doc.text(cat.label, 20, yPos);
        doc.text(String(cat.score), 80, yPos);
        doc.text(level, 120, yPos);
        yPos += 7;
      });

      yPos += 8;
      doc.setTextColor(...purple);
      doc.setFontSize(14);
      doc.text('Team LEAP Mapping', 20, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      Object.entries(response.scores || {}).forEach(([dimension, score]: [string, unknown]) => {
        const s = Number(score);
        doc.text(`${dimension.charAt(0).toUpperCase() + dimension.slice(1)}: ${s}/${maxLEAPScore}`, 20, yPos);
        yPos += 6;
      });

      yPos += 8;
      doc.setTextColor(...purple);
      doc.setFontSize(14);
      doc.text('Team Practice Insights', 20, yPos);
      yPos += 8;
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text(`• Strongest area: ${strongestHATS.label} (${strongestHATS.score}/${maxHATSScore})`, 20, yPos);
      yPos += 6;
      doc.text(`• Growth opportunity: ${weakestHATS.label} (${weakestHATS.score}/${maxHATSScore})`, 20, yPos);
    } else {
      // Individual - Participant Results Summary
      doc.setTextColor(...purple);
      doc.setFontSize(14);
      doc.text('Participant Results Summary', 20, yPos);
      yPos += 8;

      const participantName = userDetails?.full_name || '—';
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('Name', 20, yPos);
      doc.setTextColor(0, 0, 0);
      doc.text(participantName, 50, yPos);
      doc.setTextColor(100, 100, 100);
      doc.text('Date', 140, yPos);
      doc.setTextColor(0, 0, 0);
      doc.text(dateStr, 160, yPos);
      yPos += 10;

      doc.setDrawColor(200, 200, 200);
      doc.line(20, yPos, 190, yPos);
      yPos += 8;

      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text('Question', 20, yPos);
      doc.text('Your Response', 80, yPos);
      doc.text('Category', 145, yPos);
      doc.text('Points', 180, yPos);
      yPos += 6;
      doc.line(20, yPos, 190, yPos);
      yPos += 6;

      doc.setTextColor(0, 0, 0);
      answers.forEach((a, i) => {
        if (yPos > 250) return;
        const qText = (a.question_text || `Q${i + 1}`).slice(0, 30);
        const resp = (a.response_label || '—').slice(0, 30);
        const cat = formatCategory(a.category || '');
        const pts = String(a.score ?? '—');
        doc.text(qText, 20, yPos);
        doc.text(resp, 80, yPos);
        doc.text(cat, 145, yPos);
        doc.text(pts, 183, yPos);
        yPos += 8;
      });

      yPos += 10;
      doc.setFontSize(14);
      doc.setTextColor(...purple);
      doc.text('LEAP Dimension Scores', 20, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      Object.entries(response.scores || {}).forEach(([dimension, score]: [string, unknown]) => {
        const s = Number(score);
        doc.text(`${dimension.charAt(0).toUpperCase() + dimension.slice(1)}: ${s}/${maxLEAPScore}`, 20, yPos);
        yPos += 6;
      });

      yPos += 6;
      doc.setFontSize(14);
      doc.setTextColor(...purple);
      doc.text('HATS™ Category Breakdown', 20, yPos);
      yPos += 6;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Habits: ${response.habit_score || 0}/${maxHATSScore}`, 20, yPos);
      yPos += 6;
      doc.text(`Abilities: ${response.ability_score || 0}/${maxHATSScore}`, 20, yPos);
      yPos += 6;
      doc.text(`Talents: ${response.talent_score || 0}/${maxHATSScore}`, 20, yPos);
      yPos += 6;
      doc.text(`Skills: ${response.skill_score || 0}/${maxHATSScore}`, 20, yPos);
    }

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('© LEAP Association - Excellence is a practice, not an event.', 20, 285);

    const fileName = isTeam
      ? `LEAP-Team-HATS-Report-${dateStr.replace(/\//g, '-')}.pdf`
      : userDetails?.full_name
        ? `LEAP-HATS-Assessment-${userDetails.full_name.replace(/\s+/g, '-')}.pdf`
        : `LEAP-HATS-Assessment-${response.id}.pdf`;
    doc.save(fileName);
  };

  const scheduling = isTeam ? schedulingConfig.team : schedulingConfig.individual;
  const schedulingUrl = scheduling.url
    ? (() => {
        const url = new URL(scheduling.url);
        if (userDetails?.full_name) url.searchParams.set('name', userDetails.full_name);
        if (userDetails?.email) url.searchParams.set('email', userDetails.email);
        if (userDetails?.company) url.searchParams.set('company', userDetails.company);
        return url.toString();
      })()
    : null;
  const trainingUrl = buildUrl('services/training');
  const createdDate = new Date(response.created_at || response.created_date || Date.now()).toLocaleDateString();

  // Team-specific rendering
  if (isTeam) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-primary mb-2">
            LEAP Team HATS™ Diagnostic
          </h1>
          <p className="text-lg text-slate-600 italic mb-6">
            A LEAP Framework Analysis of Your Team's Habits, Abilities, Talents, and Skills
          </p>
          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-primary bg-white text-primary hover:bg-primary/5 transition-colors"
          >
            <Download className="w-5 h-5" />
            Download PDF Report
          </button>
        </div>

        {/* Team Summary Report */}
        <div className="bg-primary rounded-2xl p-8 shadow-md">
          <h2 className="text-xl font-bold text-white mb-4">Team Summary Report</h2>
          <p className="text-white/95 leading-relaxed">
            This summary provides a snapshot of your team's collective HATS scores. These reveal the patterns that most influence team performance, alignment, and outcomes.
          </p>
        </div>

        {/* Team HATS Practice Profile */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-primary mb-4">Team HATS™ Practice Profile</h2>
          <p className="text-slate-600 mb-6">
            This snapshot reveals the patterns that most influence team performance, alignment, and outcomes.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 text-slate-600 font-medium">HATS Category</th>
                  <th className="text-left py-3 text-slate-600 font-medium">Score</th>
                  <th className="text-left py-3 text-slate-600 font-medium">Practice Level</th>
                </tr>
              </thead>
              <tbody>
                {hatsCategories.map((cat) => {
                  const { level, color } = getPracticeLevel(cat.score, maxHATSScore);
                  return (
                    <tr key={cat.key} className="border-b border-slate-100">
                      <td className="py-3 text-slate-900">{cat.label}</td>
                      <td className="py-3 font-bold text-slate-900">{cat.score}</td>
                      <td className={`py-3 ${color}`}>{level}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Interpretation of Team Practices */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-primary mb-6">Interpretation of Team Practices</h2>
          <div className="space-y-4">
            {hatsCategories.map((cat) => {
              const interp = getTeamHATSInterpretation(cat.key, cat.score, maxHATSScore);
              return (
                <div key={cat.key}>
                  <span className={`font-semibold ${interp.color}`}>
                    {cat.label} - {interp.level}:
                  </span>{' '}
                  <span className="text-slate-700">{interp.description}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Team Practice Insights */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-primary mb-6">Team Practice Insights</h2>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-slate-400 mt-2 flex-shrink-0" />
              <span className="text-slate-700">
                Your team's strongest area is <strong>{strongestHATS.label}</strong> ({strongestHATS.score}/{maxHATSScore}), indicating excellent consistency in these practices.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-slate-400 mt-2 flex-shrink-0" />
              <span className="text-slate-700">
                <strong>{weakestHATS.label}</strong> represents your primary growth opportunity ({weakestHATS.score}/{maxHATSScore}). Focusing development here will have the highest impact on overall team performance.
              </span>
            </li>
          </ul>
        </div>

        {/* Team LEAP Mapping */}
        <div className="bg-amber-50 rounded-2xl p-8 shadow-sm border border-amber-200">
          <h2 className="text-xl font-bold text-primary mb-6">Team LEAP Mapping</h2>
          <div className="space-y-5">
            {orderedLeapScores.map((dimension) => {
              const config = dimensionConfig[dimension.key];
              return (
                <div key={dimension.key} className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-full bg-gradient-to-br ${config.gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}
                  >
                    <span className="text-white text-xl font-bold">{config.letter}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-slate-700 font-medium">
                      {dimension.key.charAt(0).toUpperCase() + dimension.key.slice(1)} ({config.letter}) = {config.formula}
                    </span>
                    <div className="mt-2 h-3 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${config.barColor} rounded-full transition-all duration-1000`}
                        style={{ width: `${Math.min(100, dimension.percentage)}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-slate-700 font-semibold flex-shrink-0">
                    {dimension.score}/{maxLEAPScore}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recommended Team Actions */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-primary mb-6">Recommended Team Actions</h2>
          <ol className="space-y-4">
            {TEAM_RECOMMENDED_ACTIONS.map((action, i) => (
              <li key={i} className="flex items-start gap-4">
                <span className="text-slate-500 font-medium">{i + 1}.</span>
                <span className="text-slate-700">
                  <strong>{action.title}</strong> — {action.description}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* Next Steps for Your Team */}
        <div className="bg-primary rounded-2xl p-8 lg:p-10 shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Next Steps for Your Team</h2>
          </div>
          <p className="text-white/90 mb-4">
            Your Team HATS™ results reveal what your team is practicing — intentionally or unintentionally.
          </p>
          <p className="text-white/80 mb-2">Use your scores to identify:</p>
          <ul className="space-y-2 mb-6">
            <li className="flex items-start gap-2 text-white/90">
              <span className="w-1.5 h-1.5 rounded-full bg-white/80 mt-2" />
              Your strongest collective practices
            </li>
            <li className="flex items-start gap-2 text-white/90">
              <span className="w-1.5 h-1.5 rounded-full bg-white/80 mt-2" />
              Your emerging capabilities
            </li>
            <li className="flex items-start gap-2 text-white/90">
              <span className="w-1.5 h-1.5 rounded-full bg-white/80 mt-2" />
              Your hidden gaps limiting performance
            </li>
          </ul>
          <p className="text-white/80 mb-6">
            For deeper alignment across Leadership, Effectiveness, Accountability, and Productivity, consider a{' '}
            <strong className="text-white">LEAP Team Workshop</strong> or <strong className="text-white">Strategy Session</strong>.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {schedulingUrl && (
              <a
                href={schedulingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary-dark/80 rounded-xl p-6 hover:bg-primary-dark transition-colors group"
              >
                <Calendar className="w-10 h-10 text-accent mb-4" />
                <h3 className="font-bold text-white mb-2">Schedule Your Team Consultation</h3>
                <p className="text-white/80 text-sm mb-4">Book a strategy session to discuss team alignment and next steps</p>
                <span className="inline-flex w-8 h-8 rounded-full bg-accent items-center justify-center group-hover:scale-110 transition-transform">
                  <ChevronRight className="w-4 h-4 text-white" />
                </span>
              </a>
            )}
            <a
              href={workshopsUrl}
              className="bg-primary-dark/80 rounded-xl p-6 hover:bg-primary-dark transition-colors group block"
            >
              <TrendingUp className="w-10 h-10 text-accent mb-4" />
              <h3 className="font-bold text-white mb-2">Explore Team Workshops</h3>
              <p className="text-white/80 text-sm mb-4">Discover LEAP Team Alignment Workshops and immersive events</p>
              <span className="inline-flex w-8 h-8 rounded-full bg-accent items-center justify-center group-hover:scale-110 transition-transform">
                <ChevronRight className="w-4 h-4 text-white" />
              </span>
            </a>
            <button
              onClick={handleDownloadPDF}
              className="bg-primary-dark/80 rounded-xl p-6 hover:bg-primary-dark transition-colors text-left group"
            >
              <Download className="w-10 h-10 text-accent mb-4" />
              <h3 className="font-bold text-white mb-2">Download Team Report</h3>
              <p className="text-white/80 text-sm mb-4">Get your complete PDF report to share with your team</p>
              <span className="inline-flex w-8 h-8 rounded-full bg-accent items-center justify-center group-hover:scale-110 transition-transform">
                <ChevronRight className="w-4 h-4 text-white" />
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Individual assessment rendering
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl lg:text-5xl font-bold text-primary mb-2">
          LEAP HATS™ Diagnostic Results
        </h1>
        <p className="text-lg text-slate-600 italic mb-6">
          A LEAP-Branded Practice Insight Report
        </p>
        <button
          onClick={handleDownloadPDF}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-primary bg-white text-primary hover:bg-primary/5 transition-colors"
        >
          <Download className="w-5 h-5" />
          Download PDF Report
        </button>
      </div>

      {/* Introduction */}
      <div className="bg-primary rounded-2xl p-8 shadow-md">
        <h2 className="text-xl font-bold text-white mb-4">Introduction</h2>
        <p className="text-white/95 leading-relaxed">
          Every leader is practicing something — intentionally or unintentionally. Your HATS™ (Habits, Abilities, Talents, and Skills) reveal the truth behind your daily practice and how it impacts your Leadership, Effectiveness, Accountability, and Productivity.
        </p>
      </div>

      {/* HATS Score Summary */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-primary">HATS Score Summary</h2>
      </div>

      {/* Interpretation of Your HATS Profile */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-primary mb-4">Interpretation of Your HATS™ Profile</h2>
        <p className="text-slate-700 leading-relaxed">
          {interpretation.description}
        </p>
      </div>

      {/* LEAP Interpretation */}
      <div className="bg-amber-50 rounded-2xl p-8 shadow-sm border border-amber-200">
        <h2 className="text-xl font-bold text-primary mb-6">LEAP Interpretation</h2>
        <div className="space-y-5">
          {orderedLeapScores.map((dimension) => {
            const config = dimensionConfig[dimension.key];
            return (
              <div key={dimension.key} className="flex items-center gap-4">
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}
                >
                  <span className="text-white text-3xl font-bold">{config.letter}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-slate-700 font-medium">
                    {dimension.key.charAt(0).toUpperCase() + dimension.key.slice(1)} ({config.letter}) = {config.formula}
                  </span>
                  <div className="mt-2 h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${config.barColor} rounded-full transition-all duration-1000`}
                      style={{ width: `${Math.min(100, dimension.percentage)}%` }}
                    />
                  </div>
                </div>
                <span className="text-slate-700 font-semibold flex-shrink-0">
                  {dimension.score}/{maxLEAPScore}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Participant Results Summary */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-primary mb-6">Participant Results Summary</h2>
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
          <div>
            <span className="text-slate-500 text-sm block">Name</span>
            <span className="font-bold text-slate-900">{userDetails?.full_name || '—'}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-500 text-sm block">Date</span>
            <span className="font-bold text-slate-900">{createdDate}</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 text-slate-600 font-medium">Question</th>
                <th className="text-left py-3 text-slate-600 font-medium">Your Response</th>
                <th className="text-left py-3 text-slate-600 font-medium">Category</th>
                <th className="text-right py-3 text-slate-600 font-medium">Points</th>
              </tr>
            </thead>
            <tbody>
              {answers.map((a, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="py-3 font-medium text-slate-900">{a.question_text || `Q${i + 1}`}</td>
                  <td className="py-3 text-slate-700">{a.response_label || '—'}</td>
                  <td className="py-3 text-slate-700">{formatCategory(a.category || '')}</td>
                  <td className="py-3 text-right text-slate-700">{a.score ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Your LEAP Practice Summary */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-primary mb-6">Your LEAP Practice Summary</h2>
        <div className="space-y-4">
          <div className="bg-primary/10 rounded-xl p-6 flex gap-4">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-primary mb-2">Your Opportunity</h3>
              <p className="text-slate-700">
                Strengthen consistency in one key area at a time. Start with habits, then build abilities and skills.
              </p>
            </div>
          </div>
          <div className="bg-amber-50 rounded-xl p-6 flex gap-4">
            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 mb-2">Quick Win Challenge</h3>
              <p className="text-slate-700 mb-4">
                Choose one 5-minute leadership habit to repeat for 7 days:
              </p>
              <ul className="space-y-2">
                {quickWinItems.map((item, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <span className="w-5 h-5 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-primary rounded-2xl p-8 lg:p-10 shadow-md">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Next Steps for Your LEAP Practice</h2>
            <p className="text-white/80">Ready to strengthen your LEAP practice?</p>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          {schedulingUrl && (
            <a
              href={schedulingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary-dark/80 rounded-xl p-6 hover:bg-primary-dark transition-colors group"
            >
              <Calendar className="w-10 h-10 text-accent mb-4" />
              <h3 className="font-bold text-white mb-2">Schedule Your LEAP Strategy Call</h3>
              <p className="text-white/80 text-sm mb-4">Book a personalized 30-minute session to discuss your results</p>
              <span className="inline-flex w-8 h-8 rounded-full bg-accent items-center justify-center group-hover:scale-110 transition-transform">
                <ChevronRight className="w-4 h-4 text-white" />
              </span>
            </a>
          )}
          <button
            onClick={handleDownloadPDF}
            className="bg-primary-dark/80 rounded-xl p-6 hover:bg-primary-dark transition-colors text-left group"
          >
            <Download className="w-10 h-10 text-accent mb-4" />
            <h3 className="font-bold text-white mb-2">Download Your Personalized LEAP Practice Plan</h3>
            <p className="text-white/80 text-sm mb-4">Get your complete PDF report for reference</p>
            <span className="inline-flex w-8 h-8 rounded-full bg-accent items-center justify-center group-hover:scale-110 transition-transform">
              <ChevronRight className="w-4 h-4 text-white" />
            </span>
          </button>
          <a
            href={trainingUrl}
            className="bg-primary-dark/80 rounded-xl p-6 hover:bg-primary-dark transition-colors group block"
          >
            <BookOpen className="w-10 h-10 text-accent mb-4" />
            <h3 className="font-bold text-white mb-2">Explore LEAP Leadership Training</h3>
            <p className="text-white/80 text-sm mb-4">Discover programs designed to strengthen your practice</p>
            <span className="inline-flex w-8 h-8 rounded-full bg-accent items-center justify-center group-hover:scale-110 transition-transform">
              <ChevronRight className="w-4 h-4 text-white" />
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}

