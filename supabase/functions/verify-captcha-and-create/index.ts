import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const NOTIFICATION_EMAIL = 'support@leapassociation.com';
const NOTIFICATION_FROM = 'LEAP Assessment <<notifications@leapassociation.com>>';

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
const RATE_LIMIT = 20; // 20 requests per window (higher for assessment submissions)
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
  contactData: {
    full_name: string;
    email: string;
    company?: string;
    role?: string;
    phone?: string;
    source: string;
  };
  userId?: string; // Authenticated user ID
  assessmentType: 'individual' | 'team' | 'leadership';
  scores: Record<string, number>;
  habitScore: number;
  abilityScore: number;
  talentScore: number;
  skillScore: number;
  answers: Array<{
    question_id: string;
    category?: string;
    score: number;
    question_text?: string;
    response_label?: string;
  }>;
  captchaToken?: string; // Optional - if not provided or empty, captcha verification is skipped
}

// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

/**
 * Verifies hCaptcha token. Returns an error Response if verification fails, or null if valid.
 */
async function verifyCaptcha(token: string, corsHeaders: Record<string, string>): Promise<Response | null> {
  const hcaptchaSecretKey = Deno.env.get('HCAPTCHA_SECRET_KEY');
  if (!hcaptchaSecretKey) {
    throw new Error('HCAPTCHA_SECRET_KEY not configured');
  }

  const verifyResponse = await fetch('https://hcaptcha.com/siteverify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      secret: hcaptchaSecretKey,
      response: token,
    }),
  });

  const verifyResult = await verifyResponse.json();

  if (!verifyResult.success) {
    return new Response(
      JSON.stringify({
        error: 'Captcha verification failed',
        details: verifyResult['error-codes'] || [],
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  return null;
}

/**
 * Finds an existing user or creates a new one. Returns the final userId.
 */
async function resolveOrCreateUser(
  supabase: SupabaseClient,
  contactData: RequestBody['contactData'],
  userId?: string,
): Promise<string> {
  if (userId) {
    // Verify authenticated user exists
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !user) {
      throw new Error(`User not found: ${userError?.message}`);
    }

    // Update user profile if it exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (existingProfile) {
      await supabase
        .from('user_profiles')
        .update({
          full_name: contactData.full_name,
          company: contactData.company,
          role: contactData.role,
          phone: contactData.phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
    }

    return userId;
  }

  // No user_id provided - check if user exists by email
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existingUser = existingUsers?.users.find(
    (u: { email: string }) => u.email === contactData.email,
  );

  if (existingUser) {
    await supabase
      .from('user_profiles')
      .upsert({
        id: existingUser.id,
        email: contactData.email,
        full_name: contactData.full_name,
        company: contactData.company,
        role: contactData.role,
        phone: contactData.phone,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      });

    return existingUser.id;
  }

  // Create new auth user (first-time user)
  const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
    email: contactData.email,
    email_confirm: true,
    user_metadata: {
      full_name: contactData.full_name,
      company: contactData.company,
      role: contactData.role,
    },
  });

  if (createUserError || !newUser.user) {
    throw new Error(`Failed to create user: ${createUserError?.message}`);
  }

  await supabase
    .from('user_profiles')
    .upsert({
      id: newUser.user.id,
      email: contactData.email,
      full_name: contactData.full_name,
      company: contactData.company,
      role: contactData.role,
      phone: contactData.phone,
      user_role: 'user',
    }, {
      onConflict: 'id'
    });

  return newUser.user.id;
}

/**
 * Inserts an assessment row and returns the response. Throws on error.
 */
// deno-lint-ignore no-explicit-any
async function createAssessment(supabase: SupabaseClient, userId: string, body: RequestBody): Promise<any> {
  const { data: response, error: responseError } = await supabase
    .from('assessment_responses')
    .insert({
      user_id: userId,
      assessment_type: body.assessmentType,
      scores: body.scores,
      habit_score: body.habitScore,
      ability_score: body.abilityScore,
      talent_score: body.talentScore,
      skill_score: body.skillScore,
      answers: body.answers,
    })
    .select()
    .single();

  if (responseError) {
    throw new Error(`Failed to create assessment response: ${responseError.message}`);
  }

  return response;
}

/**
 * Sends a fire-and-forget email notification to the support team via Resend.
 */
// deno-lint-ignore no-explicit-any
function sendNotificationEmail(body: RequestBody, response: any): void {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (!resendApiKey) return;

  const s = body.scores;
  const isLeadership = body.assessmentType === 'leadership';
  const leapTotal = !isLeadership
    ? (s.leadership ?? 0) + (s.effectiveness ?? 0) + (s.accountability ?? 0) + (s.productivity ?? 0)
    : 0;

  const scoresHtml = isLeadership
    ? `
        <h3>Leadership Role Scorecard</h3>
        <ul>
          <li><strong>Role clarity:</strong> ${s.roleClarity ?? 'N/A'}</li>
          <li><strong>Leadership expectations:</strong> ${s.leadershipExpectations ?? 'N/A'}</li>
          <li><strong>Performance measurement:</strong> ${s.performanceMeasurement ?? 'N/A'}</li>
          <li><strong>Support & resources:</strong> ${s.supportResources ?? 'N/A'}</li>
          <li><strong>Total:</strong> ${s.total ?? 'N/A'} / 100</li>
        </ul>
        <h3>Section totals (mapped columns)</h3>
        <ul>
          <li><strong>S1–S4:</strong> ${body.habitScore}, ${body.abilityScore}, ${body.talentScore}, ${body.skillScore}</li>
        </ul>
      `
    : `
        <h3>LEAP Scores</h3>
        <ul>
          <li><strong>Leadership:</strong> ${s.leadership}</li>
          <li><strong>Effectiveness:</strong> ${s.effectiveness}</li>
          <li><strong>Accountability:</strong> ${s.accountability}</li>
          <li><strong>Productivity:</strong> ${s.productivity}</li>
          <li><strong>Total:</strong> ${leapTotal}</li>
        </ul>
        <h3>HATS Scores</h3>
        <ul>
          <li><strong>Habit:</strong> ${body.habitScore}</li>
          <li><strong>Ability:</strong> ${body.abilityScore}</li>
          <li><strong>Talent:</strong> ${body.talentScore}</li>
          <li><strong>Skill:</strong> ${body.skillScore}</li>
        </ul>
      `;

  fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: NOTIFICATION_FROM,
      to: [NOTIFICATION_EMAIL],
      subject: `New ${body.assessmentType} assessment completed by ${body.contactData.full_name}`,
      html: `
        <h2>New Assessment Completed</h2>
        <h3>Contact Information</h3>
        <ul>
          <li><strong>Name:</strong> ${body.contactData.full_name}</li>
          <li><strong>Email:</strong> ${body.contactData.email}</li>
          <li><strong>Company:</strong> ${body.contactData.company || 'N/A'}</li>
          <li><strong>Role:</strong> ${body.contactData.role || 'N/A'}</li>
          <li><strong>Phone:</strong> ${body.contactData.phone || 'N/A'}</li>
        </ul>
        <h3>Assessment Details</h3>
        <ul>
          <li><strong>Type:</strong> ${body.assessmentType}</li>
          <li><strong>Assessment ID:</strong> ${response.id}</li>
          <li><strong>Timestamp:</strong> ${response.created_at}</li>
        </ul>
        ${scoresHtml}
      `,
    }),
  }).catch((err) => {
    console.error('Failed to send assessment notification email:', err);
  });
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
    const body: RequestBody = await req.json();

    // Require captcha for unauthenticated submissions
    if (!body.userId && (!body.captchaToken || body.captchaToken.trim() === '')) {
      return new Response(
        JSON.stringify({ error: 'Captcha verification required for unauthenticated submissions' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify hCaptcha token if provided
    if (body.captchaToken && body.captchaToken.trim() !== '') {
      const captchaError = await verifyCaptcha(body.captchaToken, corsHeaders);
      if (captchaError) return captchaError;
    }

    // Initialize Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const finalUserId = await resolveOrCreateUser(supabase, body.contactData, body.userId);
    const response = await createAssessment(supabase, finalUserId, body);
    sendNotificationEmail(body, response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
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

