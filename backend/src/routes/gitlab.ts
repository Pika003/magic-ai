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

export default router;
