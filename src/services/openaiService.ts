
import { supabase } from '@/integrations/supabase/client';

export interface OpenAIResponse {
  correctedText: string;
  improvements: string[];
}

const getOpenAIKey = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in to use AI features.');
  }

  const { data, error } = await supabase
    .from('user_secrets')
    .select('secret_value')
    .eq('user_id', user.id)
    .eq('secret_name', 'OPENAI_API_KEY')
    .maybeSingle();

  if (error) {
    throw new Error('Failed to retrieve API key.');
  }

  if (!data) {
    throw new Error('OpenAI API key not found. Please add your API key in the Profile section.');
  }

  return data.secret_value;
};

export const correctSentenceWithAI = async (text: string, isRefresh: boolean = false): Promise<OpenAIResponse> => {
  const API_KEY = await getOpenAIKey();

  try {
    const startTime = performance.now();
    
    const temperatureValue = isRefresh ? 0.7 : 0.3;
    const systemPrompt = isRefresh 
      ? 'You are a professional text editor. Correct grammar, punctuation, word spacing (like "sen tence" to "sentence"), and improve sentence structure. Provide alternative phrasing and varied improvements. Return your response as JSON with "correctedText" and "improvements" array.'
      : 'You are a professional text editor. Correct grammar, punctuation, word spacing (like "sen tence" to "sentence"), and improve sentence structure. Return your response as JSON with "correctedText" and "improvements" array.';

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Please correct this text and improve it: "${text}"`
          }
        ],
        temperature: temperatureValue,
        max_tokens: 500
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    const endTime = performance.now();
    console.log(`OpenAI API call took ${endTime - startTime} milliseconds`);
    
    try {
      return JSON.parse(content);
    } catch {
      return {
        correctedText: content,
        improvements: ['Grammar improved', 'Text enhanced']
      };
    }
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
};

export const formatDailyUpdateWithAI = async (text: string, isRefresh: boolean = false): Promise<string> => {
  const API_KEY = await getOpenAIKey();

  try {
    const startTime = performance.now();
    
    const temperatureValue = isRefresh ? 0.6 : 0.3;
    const formatVariations = [
      `Today's Update:
----------------
1. [First corrected sentence]
2. [Second corrected sentence]
3. [Third corrected sentence]`,
      `Daily Progress Report:
======================
• [First corrected sentence]
• [Second corrected sentence]  
• [Third corrected sentence]`,
      `Project Update Summary:
-----------------------
→ [First corrected sentence]
→ [Second corrected sentence]
→ [Third corrected sentence]`
    ];

    const selectedFormat = isRefresh 
      ? formatVariations[Math.floor(Math.random() * formatVariations.length)]
      : formatVariations[0];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a professional text formatter. Format the given text into this structure:

${selectedFormat}

Correct any grammar, spacing issues (like "sen tence" to "sentence"), and improve sentence structure. Each point should be a complete, professional sentence.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: temperatureValue,
        max_tokens: 500
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const endTime = performance.now();
    console.log(`OpenAI API call took ${endTime - startTime} milliseconds`);
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
};

export const generateClientUpdateWithAI = async (text: string, clientName: string, liveLink: string, isRefresh: boolean = false): Promise<string> => {
  const API_KEY = await getOpenAIKey();

  try {
    const startTime = performance.now();
    
    const temperatureValue = isRefresh ? 0.6 : 0.4;
    const styleVariations = [
      'Create a professional client update message.',
      'Create a friendly yet professional client update message.',
      'Create a detailed and informative client update message.',
      'Create a concise and clear client update message.'
    ];

    const selectedStyle = isRefresh 
      ? styleVariations[Math.floor(Math.random() * styleVariations.length)]
      : styleVariations[0];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a professional client communication specialist. ${selectedStyle} Correct any grammar, spacing issues, and improve sentence structure. Format it professionally for client communication.`
          },
          {
            role: 'user',
            content: `Create a professional client update using this information:
            
Client: ${clientName}
Updates: ${text}${liveLink ? `\nLive Link: ${liveLink}` : ''}

Please format it professionally${liveLink ? ' and include the live link at the end where clients can check the progress.' : '.'}`
          }
        ],
        temperature: temperatureValue,
        max_tokens: 600
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const endTime = performance.now();
    console.log(`OpenAI API call took ${endTime - startTime} milliseconds`);
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
};
