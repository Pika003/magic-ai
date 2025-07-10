import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
// Define daily update templates
const dailyUpdateTemplates = [
  {
    name: "Clean & Structured",
    template: `Today's Tasks:
    ========================

    [Project Name] 🔧
    • [Task Details]
    • [Additional Details]

    [Project Name 2] 🎨
    • [Task Details]
    • [Additional Details]

    [Project Name 3] 📊
    • [Task Details]
    • [Additional Details]`
  },
  {
    name: "Table Format",
    template: `Today's Tasks:
    ========================
    Project    | Task Details
    -----------|-------------
    [Project1] | • [Task Details]
               | • [Additional Details]
    [Project2] | • [Task Details]
               | • [Additional Details]`
  },
  {
    name: "Priority-Based",
    template: `🗓️ Today's Task:
    ---------------------------

        High Priority 🔥
        • [Project] [Task]
        • [Project] [Task]

        Medium Priority ⚙️
        • [Project] [Task]
        • [Project] [Task]

        Low Priority 🎨
        • [Project] [Task]
        • [Project] [Task]`
  },
  {
    name: "Categorized with Emojis",
    template: `📋 Today's Work Plan:
    ===============================

      [Project Name] 🛠️
      ◦ [Task Details]
      ◦ [Additional Details]

      [Project Name] 🎨
      ◦ [Task Details]
      ◦ [Additional Details]

      [Project Name] 🌐
      ◦ [Task Details]
      ◦ [Additional Details]`
  }
];
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({
        error: "No authorization header"
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({
        error: "Unauthorized"
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      return new Response(JSON.stringify({
        error: "OpenAI API key not configured"
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const body = await req.json();
    const { action, isRefresh = false, sentence, keywords, message, clientName, liveLink, yourName, updateText, commitSummary, content, template } = body;
    let prompt = "";
    let fieldName = ""; // used to set response key like "correctedSentence"
    switch (action) {
      case "correct_sentence":
        prompt = `Correct the following sentence to proper English:\n"${sentence}"`;
        fieldName = "correctedSentence";
        break;
      case "generate_prompt":
        prompt = `Generate a professional prompt based on these keywords:\n${keywords}`;
        fieldName = "generatedPrompt";
        break;
      case "generate_client_update":
        prompt = `Write a professional client update using this message:\n"${message}".\nClient: ${clientName}\nLive Link: ${liveLink}\nSender: ${yourName}`;
        fieldName = "clientUpdate";
        break;
      case "format_daily_update":
        prompt = `Format the following daily update text into a clear and structured format. Use one of these template styles as inspiration, but adapt it based on the content: ${dailyUpdateTemplates.map((t) => `---${t.name}---\n${t.template}\n`).join('\n')}
        Original text to format: ${updateText}

        Requirements:
        1. Use appropriate emojis for different project types
        2. Keep the same information but organize it clearly
        3. Use consistent formatting
        4. Group tasks by project
        5. Add visual separators for readability
        6. Highlight important deadlines or priorities if mentioned`;
        fieldName = "formattedUpdate";
        break;
      case "generate_commit_message":
        prompt = `Write a concise and professional Git commit message for this summary:\n${commitSummary}`;
        fieldName = "commitMessage";
        break;
      case "format_with_template":
        prompt = `Format this content using the following structure template:\nTemplate:\n${template}\nContent:\n${content}`;
        fieldName = "formattedContent";
        break;
      default:
        return new Response(JSON.stringify({
          error: "Invalid action"
        }), {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
    }
    const messages = [
      {
        role: "system",
        content: "You are a helpful and professional writing assistant."
      },
      {
        role: "user",
        content: prompt
      }
    ];
    if (isRefresh) {
      // Add a second message to simulate user asking again for variety
      messages.push({
        role: "user",
        content: "Give me another alternative version."
      });
    }
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages
      })
    });
    const completion = await openaiRes.json();
    const choices = completion.choices;
    let mainResponse = "No response";
    let refreshResponse = null;
    if (Array.isArray(choices) && choices.length > 0) {
      mainResponse = choices[0].message?.content ?? "No response";
      if (isRefresh && choices.length > 1) {
        refreshResponse = choices[1].message?.content ?? null;
      }
    }
    const responseBody = {
      [fieldName]: mainResponse,
      ...refreshResponse ? {
        [`${fieldName}Alt`]: refreshResponse
      } : {}
    };
    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    console.error("Function error:", err);
    return new Response(JSON.stringify({
      error: "Internal server error"
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
