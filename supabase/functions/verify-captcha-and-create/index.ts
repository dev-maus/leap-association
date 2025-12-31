import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
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
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get hCaptcha secret key from environment
    const hcaptchaSecretKey = Deno.env.get('HCAPTCHA_SECRET_KEY');
    if (!hcaptchaSecretKey) {
      throw new Error('HCAPTCHA_SECRET_KEY not configured');
    }

    // Parse request body
    const body: RequestBody = await req.json();

    // Verify hCaptcha token
    const verifyResponse = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: hcaptchaSecretKey,
        response: body.captchaToken,
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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create or use existing lead
    let finalLeadId = body.leadId;

    if (!finalLeadId) {
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .insert(body.contactData)
        .select()
        .single();

      if (leadError) {
        // Check if error is due to unique constraint violation on email
        if (leadError.code === '23505' || 
            leadError.message?.includes('duplicate') || 
            leadError.message?.includes('unique') ||
            leadError.message?.includes('violates unique constraint')) {
          return new Response(
            JSON.stringify({
              error: 'An assessment has already been submitted with this email address. Please use a different email or contact support.',
            }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
        throw new Error(`Failed to create lead: ${leadError.message}`);
      }

      finalLeadId = lead.id;
    }

    // Create assessment response
    const { data: response, error: responseError } = await supabase
      .from('assessment_responses')
      .insert({
        lead_id: finalLeadId,
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

