
const OPENAI_API_KEY = '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';

export interface OpenAIResponse {
  correctedText: string;
  improvements: string[];
}

export const correctSentenceWithAI = async (text: string): Promise<OpenAIResponse> => {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
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
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
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
    return data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to format update with AI');
  }
};

export const generateClientUpdateWithAI = async (text: string, clientName: string, liveLink: string): Promise<string> => {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
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
    return data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to generate client update with AI');
  }
};
