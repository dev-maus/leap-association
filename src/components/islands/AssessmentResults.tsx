import { useState, useEffect } from 'react';
import { supabaseClient } from '../../lib/supabase';
import { buildUrl } from '../../lib/utils';
import jsPDF from 'jspdf';
import { Download, Loader2 } from 'lucide-react';

export default function AssessmentResults() {
  const [response, setResponse] = useState<any>(null);
  const [lead, setLead] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const responseId = params.get('id');

    if (!responseId) {
      setError('No assessment ID provided');
      setIsLoading(false);
      return;
    }

    const loadResults = async () => {
      try {
        const foundResponse = await supabaseClient.entities.AssessmentResponse.get(responseId);
        setResponse(foundResponse);

        if (foundResponse.lead_id) {
          const foundLead = await supabaseClient.entities.Lead.get(foundResponse.lead_id);
          setLead(foundLead);
        }
      } catch (err) {
        console.error('Error loading results:', err);
        setError('Failed to load assessment results');
      } finally {
        setIsLoading(false);
      }
    };

    loadResults();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !response) {
    return <div className="text-center py-20">{error || 'Assessment results not found.'}</div>;
  }

  const isTeam = response.assessment_type === 'team';
  const maxLEAPScore = isTeam ? 30 : 20;
  const maxHATSScore = isTeam ? 15 : 10;

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

    if (lead) {
      doc.setFontSize(10);
      doc.text(`Name: ${lead.full_name}`, 20, 38);
      if (lead.company) doc.text(`Company: ${lead.company}`, 20, 44);
      doc.text(`Date: ${new Date(response.created_date).toLocaleDateString()}`, 20, 50);
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

    doc.save(`Assessment-${lead?.full_name?.replace(/\s+/g, '-') || responseId}.pdf`);
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
        <a
          href={buildUrl('practice/team-debrief')}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-primary text-primary hover:bg-primary/5 transition-colors"
        >
          Schedule Team Debrief
        </a>
      </div>
    </div>
  );
}

