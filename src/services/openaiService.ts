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

  // Call the OpenAI edge function which will use the Supabase secret
  const response = await supabase.functions.invoke('get-openai-key');
  
  if (response.error) {
    throw new Error('Failed to retrieve API key from server.');
  }

  if (!response.data?.apiKey) {
    throw new Error('OpenAI API key not configured on server. Please contact support.');
  }

  return response.data.apiKey;
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

export const generateClientUpdateWithAI = async (
  text: string,
  clientName: string,
  liveLink: string,
  yourName: string,
  isRefresh: boolean = false
): Promise<string> => {
  const API_KEY = await getOpenAIKey();

  try {
    const startTime = performance.now();

    // Prompt style for short, professional, list-structured client updates
    const styleVariations = [
      `Write a SHORT, highly professional client update as a numbered list with correct grammar, referencing the following client: {clientName}, and signed off by: {yourName}.${liveLink ? " Include the live link at the end." : ""} Use complete sentences, but keep it concise.`,
      `Create a BRIEF and PROFESSIONAL project progress update as a bullet list for client: {clientName}. Sign the message as {yourName}. Make it suitable for copying into an email.`
    ];
    const selectedStyle = isRefresh
      ? styleVariations[Math.floor(Math.random() * styleVariations.length)]
      : styleVariations[0];

    // Compose the system prompt
    const systemPrompt = selectedStyle
      .replace("{clientName}", clientName)
      .replace("{yourName}", yourName);

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
            content: `${systemPrompt}
Correct any grammar and spacing issues.`
          },
          {
            role: 'user',
            content: `Here are today's update details:

Updates: ${text}${liveLink ? `\nLive Link: ${liveLink}` : ''}
            `
          }
        ],
        temperature: isRefresh ? 0.6 : 0.4,
        max_tokens: 400
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

/**
 * Generate a professional Git commit message from input
 */
export const generateCommitMessageWithAI = async (
  commitSummary: string,
  isRefresh: boolean = false
): Promise<string> => {
  const API_KEY = await getOpenAIKey();

  try {
    const styleVariations = [
      "Write a concise, clear, and highly professional Git commit message for the provided summary. Correct any grammar or language issues and make it suitable for a public repository. Use the conventional commit style if appropriate.",
      "Transform the following project update or code description into a best-practice Git commit message. Make it descriptive, but not too verbose. Use correct tense (imperative), good language, and keep it professional."
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
            content: selectedStyle
          },
          {
            role: 'user',
            content: `Summary:\n${commitSummary}`
          }
        ],
        temperature: isRefresh ? 0.5 : 0.3,
        max_tokens: 100
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
};
