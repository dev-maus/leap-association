import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to convert entity names to table names
const entityToTable = (entityName: string): string => {
  const mapping: Record<string, string> = {
    'Lead': 'leads',
    'User': 'users',
    'AssessmentResponse': 'assessment_responses',
    'Availability': 'availability',
    'LEAPLunchRegistration': 'leap_lunch_registrations',
    'LEAPLunchSession': 'leap_lunch_sessions',
    'SignatureEventRegistration': 'signature_event_registrations',
    'SignatureEventSession': 'signature_event_sessions',
    'BlogPost': 'blog_posts',
    'Video': 'videos',
    'Download': 'downloads',
    'Book': 'books',
    'SiteContent': 'site_content',
    'Testimonial': 'testimonials',
  };
  return mapping[entityName] || entityName.toLowerCase() + 's';
};

// Create entity API that mimics Base44's API
function createEntityAPI(tableName: string) {
  return {
    async list(orderBy: string | null = null, limit: number | null = null) {
      let query = supabase.from(tableName).select('*');

      if (orderBy) {
        const [column, direction] = orderBy.startsWith('-')
          ? [orderBy.slice(1), 'desc']
          : [orderBy, 'asc'];
        query = query.order(column, { ascending: direction === 'asc' });
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    async filter(filters: any = {}, orderBy: string | null = null, limit: number | null = null) {
      let query = supabase.from(tableName).select('*');

      // Handle case where filters might be an object or the first arg might be orderBy
      if (typeof filters === 'string') {
        limit = orderBy as any;
        orderBy = filters;
        filters = {};
      }

      // Apply filters
      if (filters && typeof filters === 'object') {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      if (orderBy) {
        const [column, direction] = orderBy.startsWith('-')
          ? [orderBy.slice(1), 'desc']
          : [orderBy, 'asc'];
        query = query.order(column, { ascending: direction === 'asc' });
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    async get(id: string) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },

    async create(record: any) {
      const { data, error } = await supabase
        .from(tableName)
        .insert(record)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async update(id: string, updates: any) {
      const { data, error } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async delete(id: string) {
      const { data, error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  };
}

// Export entities
export const entities = {
  Lead: createEntityAPI('leads'),
  User: createEntityAPI('users'),
  AssessmentResponse: createEntityAPI('assessment_responses'),
  Availability: createEntityAPI('availability'),
  LEAPLunchRegistration: createEntityAPI('leap_lunch_registrations'),
  LEAPLunchSession: createEntityAPI('leap_lunch_sessions'),
  SignatureEventRegistration: createEntityAPI('signature_event_registrations'),
  SignatureEventSession: createEntityAPI('signature_event_sessions'),
  BlogPost: createEntityAPI('blog_posts'),
  Video: createEntityAPI('videos'),
  Download: createEntityAPI('downloads'),
  Book: createEntityAPI('books'),
  SiteContent: createEntityAPI('site_content'),
  Testimonial: createEntityAPI('testimonials'),
};

// Auth API
export const auth = {
  async me() {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (!session || sessionError) {
      const authError = new Error('Not authenticated');
      (authError as any).status = 401;
      (authError as any).name = 'AuthSessionMissingError';
      throw authError;
    }

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      const authError = new Error('Not authenticated');
      (authError as any).status = 401;
      (authError as any).name = 'AuthSessionMissingError';
      throw authError;
    }

    // Return user info from Supabase Auth (no separate users table)
    return {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
      role: user.user_metadata?.role || 'admin',
    };
  },

  async logout(redirectUrl: string | null = null) {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  },

  redirectToLogin(returnUrl: string | null = null) {
    const base = import.meta.env.BASE_URL;
    const loginUrl = `${base}auth/login`;
    const url = returnUrl ? `${loginUrl}?returnUrl=${encodeURIComponent(returnUrl)}` : loginUrl;
    if (typeof window !== 'undefined') {
      window.location.href = url;
    }
  },

  async signInWithPassword(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  async signUp(email: string, password: string, metadata: any = {}) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) throw error;
    return data;
  },
};

// Assessment submission with captcha verification
async function submitAssessmentWithCaptcha(data: {
  contactData: {
    full_name: string;
    email: string;
    company?: string;
    role?: string;
    phone?: string;
    source: string;
  };
  leadId?: string;
  assessmentType: 'individual' | 'team';
  scores: {
    leadership: number;
    effectiveness: number;
    accountability: number;
    productivity: number;
  };
  habitScore: number;
  abilityScore: number;
  talentScore: number;
  skillScore: number;
  answers: Array<{
    question_id: string;
    category?: string;
    score: number;
    question_text?: string;
  }>;
  captchaToken: string;
}) {
  const functionUrl = `${supabaseUrl}/functions/v1/verify-captcha-and-create`;

  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    // Create error object with all details
    const errorObj: any = new Error(error.error || error.message || 'Failed to submit assessment');
    errorObj.error = error.error;
    errorObj.message = error.message;
    errorObj.details = error.details;
    throw errorObj;
  }

  return await response.json();
}

// Export Supabase client wrapper
export const supabaseClient = {
  supabase,
  entities,
  auth,
  submitAssessmentWithCaptcha,
};

