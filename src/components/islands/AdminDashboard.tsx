import { useState, useEffect, useCallback } from 'react';
import { supabaseClient } from '../../lib/supabase';
import { buildUrl } from '../../lib/utils';
import { Mail, FileText, Calendar, Settings, Loader2, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import jsPDF from 'jspdf';

// Debounce hook for search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

type Tab = 'leads' | 'assessments' | 'events' | 'availability' | 'content';

const ITEMS_PER_PAGE = 10;

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

function Pagination({ currentPage, totalItems, itemsPerPage, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  if (totalPages <= 1) return null;
  
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  
  return (
    <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
      <p className="text-sm text-slate-600">
        Showing {startItem}-{endItem} of {totalItems}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
            // Show first, last, current, and adjacent pages
            const showPage = page === 1 || 
                            page === totalPages || 
                            Math.abs(page - currentPage) <= 1;
            const showEllipsis = page === 2 && currentPage > 3 || 
                                page === totalPages - 1 && currentPage < totalPages - 2;
            
            if (showEllipsis && !showPage) {
              return <span key={page} className="px-2 text-slate-400">...</span>;
            }
            
            if (!showPage) return null;
            
            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  page === currentPage
                    ? 'bg-primary text-white'
                    : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('leads');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  // Leads state
  const [leads, setLeads] = useState<any[]>([]);
  const [leadsTotal, setLeadsTotal] = useState(0);
  const [leadsPage, setLeadsPage] = useState(1);
  const [leadsSearch, setLeadsSearch] = useState('');
  
  // Assessments state
  const [assessments, setAssessments] = useState<any[]>([]);
  const [assessmentsTotal, setAssessmentsTotal] = useState(0);
  const [assessmentsPage, setAssessmentsPage] = useState(1);
  const [assessmentsSearch, setAssessmentsSearch] = useState('');
  
  // Leads map for assessment lookups
  const [leadsMap, setLeadsMap] = useState<Map<string, any>>(new Map());
  
  // Debounced search values
  const debouncedLeadsSearch = useDebounce(leadsSearch, 300);
  const debouncedAssessmentsSearch = useDebounce(assessmentsSearch, 300);

  useEffect(() => {
    checkAuth();
  }, []);

  // Load data when tab, page, or search changes
  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === 'leads') {
        loadLeads(leadsPage, debouncedLeadsSearch);
      } else if (activeTab === 'assessments') {
        loadAssessments(assessmentsPage, debouncedAssessmentsSearch);
      }
    }
  }, [isAuthenticated, activeTab, leadsPage, assessmentsPage, debouncedLeadsSearch, debouncedAssessmentsSearch]);
  
  // Reset to page 1 when search changes
  useEffect(() => {
    setLeadsPage(1);
  }, [debouncedLeadsSearch]);
  
  useEffect(() => {
    setAssessmentsPage(1);
  }, [debouncedAssessmentsSearch]);

  const checkAuth = async () => {
    try {
      await supabaseClient.auth.me();
      setIsAuthenticated(true);
    } catch (error) {
      window.location.href = `${buildUrl('auth/login')}?returnUrl=${buildUrl('admin')}`;
    } finally {
      setIsLoading(false);
    }
  };

  const loadLeads = async (page: number, search: string) => {
    setIsLoadingData(true);
    try {
      const result = await supabaseClient.entities.Lead.listPaginated({
        page,
        pageSize: ITEMS_PER_PAGE,
        orderBy: '-created_at',
        search: search.trim(),
        searchColumns: ['full_name', 'email', 'company'],
      });
      setLeads(result.data);
      setLeadsTotal(result.total);
    } catch (error) {
      console.error('Failed to load leads:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadAssessments = async (page: number, search: string) => {
    setIsLoadingData(true);
    try {
      // For assessments, we need to search by lead info
      // First fetch all leads that match the search (for lookup), then filter assessments
      let allLeads: any[] | null = null;
      let matchingLeadIds: string[] = [];
      
      if (search.trim()) {
        // Search leads first to get matching IDs
        const leadsResult = await supabaseClient.entities.Lead.listPaginated({
          page: 1,
          pageSize: 1000, // Get all matching leads
          search: search.trim(),
          searchColumns: ['full_name', 'email', 'company'],
        });
        allLeads = leadsResult.data;
        matchingLeadIds = leadsResult.data.map((lead: any) => lead.id);
        setLeadsMap(new Map(leadsResult.data.map((lead: any) => [lead.id, lead])));
      } else if (leadsMap.size === 0) {
        // No search, just load all leads for lookup
        allLeads = await supabaseClient.entities.Lead.list();
        setLeadsMap(new Map(allLeads.map((lead: any) => [lead.id, lead])));
      }
      
      // Fetch assessments - if we have a search, filter by matching lead IDs
      let assessmentResult;
      if (search.trim() && matchingLeadIds.length > 0) {
        // Use filter to get assessments by lead_id
        const from = (page - 1) * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;
        
        // Get count first
        const { count } = await supabaseClient.supabase
          .from('assessment_responses')
          .select('*', { count: 'exact', head: true })
          .in('lead_id', matchingLeadIds);
        
        // Get paginated data
        const { data } = await supabaseClient.supabase
          .from('assessment_responses')
          .select('*')
          .in('lead_id', matchingLeadIds)
          .order('created_at', { ascending: false })
          .range(from, to);
        
        assessmentResult = {
          data: data || [],
          total: count || 0,
        };
      } else if (search.trim() && matchingLeadIds.length === 0) {
        // Search term but no matching leads
        assessmentResult = { data: [], total: 0 };
      } else {
        // No search - get all assessments paginated
        assessmentResult = await supabaseClient.entities.AssessmentResponse.listPaginated({
          page,
          pageSize: ITEMS_PER_PAGE,
          orderBy: '-created_at',
        });
      }
      
      // Use the current leadsMap
      const currentLeadsMap = allLeads 
        ? new Map(allLeads.map((lead: any) => [lead.id, lead]))
        : leadsMap;
      
      // Attach lead info to each assessment
      const assessmentsWithLeads = assessmentResult.data.map((assessment: any) => ({
        ...assessment,
        lead: assessment.lead_id ? currentLeadsMap.get(assessment.lead_id) : null,
      }));
      
      setAssessments(assessmentsWithLeads);
      setAssessmentsTotal(assessmentResult.total);
    } catch (error) {
      console.error('Failed to load assessments:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleDownloadPDF = async (assessment: any) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(118, 100, 143);
    doc.text('HATS™ Assessment Results', 20, 20);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    
    let yPos = 35;
    
    // Add participant info if available
    if (assessment.lead) {
      doc.setFontSize(14);
      doc.text(`Participant: ${assessment.lead.full_name}`, 20, yPos);
      yPos += 8;
      doc.setFontSize(11);
      doc.text(`Email: ${assessment.lead.email}`, 20, yPos);
      yPos += 8;
      if (assessment.lead.company) {
        doc.text(`Company: ${assessment.lead.company}`, 20, yPos);
        yPos += 8;
      }
      yPos += 5;
    }
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Assessment Type: ${assessment.assessment_type === 'team' ? 'Team' : 'Individual'}`, 20, yPos);
    yPos += 6;
    doc.text(`Date: ${assessment.created_at ? new Date(assessment.created_at).toLocaleDateString() : 'N/A'}`, 20, yPos);
    yPos += 12;
    
    doc.setTextColor(0, 0, 0);
    if (assessment.scores) {
      doc.setFontSize(14);
      doc.text('Scores:', 20, yPos);
      yPos += 10;
      doc.setFontSize(12);
      Object.entries(assessment.scores).forEach(([dimension, score]: [string, any]) => {
        doc.text(`${dimension.charAt(0).toUpperCase() + dimension.slice(1)}: ${score}`, 25, yPos);
        yPos += 8;
      });
    }
    
    const filename = assessment.lead 
      ? `Assessment-${assessment.lead.full_name.replace(/\s+/g, '_')}.pdf`
      : `Assessment-${assessment.id}.pdf`;
    doc.save(filename);
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

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
  };

  const handleLeadsPageChange = (page: number) => {
    setLeadsPage(page);
  };

  const handleAssessmentsPageChange = (page: number) => {
    setAssessmentsPage(page);
  };

  const tabs = [
    { id: 'leads' as Tab, label: 'Leads', icon: Mail, count: leadsTotal },
    { id: 'assessments' as Tab, label: 'Assessments', icon: FileText, count: assessmentsTotal },
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
              onClick={() => handleTabChange(tab.id)}
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-primary">Leads</h2>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, company..."
                  value={leadsSearch}
                  onChange={(e) => setLeadsSearch(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                />
                {leadsSearch && (
                  <button
                    onClick={() => setLeadsSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            {isLoadingData ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : leadsTotal === 0 ? (
              <p className="text-slate-500 text-center py-8">No leads yet.</p>
            ) : (
              <>
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
                <Pagination
                  currentPage={leadsPage}
                  totalItems={leadsTotal}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={handleLeadsPageChange}
                />
              </>
            )}
          </div>
        )}

        {activeTab === 'assessments' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-primary">Assessments</h2>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, company..."
                  value={assessmentsSearch}
                  onChange={(e) => setAssessmentsSearch(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                />
                {assessmentsSearch && (
                  <button
                    onClick={() => setAssessmentsSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            {isLoadingData ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : assessmentsTotal === 0 ? (
              <p className="text-slate-500 text-center py-8">No assessments yet.</p>
            ) : (
              <>
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
                          {assessment.lead ? (
                            <div className="mt-1">
                              <p className="text-sm font-medium text-slate-700">
                                {assessment.lead.full_name}
                              </p>
                              <p className="text-sm text-slate-500">
                                {assessment.lead.email}
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm text-slate-400 italic mt-1">No contact info</p>
                          )}
                          <p className="text-xs text-slate-400 mt-1">
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
                <Pagination
                  currentPage={assessmentsPage}
                  totalItems={assessmentsTotal}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={handleAssessmentsPageChange}
                />
              </>
            )}
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

