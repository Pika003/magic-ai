import { supabase } from '@/integrations/supabase/client';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const correctSentenceWithAI = async (sentence: string, isRefresh: boolean = false): Promise<string> => {
  const response = await fetch(`${supabaseUrl}/functions/v1/get-openai-key`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`
    },
    body: JSON.stringify({
      sentence: sentence,
      action: 'correct_sentence',
      isRefresh: isRefresh
    })
  });

  if (!response.ok) {
    throw new Error('Failed to correct sentence');
  }

  const data = await response.json();
  return data.correctedSentence;
};

export const generateProfessionalPromptWithAI = async (keywords: string): Promise<string> => {
  const response = await fetch(`${supabaseUrl}/functions/v1/get-openai-key`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`
    },
    body: JSON.stringify({
      keywords: keywords,
      action: 'generate_prompt'
    })
  });

  if (!response.ok) {
    throw new Error('Failed to generate prompt');
  }

  const data = await response.json();
  return data.generatedPrompt;
};

export const generateClientUpdateWithAI = async (message: string, clientName: string, liveLink: string, yourName: string, isRefresh: boolean = false): Promise<string> => {
  const response = await fetch(`${supabaseUrl}/functions/v1/get-openai-key`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`
    },
    body: JSON.stringify({
      message: message,
      clientName: clientName,
      liveLink: liveLink,
      yourName: yourName,
      action: 'generate_client_update',
      isRefresh: isRefresh
    })
  });

  if (!response.ok) {
    throw new Error('Failed to generate client update');
  }

  const data = await response.json();
  return data.clientUpdate;
};

export const formatDailyUpdateWithAI = async (updateText: string, isRefresh: boolean = false): Promise<string> => {
  const response = await fetch(`${supabaseUrl}/functions/v1/get-openai-key`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`
    },
    body: JSON.stringify({
      updateText: updateText,
      action: 'format_daily_update',
      isRefresh: isRefresh
    })
  });

  if (!response.ok) {
    throw new Error('Failed to format daily update');
  }

  const data = await response.json();
  return data.formattedUpdate;
};

export const generateCommitMessageWithAI = async (commitSummary: string): Promise<string> => {
  const response = await fetch(`${supabaseUrl}/functions/v1/get-openai-key`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`
    },
    body: JSON.stringify({
      commitSummary: commitSummary,
      action: 'generate_commit_message'
    })
  });

  if (!response.ok) {
    throw new Error('Failed to generate commit message');
  }

  const data = await response.json();
  return data.commitMessage;
};

export const formatWithStructureTemplate = async (content: string, template: string): Promise<string> => {
  const response = await fetch(`${supabaseUrl}/functions/v1/get-openai-key`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`
    },
    body: JSON.stringify({
      content: content,
      template: template,
      action: 'format_with_template'
    })
  });

  if (!response.ok) {
    throw new Error('Failed to format content with template');
  }

  const data = await response.json();
  return data.formattedContent;
};
