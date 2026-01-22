import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '';

// Use Supabase's default configuration - follows their best practices
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true, // Enable token refresh for better UX
    detectSessionInUrl: true, // Automatically detect and handle auth callbacks
  },
});

// Helper function to convert entity names to table names
const entityToTable = (entityName: string): string => {
  const mapping: Record<string, string> = {
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

// Generate UUID v4 client-side using cryptographically secure random generation
function generateUUID(): string {
  // Use crypto.randomUUID if available (modern browsers and Node.js 16+)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback with crypto.getRandomValues for older environments
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    // Set version (4) and variant bits according to RFC 4122
    arr[6] = (arr[6] & 0x0f) | 0x40; // Version 4
    arr[8] = (arr[8] & 0x3f) | 0x80; // Variant 10
    return [...arr].map((b, i) => 
      (i === 4 || i === 6 || i === 8 || i === 10 ? '-' : '') + 
      b.toString(16).padStart(2, '0')
    ).join('');
  }
  
  // Last resort fallback (should not be reached in modern environments)
  throw new Error('Cryptographically secure random number generation not available');
}

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

    async listPaginated(options: {
      page?: number;
      pageSize?: number;
      orderBy?: string | null;
      search?: string;
      searchColumns?: string[];
    } = {}) {
      const { page = 1, pageSize = 10, orderBy = null, search = '', searchColumns = [] } = options;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Build search filter if search term provided
      const applySearch = (query: any) => {
        if (search && searchColumns.length > 0) {
          // Use ilike for case-insensitive partial matching
          // Build OR condition for multiple columns
          const searchPattern = `%${search}%`;
          const orConditions = searchColumns.map(col => `${col}.ilike.${searchPattern}`).join(',');
          return query.or(orConditions);
        }
        return query;
      };

      // Get count and data in parallel
      let countQuery = supabase.from(tableName).select('*', { count: 'exact', head: true });
      let dataQuery = supabase.from(tableName).select('*');

      // Apply search to both queries
      countQuery = applySearch(countQuery);
      dataQuery = applySearch(dataQuery);

      if (orderBy) {
        const [column, direction] = orderBy.startsWith('-')
          ? [orderBy.slice(1), 'desc']
          : [orderBy, 'asc'];
        dataQuery = dataQuery.order(column, { ascending: direction === 'asc' });
      }

      dataQuery = dataQuery.range(from, to);

      const [countResult, dataResult] = await Promise.all([countQuery, dataQuery]);

      if (countResult.error) throw countResult.error;
      if (dataResult.error) throw dataResult.error;

      return {
        data: dataResult.data || [],
        total: countResult.count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((countResult.count || 0) / pageSize),
      };
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
      // Try maybeSingle first (handles 406 better in some cases)
      let { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .maybeSingle();

      // If we get a 406 error, try without maybeSingle as fallback
      if (error && ((error as any).status === 406 || error.message?.includes('406'))) {
        console.warn(`Received 406 error, trying alternative query method for ${tableName}`);
        const fallbackQuery = await supabase
          .from(tableName)
          .select('*')
          .eq('id', id)
          .limit(1);
        
        if (fallbackQuery.error) {
          error = fallbackQuery.error;
        } else {
          data = fallbackQuery.data?.[0] || null;
          error = null;
        }
      }

      if (error) {
        // Log detailed error for debugging
        console.error(`Error fetching ${tableName} with id ${id}:`, {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          status: (error as any).status,
        });
        throw error;
      }
      
      if (!data) {
        const notFoundError = new Error(`${tableName} with id ${id} not found`);
        (notFoundError as any).code = 'PGRST116';
        (notFoundError as any).status = 404;
        throw notFoundError;
      }
      
      return data;
    },

    async create(record: any) {
      // Generate ID client-side to avoid needing to read back after insert
      const id = record.id || generateUUID();
      const recordWithId = { ...record, id };

      const { error } = await supabase
        .from(tableName)
        .insert(recordWithId);

      if (error) throw error;
      return recordWithId;
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
  User: createEntityAPI('users'),
  UserProfile: createEntityAPI('user_profiles'),
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

    // Try to get user profile from user_profiles table
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Return user info from profile if available, otherwise from auth metadata
    return {
      id: user.id,
      email: profile?.email || user.email || '',
      full_name: profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || '',
      role: profile?.user_role || user.user_metadata?.role || 'user',
      company: profile?.company,
      phone: profile?.phone,
    };
  },

  async logout(redirectUrl: string | null = null) {
    // Clear localStorage
    if (typeof window !== 'undefined') {
      const { clearUserDetails } = await import('./userStorage');
      const { clearAssessmentData } = await import('./assessmentStorage');
      clearUserDetails();
      clearAssessmentData();
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  },

  async signOut(redirectUrl: string | null = null) {
    // Alias for logout for consistency
    return this.logout(redirectUrl);
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

  async signInWithMagicLink(email: string, redirectTo?: string) {
    // Always use window.location.origin when available (browser context)
    // This ensures we use the actual current URL, not a potentially stale env var
    const siteUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : (import.meta.env.PUBLIC_SITE_URL || '');
    const baseUrl = import.meta.env.BASE_URL || '/';
    
    // Ensure baseUrl ends with a slash for proper path joining
    const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    
    // Construct the callback URL with the next parameter
    // The next parameter tells AuthCallback where to redirect after authentication
    let callbackUrl = `${siteUrl}${normalizedBaseUrl}auth/callback`;
    if (redirectTo) {
      // Ensure redirectTo starts with a slash
      const cleanRedirectTo = redirectTo.startsWith('/') ? redirectTo : `/${redirectTo}`;
      callbackUrl += `?next=${encodeURIComponent(cleanRedirectTo)}`;
    }

    if (import.meta.env.DEV) {
      console.log('Magic Link redirect URL:', callbackUrl);
    }

    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: callbackUrl,
        },
      });

      if (error) {
        console.error('Magic Link error:', error);
        throw error;
      }
      
      if (import.meta.env.DEV) {
        console.log('Magic Link sent successfully:', data);
      }
      return data;
    } catch (err: any) {
      console.error('Failed to send Magic Link:', err);
      throw err;
    }
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
  userId?: string; // Authenticated user ID
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
  // Validate configuration before making request
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase configuration is missing. Please ensure PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY are set.'
    );
  }

  const functionUrl = `${supabaseUrl}/functions/v1/verify-captcha-and-create`;

  // Add timeout to prevent hanging
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseAnonKey}`,
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify(data),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json();
      const errorObj: any = new Error(error.error || error.message || 'Failed to submit assessment');
      errorObj.error = error.error;
      errorObj.message = error.message;
      errorObj.details = error.details;
      throw errorObj;
    }

    return await response.json();
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw err;
  }
}

// Check if user exists by email
async function checkUserExists(email: string): Promise<{ exists: boolean; userId: string | null }> {
  // Validate configuration before making request
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase configuration is missing. Please ensure PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY are set.'
    );
  }

  const functionUrl = `${supabaseUrl}/functions/v1/check-user-exists`;

  // Add timeout to prevent hanging
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseAnonKey}`,
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify({ email }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json();
      const errorObj: any = new Error(error.error || error.message || 'Failed to check user existence');
      errorObj.error = error.error;
      errorObj.message = error.message;
      throw errorObj;
    }

    const result = await response.json();
    
    // Validate response structure
    if (typeof result !== 'object' || result === null) {
      throw new Error('Invalid response format from check-user-exists');
    }
    
    // Ensure exists is a boolean
    const exists = Boolean(result.exists);
    const userId = result.userId || null;
    
    return { exists, userId };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw err;
  }
}

// Export Supabase client wrapper
export const supabaseClient = {
  supabase,
  entities,
  auth,
  submitAssessmentWithCaptcha,
  checkUserExists,
};

