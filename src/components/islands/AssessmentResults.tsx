import { useState, useEffect } from 'react';
import { supabaseClient } from '../../lib/supabase';
import { getUserDetails } from '../../lib/userStorage';
import { saveAssessmentData } from '../../lib/assessmentStorage';
import jsPDF from 'jspdf';
import { Download, Loader2, Calendar } from 'lucide-react';

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
  const [responseId, setResponseId] = useState<string | null>(null);

  // Extract responseId from URL on mount and track it
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    console.log('[AssessmentResults] Component mounted, responseId from URL:', id);
    setResponseId(id);
  }, []); // Run once on mount - component remounts on page refresh

  // Listen for URL changes (e.g., browser back/forward)
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      console.log('[AssessmentResults] PopState event, new responseId:', id);
      setResponseId(id);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    // Always check URL directly as fallback in case state is stale (e.g., on refresh)
    const params = new URLSearchParams(window.location.search);
    const urlResponseId = params.get('id');
    const currentResponseId = responseId || urlResponseId;

    console.log('[AssessmentResults] useEffect triggered', {
      responseIdFromState: responseId,
      responseIdFromURL: urlResponseId,
      usingResponseId: currentResponseId
    });

    if (!currentResponseId) {
      console.error('[AssessmentResults] No assessment ID provided in URL or state');
      setError('No assessment ID provided');
      setIsLoading(false);
      return;
    }

    // Reset state when responseId changes
    setIsLoading(true);
    setError(null);
    setResponse(null);

    const loadResults = async () => {
      console.log('[AssessmentResults] loadResults called for ID:', currentResponseId);
      
      const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || '';
      const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '';
      
      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('[AssessmentResults] Supabase configuration missing');
        setError('Configuration error. Please contact support.');
        setIsLoading(false);
        return;
      }
      
      const functionUrl = `${supabaseUrl}/functions/v1/get-assessment-results`;
      console.log('[AssessmentResults] Calling Edge Function:', functionUrl, 'with responseId:', currentResponseId);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn('[AssessmentResults] Request timeout triggered, aborting...');
        controller.abort();
      }, 10000); // 10 second timeout
      
      try {
        console.log('[AssessmentResults] Starting fetch request...');
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseAnonKey}`,
            apikey: supabaseAnonKey,
          },
          body: JSON.stringify({ responseId: currentResponseId }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        console.log('[AssessmentResults] Fetch response received, status:', response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('[AssessmentResults] Edge Function error response:', errorData);
          throw new Error(errorData.error || `Failed to fetch assessment results (${response.status})`);
        }

        const foundResponse = await response.json();
        console.log('[AssessmentResults] Successfully fetched response:', foundResponse?.id);

        if (!foundResponse) {
          throw new Error('Assessment response is null or undefined');
        }

        // Check if user is authenticated and if this assessment belongs to them
        const { data: { session } } = await supabaseClient.supabase.auth.getSession();
        if (session?.user && foundResponse.user_id === session.user.id) {
          // Assessment belongs to the authenticated user, save it to localStorage
          console.log('[AssessmentResults] Assessment belongs to user, saving to localStorage');
          saveAssessmentData({ responseId: foundResponse.id });
        }

        console.log('[AssessmentResults] Setting response and clearing loading state');
        setResponse(foundResponse);

        // Get user details from localStorage
        const storedUserDetails = getUserDetails();
        if (storedUserDetails.full_name || storedUserDetails.email) {
          setUserDetails(storedUserDetails);
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        console.error('[AssessmentResults] Error in fetch:', fetchError);
        
        if (fetchError.name === 'AbortError') {
          setError('Request timed out. Please try again.');
        } else {
          // Provide more specific error messages
          if (fetchError?.code === 'PGRST116' || fetchError?.status === 404) {
            setError('Assessment results not found. Please check the link and try again.');
          } else if (fetchError?.status === 406) {
            setError('Unable to load assessment results. Please contact support if this issue persists.');
          } else if (fetchError?.message?.includes('JWT')) {
            setError('Authentication error. Please refresh the page and try again.');
          } else {
            setError(fetchError?.message || 'Failed to load assessment results. Please try again.');
          }
        }
      } finally {
        console.log('[AssessmentResults] Finally block - setting isLoading to false');
        setIsLoading(false);
      }
    };

    // Always call loadResults, even if there were previous errors
    loadResults().catch((err) => {
      console.error('[AssessmentResults] Unhandled error in loadResults:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    });
  }, [responseId]); // Re-run when responseId changes

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

  const leapScores = [
    { key: 'leadership', score: response.scores?.leadership || 0 },
    { key: 'effectiveness', score: response.scores?.effectiveness || 0 },
    { key: 'accountability', score: response.scores?.accountability || 0 },
    { key: 'productivity', score: response.scores?.productivity || 0 },
  ].map((s) => ({
    ...s,
    percentage: (s.score / maxLEAPScore) * 100,
  })).sort((a, b) => b.percentage - a.percentage);

  const strongest = leapScores[0];
  const needsFocus = leapScores[leapScores.length - 1];

  const dimensionConfig: Record<string, any> = {
    leadership: {
      letter: 'L',
      title: 'Leadership',
      subtitle: 'The practice of influence',
      description: 'How you show up determines how others follow, align, and collaborate.',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      barColor: 'bg-blue-500',
    },
    effectiveness: {
      letter: 'E',
      title: 'Effectiveness',
      subtitle: 'The practice of clarity and execution',
      description: 'Great visions require effective behaviors, structure, and habits.',
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      barColor: 'bg-emerald-500',
    },
    accountability: {
      letter: 'A',
      title: 'Accountability',
      subtitle: 'The practice of ownership and trust',
      description: 'Teams rise or fall on their ability to follow through.',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      barColor: 'bg-purple-500',
    },
    productivity: {
      letter: 'P',
      title: 'Productivity',
      subtitle: 'The practice of meaningful progress',
      description: 'Not just doing more, but doing what matters most.',
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
      barColor: 'bg-amber-500',
    },
  };

  const getScoreLabel = (pct: number) => {
    if (pct >= 80) return 'Excellent';
    if (pct >= 60) return 'Strong';
    if (pct >= 40) return 'Developing';
    return 'Needs Focus';
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(118, 100, 143);
    doc.text('HATS™ Assessment Results', 20, 20);

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`${isTeam ? 'Team/Organization' : 'Individual'} Assessment`, 20, 30);

    if (userDetails) {
      doc.setFontSize(10);
      if (userDetails.full_name) doc.text(`Name: ${userDetails.full_name}`, 20, 38);
      if (userDetails.company) doc.text(`Company: ${userDetails.company}`, 20, 44);
      doc.text(`Date: ${new Date(response.created_date).toLocaleDateString()}`, 20, userDetails.company ? 50 : 44);
    }

    // LEAP Scores
    doc.setFontSize(14);
    doc.setTextColor(118, 100, 143);
    doc.text('LEAP Dimension Scores', 20, 65);

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    let yPos = 75;
    Object.entries(response.scores || {}).forEach(([dimension, score]: [string, any]) => {
      const percentage = Math.round((score / maxLEAPScore) * 100);
      doc.text(
        `${dimension.charAt(0).toUpperCase() + dimension.slice(1)}: ${score}/${maxLEAPScore} (${percentage}%)`,
        20,
        yPos
      );
      yPos += 8;
    });

    // HATS Breakdown
    yPos += 10;
    doc.setFontSize(14);
    doc.setTextColor(118, 100, 143);
    doc.text('HATS™ Category Breakdown', 20, yPos);

    yPos += 10;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Habits: ${response.habit_score || 0}/${maxHATSScore}`, 20, yPos);
    yPos += 8;
    doc.text(`Abilities: ${response.ability_score || 0}/${maxHATSScore}`, 20, yPos);
    yPos += 8;
    doc.text(`Talents: ${response.talent_score || 0}/${maxHATSScore}`, 20, yPos);
    yPos += 8;
    doc.text(`Skills: ${response.skill_score || 0}/${maxHATSScore}`, 20, yPos);

    // Key Insights
    yPos += 15;
    doc.setFontSize(14);
    doc.setTextColor(118, 100, 143);
    doc.text('Key Insights', 20, yPos);

    yPos += 10;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(
      `Strongest Area: ${strongest.key.charAt(0).toUpperCase() + strongest.key.slice(1)} (${Math.round(strongest.percentage)}%)`,
      20,
      yPos
    );
    yPos += 8;
    doc.text(
      `Growth Opportunity: ${needsFocus.key.charAt(0).toUpperCase() + needsFocus.key.slice(1)} (${Math.round(needsFocus.percentage)}%)`,
      20,
      yPos
    );

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('© LEAP Association - Excellence is a practice, not an event.', 20, 280);

    const fileName = userDetails?.full_name 
      ? `Assessment-${userDetails.full_name.replace(/\s+/g, '-')}.pdf`
      : `Assessment-${response.id}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl lg:text-5xl font-bold text-primary mb-4">
          Your Assessment Results
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          {isTeam
            ? 'Here are your team\'s practice patterns and LEAP dimension scores.'
            : 'Here are your personal practice patterns and LEAP dimension scores.'}
        </p>
      </div>

      {/* LEAP Scores */}
      <div className="grid md:grid-cols-2 gap-6">
        {leapScores.map((dimension) => {
          const config = dimensionConfig[dimension.key];
          return (
            <div
              key={dimension.key}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center flex-shrink-0`}
                >
                  <span className="text-2xl font-bold text-white">{config.letter}</span>
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg font-bold text-primary">{config.title}</h3>
                    <span className={`text-sm font-semibold ${config.textColor}`}>
                      {dimension.score}/{maxLEAPScore}
                    </span>
                  </div>
                  <p className={`text-sm ${config.textColor} font-medium mb-3`}>{config.subtitle}</p>

                  {/* Progress bar */}
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full ${config.barColor} rounded-full transition-all duration-1000`}
                      style={{ width: `${dimension.percentage}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">{config.description}</span>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${config.bgColor} ${config.textColor}`}
                    >
                      {getScoreLabel(dimension.percentage)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* HATS Breakdown */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
        <h2 className="text-2xl font-bold text-primary mb-6">HATS™ Category Breakdown</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { label: 'Habits', score: response.habit_score || 0, max: maxHATSScore },
            { label: 'Abilities', score: response.ability_score || 0, max: maxHATSScore },
            { label: 'Talents', score: response.talent_score || 0, max: maxHATSScore },
            { label: 'Skills', score: response.skill_score || 0, max: maxHATSScore },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                {item.score}/{item.max}
              </div>
              <div className="text-sm text-slate-600">{item.label}</div>
              <div className="w-full h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${(item.score / item.max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Insights */}
      <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-primary mb-6">Key Insights</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6">
            <h3 className="font-semibold text-slate-900 mb-2">Strongest Area</h3>
            <p className="text-2xl font-bold text-primary mb-2">
              {strongest.key.charAt(0).toUpperCase() + strongest.key.slice(1)}
            </p>
            <p className="text-slate-600">
              {Math.round(strongest.percentage)}% - {getScoreLabel(strongest.percentage)}
            </p>
          </div>
          <div className="bg-white rounded-xl p-6">
            <h3 className="font-semibold text-slate-900 mb-2">Growth Opportunity</h3>
            <p className="text-2xl font-bold text-primary mb-2">
              {needsFocus.key.charAt(0).toUpperCase() + needsFocus.key.slice(1)}
            </p>
            <p className="text-slate-600">
              {Math.round(needsFocus.percentage)}% - {getScoreLabel(needsFocus.percentage)}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={handleDownloadPDF}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white hover:bg-primary-dark transition-colors"
        >
          <Download className="w-5 h-5" />
          Download PDF Report
        </button>
        {(() => {
          const scheduling = isTeam ? schedulingConfig.team : schedulingConfig.individual;
          if (!scheduling.url) return null;
          
          // Build URL with user details as query params
          const url = new URL(scheduling.url);
          if (userDetails?.full_name) url.searchParams.set('name', userDetails.full_name);
          if (userDetails?.email) url.searchParams.set('email', userDetails.email);
          if (userDetails?.company) url.searchParams.set('company', userDetails.company);
          
          return (
            <a
              href={url.toString()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-primary text-primary hover:bg-primary/5 transition-colors"
            >
              <Calendar className="w-5 h-5" />
              {scheduling.buttonText}
            </a>
          );
        })()}
      </div>
    </div>
  );
}

