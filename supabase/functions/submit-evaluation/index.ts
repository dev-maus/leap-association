import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const NOTIFICATION_EMAIL = 'support@leapassociation.com';
const NOTIFICATION_FROM = 'LEAP Association <<notifications@leapassociation.com>>';

const getAllowedOrigins = (): string[] => {
  const envOrigins = Deno.env.get('ALLOWED_ORIGINS');
  if (envOrigins) {
    return envOrigins.split(',').map((o) => o.trim());
  }
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  return supabaseUrl ? [supabaseUrl] : [];
};

const getCorsHeaders = (origin: string | null): Record<string, string> => {
  const allowedOrigins = getAllowedOrigins();
  const requestOrigin = origin || '';
  const allowedOrigin =
    allowedOrigins.length > 0 && allowedOrigins.includes(requestOrigin)
      ? requestOrigin
      : allowedOrigins[0] || '*';

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
};

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const WINDOW_MS = 60000;

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
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIP = req.headers.get('x-real-ip');
  if (realIP) return realIP;
  return 'unknown';
}

interface RequestBody {
  captchaToken?: string;
  userId?: string;
  seminar_title: string;
  seminar_date_location?: string | null;
  presenter_names?: string | null;
  ratings: Record<string, number | null>;
  presenter_comments?: string | null;
  most_impactful?: string | null;
  program_comments?: string | null;
  may_use_comments?: string | null;
  contact_for_coaching: boolean;
  name: string;
  email: string;
  organization?: string | null;
  title?: string | null;
  best_times_to_contact?: string | null;
  best_ways_to_contact?: string | null;
}

async function verifyCaptcha(token: string, corsHeaders: Record<string, string>): Promise<Response | null> {
  const secret = Deno.env.get('HCAPTCHA_SECRET_KEY');
  if (!secret) throw new Error('HCAPTCHA_SECRET_KEY not configured');

  const verifyResponse = await fetch('https://hcaptcha.com/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token }),
  });

  const verifyResult = await verifyResponse.json();
  if (!verifyResult.success) {
    return new Response(
      JSON.stringify({ error: 'Captcha verification failed', details: verifyResult['error-codes'] || [] }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
  return null;
}

function sendNotificationEmail(body: RequestBody, row: { id: string; created_at: string }): void {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (!resendApiKey) return;

  fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: NOTIFICATION_FROM,
      to: [NOTIFICATION_EMAIL],
      subject: `Participant evaluation: ${body.seminar_title}`,
      html: `
        <h2>New participant evaluation</h2>
        <p><strong>ID:</strong> ${row.id}</p>
        <p><strong>Name:</strong> ${body.name}</p>
        <p><strong>Email:</strong> ${body.email}</p>
        <p><strong>Seminar:</strong> ${body.seminar_title}</p>
        <p><strong>Coaching follow-up:</strong> ${body.contact_for_coaching ? 'Yes' : 'No'}</p>
      `,
    }),
  }).catch((err) => console.error('Evaluation notification email failed:', err));
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const clientIP = getClientIP(req);
  if (!checkRateLimit(clientIP)) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body: RequestBody = await req.json();

    if (!body.seminar_title?.trim() || !body.name?.trim() || !body.email?.trim()) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!body.userId && (!body.captchaToken || body.captchaToken.trim() === '')) {
      return new Response(JSON.stringify({ error: 'Captcha verification required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (body.captchaToken && body.captchaToken.trim() !== '') {
      const captchaErr = await verifyCaptcha(body.captchaToken, corsHeaders);
      if (captchaErr) return captchaErr;
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    let userId: string | null = null;
    if (body.userId) {
      const { data: u, error } = await supabase.auth.admin.getUserById(body.userId);
      if (!error && u?.user) userId = u.user.id;
    }

    const insertRow = {
      user_id: userId,
      seminar_title: body.seminar_title.trim(),
      seminar_date_location: body.seminar_date_location?.trim() || null,
      presenter_names: body.presenter_names?.trim() || null,
      ratings: body.ratings,
      presenter_comments: body.presenter_comments?.trim() || null,
      most_impactful: body.most_impactful?.trim() || null,
      program_comments: body.program_comments?.trim() || null,
      may_use_comments: body.may_use_comments ?? null,
      contact_for_coaching: Boolean(body.contact_for_coaching),
      name: body.name.trim(),
      email: body.email.trim(),
      organization: body.organization?.trim() || null,
      title: body.title?.trim() || null,
      best_times_to_contact: body.best_times_to_contact?.trim() || null,
      best_ways_to_contact: body.best_ways_to_contact?.trim() || null,
    };

    const { data: row, error: insertError } = await supabase
      .from('participant_evaluations')
      .insert(insertRow)
      .select()
      .single();

    if (insertError) {
      throw new Error(insertError.message);
    }

    sendNotificationEmail(body, row);

    return new Response(JSON.stringify(row), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
