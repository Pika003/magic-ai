import { api } from '@/lib/apiClient';

// ─── AI Actions ───────────────────────────────────────────────────────────────

export const correctSentenceWithAI = async (
  sentence: string,
  isRefresh = false
): Promise<string> => {
  const data = await api.post<{ correctedSentence: string }>('/ai', {
    action: 'correct_sentence',
    sentence,
    isRefresh,
  });
  return data.correctedSentence;
};

export const generateProfessionalPromptWithAI = async (
  keywords: string
): Promise<string> => {
  const data = await api.post<{ generatedPrompt: string }>('/ai', {
    action: 'generate_prompt',
    keywords,
  });
  return data.generatedPrompt;
};

export const generateClientUpdateWithAI = async (
  message: string,
  clientName: string,
  liveLink: string,
  yourName: string,
  isRefresh = false
): Promise<string> => {
  const data = await api.post<{ clientUpdate: string }>('/ai', {
    action: 'generate_client_update',
    message,
    clientName,
    liveLink,
    yourName,
    isRefresh,
  });
  return data.clientUpdate;
};

export const formatDailyUpdateWithAI = async (
  updateText: string,
  isRefresh = false
): Promise<string> => {
  const data = await api.post<{ formattedUpdate: string }>('/ai', {
    action: 'format_daily_update',
    updateText,
    isRefresh,
  });
  return data.formattedUpdate;
};

export const generateCommitMessageWithAI = async (
  commitSummary: string
): Promise<string> => {
  const data = await api.post<{ commitMessage: string }>('/ai', {
    action: 'generate_commit_message',
    commitSummary,
  });
  return data.commitMessage;
};

export const formatWithStructureTemplate = async (
  content: string,
  template: string
): Promise<string> => {
  const data = await api.post<{ formattedContent: string }>('/ai', {
    action: 'format_with_template',
    content,
    template,
  });
  return data.formattedContent;
};

export const generatePRDescriptionWithAI = async (params: {
  title: string;
  changes: string;
  breakingChanges?: string;
  testPlan?: string;
}): Promise<string> => {
  const data = await api.post<{ prDescription: string }>('/ai', {
    action: 'generate_pr_description',
    ...params,
  });
  return data.prDescription;
};

export const generateConventionalCommitWithAI = async (params: {
  summary: string;
  diff?: string;
}): Promise<string> => {
  const data = await api.post<{ commitMessage: string }>('/ai', {
    action: 'generate_conventional_commit',
    ...params,
  });
  return data.commitMessage;
};

export const polishDevTextWithAI = async (params: {
  text: string;
  audience?: string;
}): Promise<string> => {
  const data = await api.post<{ polishedText: string }>('/ai', {
    action: 'polish_dev_text',
    ...params,
  });
  return data.polishedText;
};
