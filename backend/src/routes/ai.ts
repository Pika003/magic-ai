import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { pool } from '../db/pool';

const router = Router();

// Daily update template styles (same as original Supabase function)
const dailyUpdateTemplates = [
  {
    name: 'Clean & Structured',
    template: `Today's Tasks:
========================
[Project Name] 🔧
• [Task Details]
• [Additional Details]

[Project Name 2] 🎨
• [Task Details]
• [Additional Details]`,
  },
  {
    name: 'Table Format',
    template: `Today's Tasks:
========================
Project    | Task Details
-----------|-------------
[Project1] | • [Task Details]
           | • [Additional Details]`,
  },
  {
    name: 'Priority-Based',
    template: `🗓️ Today's Task:
---------------------------
    High Priority 🔥
    • [Project] [Task]

    Medium Priority ⚙️
    • [Project] [Task]

    Low Priority 🎨
    • [Project] [Task]`,
  },
  {
    name: 'Categorized with Emojis',
    template: `📋 Today's Work Plan:
===============================
  [Project Name] 🛠️
  ◦ [Task Details]

  [Project Name] 🎨
  ◦ [Task Details]`,
  },
];

/** Call OpenAI chat completions */
async function callOpenAI(messages: { role: string; content: string }[]): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API key not configured');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI error: ${err}`);
  }

  const data: any = await response.json();
  return data.choices?.[0]?.message?.content ?? 'No response';
}

// ─── POST /api/ai ─────────────────────────────────────────────────────────────
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const {
    action,
    isRefresh = false,
    sentence,
    keywords,
    message,
    clientName,
    liveLink,
    yourName,
    updateText,
    commitSummary,
    content,
    template,
  } = req.body;

  if (!action) {
    res.status(400).json({ error: 'action is required' });
    return;
  }

  // Check usage limit before calling OpenAI
  try {
    const profileResult = await pool.query(
      'SELECT paid_user FROM public.profiles WHERE id = $1',
      [req.userId]
    );
    const isPaidUser = profileResult.rows[0]?.paid_user ?? false;

    if (!isPaidUser) {
      const totalResult = await pool.query(
        'SELECT public.get_total_usage($1) AS total',
        [req.userId]
      );
      const total = totalResult.rows[0]?.total ?? 0;
      if (total >= 50) {
        res.status(429).json({
          error: 'Usage limit reached',
          message: "You've reached your free usage limit for this month. Please upgrade to unlimited.",
          limitReached: true,
        });
        return;
      }
    }
  } catch (err) {
    console.error('[AI] Usage check error:', err);
    res.status(500).json({ error: 'Failed to check usage' });
    return;
  }

  // Build prompt
  let prompt = '';
  let fieldName = '';

  switch (action) {
    case 'correct_sentence':
      prompt = `Correct the following sentence to proper English:\n"${sentence}"`;
      fieldName = 'correctedSentence';
      break;

    case 'generate_prompt':
      prompt = `Generate a professional prompt based on these keywords:\n${keywords}`;
      fieldName = 'generatedPrompt';
      break;

    case 'generate_client_update':
      prompt = `Write a professional client update using this message:\n"${message}".\nClient: ${clientName}\nLive Link: ${liveLink}\nSender: ${yourName}`;
      fieldName = 'clientUpdate';
      break;

    case 'format_daily_update':
      prompt = `Format the following daily update text into a clear and structured format. Use one of these template styles as inspiration, but adapt it based on the content:\n${dailyUpdateTemplates.map((t) => `---${t.name}---\n${t.template}\n`).join('\n')}\n\nOriginal text to format: ${updateText}\n\nRequirements:\n1. Use appropriate emojis for different project types\n2. Keep the same information but organize it clearly\n3. Use consistent formatting\n4. Group tasks by project\n5. Add visual separators for readability\n6. Highlight important deadlines or priorities if mentioned`;
      fieldName = 'formattedUpdate';
      break;

    case 'generate_commit_message':
      prompt = `Write a concise and professional Git commit message for this summary:\n${commitSummary}`;
      fieldName = 'commitMessage';
      break;

    case 'format_with_template':
      prompt = `Format this content using the following structure template:\nTemplate:\n${template}\nContent:\n${content}`;
      fieldName = 'formattedContent';
      break;

    default:
      res.status(400).json({ error: 'Invalid action' });
      return;
  }

  try {
    const messages: { role: string; content: string }[] = [
      { role: 'system', content: 'You are a helpful and professional writing assistant.' },
      { role: 'user', content: prompt },
    ];

    if (isRefresh) {
      messages.push({ role: 'user', content: 'Give me another alternative version.' });
    }

    const result = await callOpenAI(messages);

    // Track usage
    await pool.query('SELECT public.increment_feature_usage($1, $2)', [req.userId, action]);

    res.json({ [fieldName]: result });
  } catch (err: any) {
    console.error('[AI] OpenAI error:', err);
    res.status(500).json({ error: err.message || 'AI request failed' });
  }
});

export default router;
