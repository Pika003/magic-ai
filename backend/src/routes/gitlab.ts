import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const GITLAB_CLIENT_ID = process.env.GITLAB_CLIENT_ID!;
const GITLAB_CLIENT_SECRET = process.env.GITLAB_CLIENT_SECRET!;
const CALLBACK_URL = process.env.GITLAB_CALLBACK_URL || 'http://localhost:4000/api/gitlab/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ─── GET /api/gitlab/start ────────────────────────────────────────────────────
router.get('/start', authenticate, (req: AuthRequest, res: Response) => {
  const state = Buffer.from(req.userId!).toString('base64');
  const url =
    `https://gitlab.com/oauth/authorize` +
    `?client_id=${GITLAB_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(CALLBACK_URL)}` +
    `&response_type=code` +
    `&state=${state}` +
    `&scope=read_api+read_user+read_repository`;

  res.json({ url });
});

// ─── GET /api/gitlab/callback ─────────────────────────────────────────────────
router.get('/callback', async (req: Request, res: Response): Promise<void> => {
  const { code, state } = req.query as { code?: string; state?: string };

  const errorRedirect = (msg: string) =>
    res.redirect(`${FRONTEND_URL}/version-control?provider=gitlab&status=error&message=${encodeURIComponent(msg)}`);

  if (!code) { errorRedirect('Missing authorization code'); return; }
  if (!state) { errorRedirect('Missing state parameter'); return; }

  let userId: string;
  try {
    userId = Buffer.from(state, 'base64').toString('utf8');
    if (!userId) throw new Error('Empty userId');
  } catch {
    errorRedirect('Invalid state parameter');
    return;
  }

  try {
    const tokenResp = await fetch('https://gitlab.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: GITLAB_CLIENT_ID,
        client_secret: GITLAB_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: CALLBACK_URL,
      }),
    });

    const tokenData: any = await tokenResp.json();

    if (tokenData.error || !tokenData.access_token) {
      errorRedirect(tokenData.error_description || 'No access token received');
      return;
    }

    await pool.query(
      `INSERT INTO public.user_gitlab_tokens
         (user_id, access_token, refresh_token, token_type, scope, expires_at, connected)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       ON CONFLICT (user_id) DO UPDATE SET
         access_token  = EXCLUDED.access_token,
         refresh_token = EXCLUDED.refresh_token,
         token_type    = EXCLUDED.token_type,
         scope         = EXCLUDED.scope,
         expires_at    = EXCLUDED.expires_at,
         connected     = true,
         updated_at    = now()`,
      [
        userId,
        tokenData.access_token,
        tokenData.refresh_token || null,
        tokenData.token_type || 'bearer',
        tokenData.scope || null,
        tokenData.expires_in
          ? new Date(Date.now() + Number(tokenData.expires_in) * 1000).toISOString()
          : null,
      ]
    );

    res.redirect(`${FRONTEND_URL}/version-control?provider=gitlab&status=success`);
  } catch (err: any) {
    console.error('[GITLAB] callback error:', err);
    errorRedirect(err.message || 'OAuth failed');
  }
});

// ─── GET /api/gitlab/projects ─────────────────────────────────────────────────
router.get('/projects', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tokenResult = await pool.query(
      'SELECT access_token FROM public.user_gitlab_tokens WHERE user_id = $1 AND connected = true',
      [req.userId]
    );

    if (!tokenResult.rows[0]) {
      res.status(401).json({ error: 'GitLab not connected' });
      return;
    }

    const { access_token } = tokenResult.rows[0];

    const response = await fetch(
      'https://gitlab.com/api/v4/projects?membership=true&per_page=100&order_by=last_activity_at',
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );

    if (!response.ok) {
      await pool.query('DELETE FROM public.user_gitlab_tokens WHERE user_id = $1', [req.userId]);
      res.status(401).json({ error: 'GitLab token expired or invalid' });
      return;
    }

    const projects = await response.json();
    res.json(projects);
  } catch (err) {
    console.error('[GITLAB] projects error:', err);
    res.status(500).json({ error: 'Failed to fetch GitLab projects' });
  }
});

// ─── GET /api/gitlab/project/:id ─────────────────────────────────────────────
router.get('/project/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { kind = 'details' } = req.query as { kind?: string };

  try {
    const tokenResult = await pool.query(
      'SELECT access_token FROM public.user_gitlab_tokens WHERE user_id = $1 AND connected = true',
      [req.userId]
    );

    if (!tokenResult.rows[0]) {
      res.status(401).json({ error: 'GitLab not connected' });
      return;
    }

    const { access_token } = tokenResult.rows[0];
    const baseUrl = `https://gitlab.com/api/v4/projects/${id}`;
    const headers = { Authorization: `Bearer ${access_token}` };

    let endpoint = baseUrl;
    if (kind === 'commits') endpoint = `${baseUrl}/repository/commits?per_page=30`;
    else if (kind === 'branches') endpoint = `${baseUrl}/repository/branches`;

    const response = await fetch(endpoint, { headers });
    if (!response.ok) {
      res.status(response.status).json({ error: 'GitLab API error' });
      return;
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('[GITLAB] project detail error:', err);
    res.status(500).json({ error: 'Failed to fetch project details' });
  }
});

