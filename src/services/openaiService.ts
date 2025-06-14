
// Get API key from environment variable or localStorage
const getApiKey = (): string => {
  // Try to get from environment variable first
  const envKey = import.meta.env.VITE_OPENAI_KEY;
  if (envKey) return envKey;
  
  // Fallback to localStorage
  const storedKey = localStorage.getItem('openai_api_key');
  if (storedKey) return storedKey;
  
  throw new Error('OpenAI API key not found. Please set VITE_OPENAI_KEY environment variable or enter your API key.');
};

export interface OpenAIResponse {
  correctedText: string;
  improvements: string[];
}

export const correctSentenceWithAI = async (text: string): Promise<OpenAIResponse> => {
  const API_KEY = getApiKey();
  
  try {
    const startTime = performance.now();
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a professional text editor. Correct grammar, punctuation, word spacing (like "sen tence" to "sentence"), and improve sentence structure. Return your response as JSON with "correctedText" and "improvements" array.'
          },
          {
            role: 'user',
            content: `Please correct this text and improve it: "${text}"`
          }
        ],
        temperature: 0.3,
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
      // Fallback if AI doesn't return proper JSON
      return {
        correctedText: content,
        improvements: ['Grammar improved', 'Text enhanced']
      };
    }
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to process text with AI');
  }
};

export const formatDailyUpdateWithAI = async (text: string): Promise<string> => {
  const API_KEY = getApiKey();
  
  try {
    const startTime = performance.now();
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a professional text formatter. Format the given text into this exact structure:

Today's Update:
----------------
1. [First corrected sentence]
2. [Second corrected sentence]
3. [Third corrected sentence]

Correct any grammar, spacing issues (like "sen tence" to "sentence"), and improve sentence structure. Each point should be a complete, professional sentence.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.3,
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
    throw new Error('Failed to format update with AI');
  }
};

export const generateClientUpdateWithAI = async (text: string, clientName: string, liveLink: string): Promise<string> => {
  const API_KEY = getApiKey();
  
  try {
    const startTime = performance.now();
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a professional client communication specialist. Create a professional client update message. Correct any grammar, spacing issues, and improve sentence structure. Format it professionally for client communication.'
          },
          {
            role: 'user',
            content: `Create a professional client update using this information:
            
Client: ${clientName}
Updates: ${text}
Live Link: ${liveLink}

Please format it professionally and include the live link at the end where clients can check the progress.`
          }
        ],
        temperature: 0.4,
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
    throw new Error('Failed to generate client update with AI');
  }
};

// Utility function to check if API key is available
export const isApiKeyAvailable = (): boolean => {
  try {
    getApiKey();
    return true;
  } catch {
    return false;
  }
};

// Utility function to set API key in localStorage
export const setApiKey = (key: string): void => {
  localStorage.setItem('openai_api_key', key);
};
