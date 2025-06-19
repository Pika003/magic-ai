import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get the current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('User authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured on server' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body to get the action and parameters
    const body = await req.json();
    const { action } = body;

    let result = {};

    switch (action) {
      case 'correct_sentence': {
        const { sentence, isRefresh } = body;
        const prompt = isRefresh 
          ? `Please provide a different variation of correcting this sentence while maintaining the same meaning. Fix any grammar, punctuation, spacing, and improve clarity: "${sentence}"`
          : `Please correct this sentence by fixing grammar, punctuation, spacing, and improving clarity while maintaining the original meaning: "${sentence}"`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are a professional editor. Provide only the corrected sentence without any explanations or additional text.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 500,
            temperature: isRefresh ? 0.7 : 0.3,
          }),
        });

        const data = await response.json();
        result = { correctedSentence: data.choices[0]?.message?.content?.trim() || sentence };
        break;
      }

      case 'generate_prompt': {
        const { keywords } = body;
        const prompt = `Create a professional, detailed prompt for AI based on these keywords or topic: "${keywords}". The prompt should be clear, specific, and designed to get the best results from an AI assistant.`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are an expert prompt engineer. Create professional, effective prompts for AI assistants.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 800,
            temperature: 0.7,
          }),
        });

        const data = await response.json();
        result = { generatedPrompt: data.choices[0]?.message?.content?.trim() || '' };
        break;
      }

      case 'generate_client_update': {
        const { message, clientName, liveLink, yourName, isRefresh } = body;
        const variation = isRefresh ? ' Please provide a different variation while maintaining professionalism.' : '';
        const linkText = liveLink ? `\n\nYou can view the live project here: ${liveLink}` : '';
        
        const prompt = `Create a professional client update email based on this information:
        
Client: ${clientName}
Your name: ${yourName}
Updates: ${message}${linkText}

Please format this as a professional, friendly client update email.${variation}`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are a professional business communicator. Create clear, friendly, and professional client update emails.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 1000,
            temperature: isRefresh ? 0.8 : 0.5,
          }),
        });

        const data = await response.json();
        result = { clientUpdate: data.choices[0]?.message?.content?.trim() || '' };
        break;
      }

      case 'format_daily_update': {
        const { updateText, isRefresh } = body;
        const variation = isRefresh ? ' Please provide a different formatting style while maintaining professionalism.' : '';
        
        const prompt = `Format this daily update into a professional, well-structured format:

"${updateText}"

Please organize this into clear sections with proper formatting, bullet points where appropriate, and professional language.${variation}`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are a professional business writer. Format daily updates into clear, professional reports.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 1000,
            temperature: isRefresh ? 0.7 : 0.4,
          }),
        });

        const data = await response.json();
        result = { formattedUpdate: data.choices[0]?.message?.content?.trim() || '' };
        break;
      }

      case 'generate_commit_message': {
        const { commitSummary } = body;
        
        const prompt = `Generate a professional git commit message based on this summary: "${commitSummary}"

Follow conventional commit format and best practices. Be concise but descriptive.`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are a senior developer. Generate clear, professional git commit messages following conventional commit standards.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 200,
            temperature: 0.3,
          }),
        });

        const data = await response.json();
        result = { commitMessage: data.choices[0]?.message?.content?.trim() || '' };
        break;
      }

      case 'format_with_template': {
        const { content, template } = body;
        
        const prompt = `Format this content according to the provided structure template:

Content to format:
"${content}"

Structure template:
"${template}"

Please organize the content to fit the template structure while maintaining all important information.`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are a professional content formatter. Apply structure templates to organize content effectively.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 1500,
            temperature: 0.4,
          }),
        });

        const data = await response.json();
        result = { formattedContent: data.choices[0]?.message?.content?.trim() || '' };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-openai-key function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});