import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Get allowed origins from environment or use defaults
const getAllowedOrigins = (): string[] => {
  const envOrigins = Deno.env.get('ALLOWED_ORIGINS');
  if (envOrigins) {
    return envOrigins.split(',').map(origin => origin.trim());
  }
  // Default to Supabase project URL if available
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  if (supabaseUrl) {
    return [supabaseUrl];
  }
  return [];
};

const getCorsHeaders = (origin: string | null): Record<string, string> => {
  const allowedOrigins = getAllowedOrigins();
  const requestOrigin = origin || '';
  const allowedOrigin = allowedOrigins.length > 0 && allowedOrigins.includes(requestOrigin)
    ? requestOrigin
    : (allowedOrigins[0] || '*');
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
};

// Simple in-memory rate limiting (use Redis for production scale)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30; // 30 requests per window
const WINDOW_MS = 60000; // 1 minute window

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || record.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  
  if (record.count >= RATE_LIMIT) return false;
  record.count++;
  return true;
}

function getClientIP(req: Request): string {
  // Try to get real IP from various headers
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIP = req.headers.get('x-real-ip');
  if (realIP) return realIP;
  return 'unknown';
}

interface RequestBody {
  responseId: string;
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Rate limiting
  const clientIP = getClientIP(req);
  if (!checkRateLimit(clientIP)) {
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded. Please try again later.',
      }),
      {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Parse request body
    const body: RequestBody = await req.json();
    const { responseId } = body;

    if (!responseId || typeof responseId !== 'string') {
      return new Response(
        JSON.stringify({
          error: 'Assessment ID is required',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize Supabase client with service role for initial fetch
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Use service role to fetch assessment first (to check creation time)
    const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: assessment, error: assessmentError } = await serviceSupabase
      .from('assessment_responses')
      .select('*')
      .eq('id', responseId)
      .single();

    if (assessmentError || !assessment) {
      return new Response(
        JSON.stringify({
          error: 'Assessment not found',
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get authorization header to check if user is authenticated
    const authHeader = req.headers.get('authorization');
    let userId: string | null = null;
    let isAuthenticated = false;
    
    // Only try to validate JWT if authorization header is present
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        // User is authenticated - verify their token
        const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
          global: {
            headers: {
              Authorization: authHeader,
            },
          },
        });
        
        const { data: { user }, error: userError } = await userSupabase.auth.getUser();
        if (!userError && user) {
          userId = user.id;
          isAuthenticated = true;
        } else {
          // Invalid token - log but don't fail, treat as unauthenticated
          console.warn('JWT validation failed:', userError?.message);
        }
      } catch (jwtError: any) {
        // JWT validation error - treat as unauthenticated
        console.warn('JWT validation error:', jwtError?.message);
        isAuthenticated = false;
      }
    }

    // Check if assessment was created recently (within last 10 minutes)
    // This allows users to view results immediately after submission
    const createdAt = new Date(assessment.created_at);
    const now = new Date();
    const minutesSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60);
    const isRecentlyCreated = minutesSinceCreation <= 10;

    // Access control logic:
    // 1. If authenticated and owns the assessment -> allow
    // 2. If authenticated and is admin -> allow
    // 3. If not authenticated but assessment was created < 10 minutes ago -> allow (for immediate viewing)
    // 4. Otherwise -> deny
    if (isAuthenticated && userId) {
      if (assessment.user_id === userId) {
        // User owns the assessment
        return new Response(
          JSON.stringify(assessment),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      // Check if user is admin
      const { data: profile } = await serviceSupabase
        .from('user_profiles')
        .select('user_role')
        .eq('id', userId)
        .single();
      
      if (profile?.user_role === 'admin') {
        // Admin can view any assessment
        return new Response(
          JSON.stringify(assessment),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Allow access to recently created assessments (for immediate viewing after submission)
    if (!isAuthenticated && isRecentlyCreated) {
      return new Response(
        JSON.stringify(assessment),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // All other cases: deny access
    return new Response(
      JSON.stringify({
        error: 'Authentication required to view this assessment. Please log in to access your results.',
      }),
      {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        error: error?.message || 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
