import { useState, useEffect, useRef } from 'react';
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

type Tab = 'users' | 'assessments' | 'events' | 'availability' | 'content';

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
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Users state
  const [users, setUsers] = useState<any[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersSearch, setUsersSearch] = useState('');
  
  // Assessments state
  const [assessments, setAssessments] = useState<any[]>([]);
  const [assessmentsTotal, setAssessmentsTotal] = useState(0);
  const [assessmentsPage, setAssessmentsPage] = useState(1);
  const [assessmentsSearch, setAssessmentsSearch] = useState('');
  
  // Users map for assessment lookups
  const [usersMap, setUsersMap] = useState<Map<string, any>>(new Map());
  
  // Debounced search values
  const debouncedUsersSearch = useDebounce(usersSearch, 300);
  const debouncedAssessmentsSearch = useDebounce(assessmentsSearch, 300);

  useEffect(() => {
    let didAuthenticate = false;
    let isUnmounted = false;
    
    const handleAuth = (userId: string) => {
      if (didAuthenticate || isUnmounted) return;
      didAuthenticate = true;
      setCurrentUserId(userId);
      setIsAuthenticated(true);
      setIsLoading(false);
    };

    const redirectToLogin = () => {
      if (isUnmounted || didAuthenticate) return;
      window.location.href = `${buildUrl('auth/login')}?returnUrl=${buildUrl('admin')}`;
    };

    // Check localStorage for stored Supabase session
    const getStoredUserId = (): string | null => {
      try {
        const storageKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
        if (storageKey) {
          const stored = localStorage.getItem(storageKey);
          if (stored) {
            const parsed = JSON.parse(stored);
            return parsed?.user?.id || parsed?.session?.user?.id || parsed?.currentSession?.user?.id || null;
          }
        }
      } catch {
        // Ignore parse errors
      }
      return null;
    };

    // Try to get stored user ID, with retries for timing issues
    const tryAuthFromStorage = async (attempt = 0): Promise<boolean> => {
      const storedUserId = getStoredUserId();
      if (storedUserId) {
        handleAuth(storedUserId);
        return true;
      }
      // Retry a few times with small delays (localStorage might not be ready immediately)
      if (attempt < 5) {
        await new Promise(resolve => setTimeout(resolve, 100));
        return tryAuthFromStorage(attempt + 1);
      }
      return false;
    };

    // Subscribe to auth changes for sign out handling
    const { data: { subscription } } = supabaseClient.supabase.auth.onAuthStateChange((event, session) => {
      if (isUnmounted) return;
      
      if (event === 'SIGNED_OUT') {
        redirectToLogin();
        return;
      }
      
      if (session?.user) {
        handleAuth(session.user.id);
      }
    });

    // Try to authenticate from localStorage first
    tryAuthFromStorage().then(authenticated => {
      if (!authenticated && !isUnmounted) {
        // No stored session found after retries - redirect to login
        redirectToLogin();
      }
    });
    
    // Ultimate fallback: redirect after 5 seconds if still loading
    const fallbackTimeout = setTimeout(() => {
      if (!didAuthenticate && !isUnmounted) {
        redirectToLogin();
      }
    }, 5000);

    return () => {
      isUnmounted = true;
      subscription.unsubscribe();
      clearTimeout(fallbackTimeout);
    };
  }, []);

  // Load BOTH datasets on initial auth - this ensures quick tab switching
  const initialLoadDone = useRef(false);
  useEffect(() => {
    if (isAuthenticated && !initialLoadDone.current) {
      initialLoadDone.current = true;
      
      // Give Supabase a moment to initialize, then load data
      const loadDataWithDelay = async () => {
        await new Promise(resolve => setTimeout(resolve, 300));
        loadUsers(1, '');
        loadAssessments(1, '');
      };
      
      loadDataWithDelay();
    }
  }, [isAuthenticated]);

  // Load data when tab, page, or search changes (after initial load)
  useEffect(() => {
    if (isAuthenticated && initialLoadDone.current) {
      if (activeTab === 'users') {
        loadUsers(usersPage, debouncedUsersSearch);
      } else if (activeTab === 'assessments') {
        loadAssessments(assessmentsPage, debouncedAssessmentsSearch);
      }
    }
  }, [activeTab, usersPage, assessmentsPage, debouncedUsersSearch, debouncedAssessmentsSearch]);
  
  // Reset to page 1 when search changes
  useEffect(() => {
    setUsersPage(1);
  }, [debouncedUsersSearch]);
  
  useEffect(() => {
    setAssessmentsPage(1);
  }, [debouncedAssessmentsSearch]);

  const loadUsers = async (page: number, search: string, retryCount = 0) => {
    setIsLoadingData(true);
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let queryBuilder = supabaseClient.supabase
        .from('user_profiles')
        .select('*', { count: 'exact' });

      if (search.trim()) {
        queryBuilder = queryBuilder.or(`full_name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%,company.ilike.%${search.trim()}%`);
      }
      
      const { data, count, error } = await queryBuilder
        .order('created_at', { ascending: false })
        .range(from, to);

      clearTimeout(timeoutId);

      if (error) throw error;

      setUsers(data || []);
      setUsersTotal(count || 0);
    } catch (error: any) {
      clearTimeout(timeoutId);
      // Retry on error
      if (retryCount < 2) {
        setTimeout(() => loadUsers(page, search, retryCount + 1), 500);
        return;
      }
      setUsers([]);
      setUsersTotal(0);
    } finally {
      setIsLoadingData(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'user' | 'admin') => {
    try {
      await supabaseClient.supabase
        .from('user_profiles')
        .update({ user_role: newRole })
        .eq('id', userId);
      
      // Reload users
      loadUsers(usersPage, debouncedUsersSearch);
    } catch (error) {
      console.error('Failed to update user role:', error);
      alert('Failed to update user role. Please try again.');
    }
  };

  const loadAssessments = async (page: number, search: string, retryCount = 0) => {
    setIsLoadingData(true);
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    try {
      // For assessments, search by user info from user_profiles
      let allUsers: any[] | null = null;
      let matchingUserIds: string[] = [];
      
      if (search.trim()) {
        // Search user_profiles first to get matching user IDs
        const { data: usersData } = await supabaseClient.supabase
          .from('user_profiles')
          .select('*')
          .or(`full_name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%,company.ilike.%${search.trim()}%`)
          .abortSignal(controller.signal);
        
        allUsers = usersData || [];
        matchingUserIds = allUsers.map((user: any) => user.id);
        setUsersMap(new Map(allUsers.map((user: any) => [user.id, user])));
      } else if (usersMap.size === 0) {
        // No search, just load all users for lookup
        const { data: usersData } = await supabaseClient.supabase
          .from('user_profiles')
          .select('*')
          .abortSignal(controller.signal);
        allUsers = usersData || [];
        setUsersMap(new Map(allUsers.map((user: any) => [user.id, user])));
      }
      
      // Fetch assessments - if we have a search, filter by matching user IDs
      let assessmentResult;
      if (search.trim() && matchingUserIds.length > 0) {
        // Use filter to get assessments by user_id
        const from = (page - 1) * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;
        
        // Get count first
        const { count } = await supabaseClient.supabase
          .from('assessment_responses')
          .select('*', { count: 'exact', head: true })
          .in('user_id', matchingUserIds)
          .abortSignal(controller.signal);
        
        // Get paginated data
        const { data } = await supabaseClient.supabase
          .from('assessment_responses')
          .select('*')
          .in('user_id', matchingUserIds)
          .order('created_at', { ascending: false })
          .range(from, to)
          .abortSignal(controller.signal);
        
        assessmentResult = {
          data: data || [],
          total: count || 0,
        };
      } else if (search.trim() && matchingUserIds.length === 0) {
        // Search term but no matching users
        assessmentResult = { data: [], total: 0 };
      } else {
        // No search - get all assessments paginated
        assessmentResult = await supabaseClient.entities.AssessmentResponse.listPaginated({
          page,
          pageSize: ITEMS_PER_PAGE,
          orderBy: '-created_at',
        });
      }
      
      clearTimeout(timeoutId);
      
      // Use the current usersMap
      const currentUsersMap = allUsers 
        ? new Map(allUsers.map((user: any) => [user.id, user]))
        : usersMap;
      
      // Attach user info to each assessment
      const assessmentsWithUsers = assessmentResult.data.map((assessment: any) => ({
        ...assessment,
        user: assessment.user_id ? currentUsersMap.get(assessment.user_id) : null,
      }));
      
      setAssessments(assessmentsWithUsers);
      setAssessmentsTotal(assessmentResult.total);
    } catch (error: any) {
      clearTimeout(timeoutId);
      // Retry on error
      if (retryCount < 2) {
        setTimeout(() => loadAssessments(page, search, retryCount + 1), 500);
        return;
      }
      setAssessments([]);
      setAssessmentsTotal(0);
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
    if (assessment.user) {
      doc.setFontSize(14);
      doc.text(`Participant: ${assessment.user.full_name || 'N/A'}`, 20, yPos);
      yPos += 8;
      doc.setFontSize(11);
      doc.text(`Email: ${assessment.user.email}`, 20, yPos);
      yPos += 8;
      if (assessment.user.company) {
        doc.text(`Company: ${assessment.user.company}`, 20, yPos);
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
    
    const filename = assessment.user?.full_name
      ? `Assessment-${assessment.user.full_name.replace(/\s+/g, '_')}.pdf`
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

  const handleUsersPageChange = (page: number) => {
    setUsersPage(page);
  };

  const handleAssessmentsPageChange = (page: number) => {
    setAssessmentsPage(page);
  };

  const tabs = [
    { id: 'users' as Tab, label: 'Users', icon: Mail, count: usersTotal },
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
        {activeTab === 'users' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-primary">Users</h2>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, company..."
                  value={usersSearch}
                  onChange={(e) => setUsersSearch(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                />
                {usersSearch && (
                  <button
                    onClick={() => setUsersSearch('')}
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
            ) : usersTotal === 0 ? (
              <p className="text-slate-500 text-center py-8">No users yet.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Name</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Email</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Company</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Role</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Date</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4">{user.full_name || '-'}</td>
                          <td className="py-3 px-4">{user.email}</td>
                          <td className="py-3 px-4">{user.company || '-'}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              user.user_role === 'admin' 
                                ? 'bg-purple-100 text-purple-700' 
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {user.user_role || 'user'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-500">
                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                          </td>
                          <td className="py-3 px-4">
                            {user.id === currentUserId ? (
                              <span className="text-sm text-slate-400 italic" title="You cannot change your own role">
                                {user.user_role || 'user'}
                              </span>
                            ) : (
                              <select
                                value={user.user_role || 'user'}
                                onChange={(e) => updateUserRole(user.id, e.target.value as 'user' | 'admin')}
                                className="text-sm border border-slate-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-primary focus:border-primary"
                              >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                              </select>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  currentPage={usersPage}
                  totalItems={usersTotal}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={handleUsersPageChange}
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
                          {assessment.user ? (
                            <div className="mt-1">
                              <p className="text-sm font-medium text-slate-700">
                                {assessment.user.full_name || 'No name'}
                              </p>
                              <p className="text-sm text-slate-500">
                                {assessment.user.email}
                              </p>
                              {assessment.user.company && (
                                <p className="text-xs text-slate-400">
                                  {assessment.user.company}
                                </p>
                              )}
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

