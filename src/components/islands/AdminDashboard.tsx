import { useState, useEffect } from 'react';
import { supabaseClient } from '../../lib/supabase';
import { Users, Mail, FileText, Calendar, Settings, BarChart3, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';

type Tab = 'leads' | 'assessments' | 'users' | 'events' | 'availability' | 'content';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('leads');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [leads, setLeads] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, activeTab]);

  const checkAuth = async () => {
    try {
      await supabaseClient.auth.me();
      setIsAuthenticated(true);
    } catch (error) {
      window.location.href = '/auth/login?returnUrl=/admin';
    } finally {
      setIsLoading(false);
    }
  };

  const loadData = async () => {
    try {
      if (activeTab === 'leads') {
        const data = await supabaseClient.entities.Lead.list();
        setLeads(data);
      } else if (activeTab === 'assessments') {
        const data = await supabaseClient.entities.AssessmentResponse.list();
        setAssessments(data);
      } else if (activeTab === 'users') {
        const data = await supabaseClient.entities.User.list();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleDownloadPDF = async (assessment: any) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(118, 100, 143);
    doc.text('HATS™ Assessment Results', 20, 20);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Assessment ID: ${assessment.id}`, 20, 30);
    if (assessment.scores) {
      let yPos = 45;
      Object.entries(assessment.scores).forEach(([dimension, score]: [string, any]) => {
        doc.text(`${dimension}: ${score}`, 20, yPos);
        yPos += 10;
      });
    }
    doc.save(`Assessment-${assessment.id}.pdf`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const tabs = [
    { id: 'leads' as Tab, label: 'Leads', icon: Mail, count: leads.length },
    { id: 'assessments' as Tab, label: 'Assessments', icon: FileText, count: assessments.length },
    { id: 'users' as Tab, label: 'Users', icon: Users, count: users.length },
    { id: 'events' as Tab, label: 'Events', icon: Calendar, count: 0 },
    { id: 'availability' as Tab, label: 'Availability', icon: Calendar, count: 0 },
    { id: 'content' as Tab, label: 'Content', icon: Settings, count: 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-2 flex gap-2 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-primary text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id ? 'bg-white/20' : 'bg-slate-200'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        {activeTab === 'leads' && (
          <div>
            <h2 className="text-2xl font-bold text-primary mb-6">Leads</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Company</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Source</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">{lead.full_name}</td>
                      <td className="py-3 px-4">{lead.email}</td>
                      <td className="py-3 px-4">{lead.company || '-'}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                          {lead.source}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-500">
                        {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'assessments' && (
          <div>
            <h2 className="text-2xl font-bold text-primary mb-6">Assessments</h2>
            <div className="space-y-4">
              {assessments.map((assessment) => (
                <div
                  key={assessment.id}
                  className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {assessment.assessment_type === 'team' ? 'Team' : 'Individual'} Assessment
                      </h3>
                      <p className="text-sm text-slate-500">
                        {assessment.created_at
                          ? new Date(assessment.created_at).toLocaleDateString()
                          : 'Unknown date'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDownloadPDF(assessment)}
                      className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors"
                    >
                      Download PDF
                    </button>
                  </div>
                  {assessment.scores && (
                    <div className="grid grid-cols-4 gap-4">
                      {Object.entries(assessment.scores).map(([dimension, score]: [string, any]) => (
                        <div key={dimension} className="text-center">
                          <div className="text-2xl font-bold text-primary">{score}</div>
                          <div className="text-xs text-slate-600 capitalize">{dimension}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <h2 className="text-2xl font-bold text-primary mb-6">Users</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Role</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">{user.full_name || '-'}</td>
                      <td className="py-3 px-4">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                          {user.role || 'user'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-500">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div>
            <h2 className="text-2xl font-bold text-primary mb-6">Event Registrations</h2>
            <p className="text-slate-600">Event management coming soon...</p>
          </div>
        )}

        {activeTab === 'availability' && (
          <div>
            <h2 className="text-2xl font-bold text-primary mb-6">Availability Management</h2>
            <p className="text-slate-600">Availability management coming soon...</p>
          </div>
        )}

        {activeTab === 'content' && (
          <div>
            <h2 className="text-2xl font-bold text-primary mb-6">Content Management</h2>
            <p className="text-slate-600">Content management via Sanity Studio coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}

