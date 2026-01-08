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
  captchaToken?: string; // Optional - if not provided or empty, captcha verification is skipped
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body
    const body: RequestBody = await req.json();

    // Verify hCaptcha token if provided (captcha may be optional for first-time users)
    if (body.captchaToken && body.captchaToken.trim() !== '') {
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
    }

    // Initialize Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let finalUserId: string | null = body.userId || null;

    // If user_id is provided, use it (user is authenticated)
    if (finalUserId) {
      // Verify user exists
      const { data: user, error: userError } = await supabase.auth.admin.getUserById(finalUserId);
      if (userError || !user) {
        throw new Error(`User not found: ${userError?.message}`);
      }

      // Update user profile if needed
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', finalUserId)
        .single();

      if (existingProfile) {
        // Update profile with latest contact data
        await supabase
          .from('user_profiles')
          .update({
            full_name: body.contactData.full_name,
            company: body.contactData.company,
            role: body.contactData.role,
            phone: body.contactData.phone,
            updated_at: new Date().toISOString(),
          })
          .eq('id', finalUserId);
      }
    } else {
      // No user_id provided - check if user exists by email
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users.find(u => u.email === body.contactData.email);

      if (existingUser) {
        finalUserId = existingUser.id;
        
        // Update profile
        await supabase
          .from('user_profiles')
          .update({
            full_name: body.contactData.full_name,
            company: body.contactData.company,
            role: body.contactData.role,
            phone: body.contactData.phone,
            updated_at: new Date().toISOString(),
          })
          .eq('id', finalUserId)
          .upsert({
            id: finalUserId,
            email: body.contactData.email,
            full_name: body.contactData.full_name,
            company: body.contactData.company,
            role: body.contactData.role,
            phone: body.contactData.phone,
          });
      } else {
        // Create new auth user (first-time user)
        // Auto-confirm email - they'll get a magic link when they log in next time
        const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
          email: body.contactData.email,
          email_confirm: true, // Auto-confirm email - no confirmation needed
          user_metadata: {
            full_name: body.contactData.full_name,
            company: body.contactData.company,
            role: body.contactData.role,
          },
        });

        if (createUserError || !newUser.user) {
          throw new Error(`Failed to create user: ${createUserError?.message}`);
        }

        finalUserId = newUser.user.id;

        // Create user profile (trigger should handle this, but ensure it exists)
        await supabase
          .from('user_profiles')
          .upsert({
            id: finalUserId,
            email: body.contactData.email,
            full_name: body.contactData.full_name,
            company: body.contactData.company,
            role: body.contactData.role,
            phone: body.contactData.phone,
            user_role: 'user',
          });
      }
    }

    // Create assessment response with user_id
    const { data: response, error: responseError } = await supabase
      .from('assessment_responses')
      .insert({
        user_id: finalUserId,
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

    // No confirmation email needed - email is auto-confirmed
    // Users will get a magic link when they log in next time

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