// ─── GET /api/gitlab/status ───────────────────────────────────────────────────
router.get('/status', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT connected FROM public.user_gitlab_tokens WHERE user_id = $1',
      [req.userId]
    );
    res.json({ connected: !!(result.rows[0]?.connected) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check status' });
  }
});

// ─── POST /api/gitlab/disconnect ──────────────────────────────────────────────
router.post('/disconnect', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await pool.query('DELETE FROM public.user_gitlab_tokens WHERE user_id = $1', [req.userId]);
    res.json({ success: true });
  } catch (err) {
    console.error('[GITLAB] disconnect error:', err);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

// ─── POST /api/gitlab/workflow-commit ────────────────────────────────────────
// Body: { projectId, filePath, content, commitMessage? }
// Creates or updates any file (e.g. .gitlab-ci.yml) in the GitLab project.
router.post('/workflow-commit', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { projectId, filePath, content, commitMessage } = req.body;
  if (!projectId || !filePath || !content) {
    res.status(400).json({ error: 'projectId, filePath, and content are required' });
    return;
  }

  try {
    const tokenResult = await pool.query(
      'SELECT access_token FROM public.user_gitlab_tokens WHERE user_id = $1 AND connected = true',
      [req.userId]
    );
    if (!tokenResult.rows[0]) {
      res.status(401).json({ error: 'GitLab not connected' });
      return;
    }
    const { access_token } = tokenResult.rows[0];
    const glHeaders = {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    };
    const encodedId = encodeURIComponent(String(projectId));
    const encodedFilePath = encodeURIComponent(filePath);

    // Get default branch
    const projectResp = await fetch(`https://gitlab.com/api/v4/projects/${encodedId}`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const projectData: any = projectResp.ok ? await projectResp.json() : {};
    const branch = projectData.default_branch || 'main';

    // Check if file already exists
    const existingResp = await fetch(
      `https://gitlab.com/api/v4/projects/${encodedId}/repository/files/${encodedFilePath}?ref=${branch}`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    const fileExists = existingResp.ok;

    const message = commitMessage || `ci: add ${filePath}`;
    const body = JSON.stringify({ branch, content, commit_message: message, encoding: 'text' });
    const method = fileExists ? 'PUT' : 'POST';

    const commitResp = await fetch(
      `https://gitlab.com/api/v4/projects/${encodedId}/repository/files/${encodedFilePath}`,
      { method, headers: glHeaders, body }
    );

    if (!commitResp.ok) {
      const errData: any = await commitResp.json().catch(() => ({}));
      res.status(commitResp.status).json({ error: errData.message || 'Failed to commit file' });
      return;
    }

    const commitData: any = await commitResp.json();
    res.json({
      success: true,
      branch: commitData.branch,
      filePath: commitData.file_path,
      message: `${filePath} committed to project ${projectId}`,
    });
  } catch (err: any) {
    console.error('[GITLAB] workflow-commit error:', err);
    res.status(500).json({ error: err.message || 'Failed to commit file' });
  }
});

// ─── POST /api/gitlab/readme-generate ────────────────────────────────────────
// Body: { projectId }
// 1. Fetches project metadata + recent commits from GitLab
// 2. Calls AI to generate a README
// 3. Returns the generated README content
router.post('/readme-generate', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { projectId } = req.body;
  if (!projectId) {
    res.status(400).json({ error: 'projectId is required' });
    return;
  }

  try {
    const tokenResult = await pool.query(
      'SELECT access_token FROM public.user_gitlab_tokens WHERE user_id = $1 AND connected = true',
      [req.userId]
    );
    if (!tokenResult.rows[0]) {
      res.status(401).json({ error: 'GitLab not connected' });
      return;
    }
    const { access_token } = tokenResult.rows[0];
    const glHeaders = { Authorization: `Bearer ${access_token}` };
    const encodedId = encodeURIComponent(String(projectId));

    // Fetch project metadata and recent commits in parallel
    const [projectResp, commitsResp, languagesResp] = await Promise.all([
      fetch(`https://gitlab.com/api/v4/projects/${encodedId}`, { headers: glHeaders }),
      fetch(`https://gitlab.com/api/v4/projects/${encodedId}/repository/commits?per_page=10`, { headers: glHeaders }),
      fetch(`https://gitlab.com/api/v4/projects/${encodedId}/languages`, { headers: glHeaders }),
    ]);

    if (!projectResp.ok) {
      res.status(projectResp.status).json({ error: 'Failed to fetch project details from GitLab' });
      return;
    }

    const projectData: any = await projectResp.json();
    const commitsData: any[] = commitsResp.ok ? (await commitsResp.json()) as any[] : [];
    const languagesData: Record<string, number> = languagesResp.ok ? (await languagesResp.json()) as Record<string, number> : {};

    const recentCommits = commitsData
      .slice(0, 10)
      .map((c: any) => `- ${c.title || c.message?.split('\n')[0]} (${c.author_name})`)
      .join('\n') || 'No commits yet';

    const topLanguages = Object.keys(languagesData).slice(0, 5).join(', ') || 'Not specified';
    const topics = projectData.tag_list?.join(', ') || projectData.topics?.join(', ') || 'None';

    // Call AI — Groq (free) first, fall back to OpenAI
    const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
    const isGroq = !!process.env.GROQ_API_KEY;
    if (!apiKey) { res.status(500).json({ error: 'No AI provider configured (GROQ_API_KEY or OPENAI_API_KEY)' }); return; }

    const prompt = `You are a professional technical writer. Generate a comprehensive, well-structured README.md file for the following GitLab repository.

Repository Details:
- Name: ${projectData.path_with_namespace || projectData.name}
- Description: ${projectData.description || 'No description provided'}
- Primary Languages: ${topLanguages}
- Topics/Tags: ${topics}
- Visibility: ${projectData.visibility || 'public'}
- Default Branch: ${projectData.default_branch || 'main'}
- Stars: ${projectData.star_count ?? 0} | Forks: ${projectData.forks_count ?? 0}
- Recent Commits:
${recentCommits}

Requirements:
1. Use proper Markdown formatting with headers, code blocks, and badges
2. Include these sections: Project title with a badge row, Overview/About, Features, Tech Stack, Getting Started (Prerequisites + Installation + Usage), Project Structure (inferred), Contributing, License
3. Infer specific, realistic content from the project metadata and commits — avoid generic filler
4. Keep it professional and developer-friendly
5. Use emojis sparingly for section headers
6. Output ONLY the raw Markdown — no surrounding explanation`;

    const aiResp = await fetch(
      isGroq ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: isGroq ? 'openai/gpt-oss-120b' : 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a professional technical writer specializing in open-source documentation.' },
            { role: 'user', content: prompt },
          ],
        }),
      }
    );

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      res.status(500).json({ error: `AI error: ${errText}` });
      return;
    }

    const aiData: any = await aiResp.json();
    const readmeContent: string = aiData.choices?.[0]?.message?.content ?? '';

    res.json({
      readmeContent,
      projectId: projectData.id,
      projectPath: projectData.path_with_namespace,
      defaultBranch: projectData.default_branch || 'main',
    });
  } catch (err: any) {
    console.error('[GITLAB] readme generate error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate README' });
  }
});

// ─── POST /api/gitlab/readme/commit ───────────────────────────────────────────
// Body: { projectId, readmeContent, commitMessage? }
// Creates or updates README.md via the GitLab Repository Files API.
router.post('/readme-commit', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { projectId, readmeContent, commitMessage } = req.body;
  if (!projectId || !readmeContent) {
    res.status(400).json({ error: 'projectId and readmeContent are required' });
    return;
  }

  try {
    const tokenResult = await pool.query(
      'SELECT access_token FROM public.user_gitlab_tokens WHERE user_id = $1 AND connected = true',
      [req.userId]
    );
    if (!tokenResult.rows[0]) {
      res.status(401).json({ error: 'GitLab not connected' });
      return;
    }
    const { access_token } = tokenResult.rows[0];
    const glHeaders = {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    };
    const encodedId = encodeURIComponent(String(projectId));

    // Fetch the project to get default_branch
    const projectResp = await fetch(`https://gitlab.com/api/v4/projects/${encodedId}`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const projectData: any = projectResp.ok ? await projectResp.json() : {};
    const branch = projectData.default_branch || 'main';

    // Check if README.md already exists
    const existingResp = await fetch(
      `https://gitlab.com/api/v4/projects/${encodedId}/repository/files/README.md?ref=${branch}`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    const fileExists = existingResp.ok;

    const message = commitMessage || '📝 Add AI-generated README.md';
    const body = JSON.stringify({
      branch,
      content: readmeContent,
      commit_message: message,
      encoding: 'text',
    });

    const method = fileExists ? 'PUT' : 'POST';
    const commitResp = await fetch(
      `https://gitlab.com/api/v4/projects/${encodedId}/repository/files/README.md`,
      { method, headers: glHeaders, body }
    );

    if (!commitResp.ok) {
      const errData: any = await commitResp.json().catch(() => ({}));
      res.status(commitResp.status).json({ error: errData.message || 'Failed to commit README' });
      return;
    }

    const commitData: any = await commitResp.json();
    res.json({
      success: true,
      branch: commitData.branch,
      filePath: commitData.file_path,
      message: `README.md successfully committed to ${projectData.path_with_namespace || projectId}`,
    });
  } catch (err: any) {
    console.error('[GITLAB] readme commit error:', err);
    res.status(500).json({ error: err.message || 'Failed to commit README' });
  }
});

export default router;
