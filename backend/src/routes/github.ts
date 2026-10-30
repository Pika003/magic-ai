import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID!;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET!;
const CALLBACK_URL = process.env.GITHUB_CALLBACK_URL || 'http://localhost:4000/api/github/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ─── GET /api/github/start ────────────────────────────────────────────────────
// Returns the GitHub OAuth URL. Client opens this URL.
router.get('/start', authenticate, (req: AuthRequest, res: Response) => {
  // Encode userId as the state parameter (used in callback to identify user)
  const state = Buffer.from(req.userId!).toString('base64');
  const scope = 'repo user';
  const url =
    `https://github.com/login/oauth/authorize` +
    `?client_id=${GITHUB_CLIENT_ID}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&redirect_uri=${encodeURIComponent(CALLBACK_URL)}` +
    `&state=${state}`;

  res.json({ url });
});

// ─── GET /api/github/callback ─────────────────────────────────────────────────
// GitHub redirects here. Exchanges code → token → stores in DB → redirects frontend.
router.get('/callback', async (req: Request, res: Response): Promise<void> => {
  const { code, state } = req.query as { code?: string; state?: string };

  const errorRedirect = (msg: string) =>
    res.redirect(`${FRONTEND_URL}/version-control?provider=github&status=error&message=${encodeURIComponent(msg)}`);

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
    // Exchange code for access token
    const tokenResp = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: CALLBACK_URL,
      }),
    });

    const tokenData: any = await tokenResp.json();

    if (tokenData.error || !tokenData.access_token) {
      errorRedirect(tokenData.error_description || tokenData.error || 'No access token received');
      return;
    }

    // Upsert token in DB
    await pool.query(
      `INSERT INTO public.user_github_tokens
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
        tokenData.scope || 'repo user',
        tokenData.expires_in
          ? new Date(Date.now() + Number(tokenData.expires_in) * 1000).toISOString()
          : null,
      ]
    );

    res.redirect(`${FRONTEND_URL}/version-control?provider=github&status=success`);
  } catch (err: any) {
    console.error('[GITHUB] callback error:', err);
    errorRedirect(err.message || 'OAuth failed');
  }
});

// ─── GET /api/github/repos ────────────────────────────────────────────────────
router.get('/repos', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tokenResult = await pool.query(
      'SELECT access_token FROM public.user_github_tokens WHERE user_id = $1 AND connected = true',
      [req.userId]
    );

    if (!tokenResult.rows[0]) {
      res.status(401).json({ error: 'GitHub not connected' });
      return;
    }

    const { access_token } = tokenResult.rows[0];

    const response = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
      headers: {
        Authorization: `token ${access_token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      // Token might be expired — disconnect
      await pool.query(
        'DELETE FROM public.user_github_tokens WHERE user_id = $1',
        [req.userId]
      );
      res.status(401).json({ error: 'GitHub token expired or invalid' });
      return;
    }

    const repos = await response.json();
    res.json(repos);
  } catch (err) {
    console.error('[GITHUB] repos error:', err);
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

// ─── GET /api/github/repo/:owner/:repo ────────────────────────────────────────
router.get('/repo/:owner/:repo', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { owner, repo } = req.params;
  const { kind = 'details' } = req.query as { kind?: string };

  try {
    const tokenResult = await pool.query(
      'SELECT access_token FROM public.user_github_tokens WHERE user_id = $1 AND connected = true',
      [req.userId]
    );

    if (!tokenResult.rows[0]) {
      res.status(401).json({ error: 'GitHub not connected' });
      return;
    }

    const { access_token } = tokenResult.rows[0];
    const baseUrl = `https://api.github.com/repos/${owner}/${repo}`;
    const headers = {
      Authorization: `token ${access_token}`,
      Accept: 'application/vnd.github.v3+json',
    };

    let endpoint = baseUrl;
    if (kind === 'commits') endpoint = `${baseUrl}/commits?per_page=30`;
    else if (kind === 'branches') endpoint = `${baseUrl}/branches`;
    else if (kind === 'contents') endpoint = `${baseUrl}/contents/${(req.query.path as string) || ''}`;

    const response = await fetch(endpoint, { headers });
    if (!response.ok) {
      res.status(response.status).json({ error: 'GitHub API error' });
      return;
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('[GITHUB] repo detail error:', err);
    res.status(500).json({ error: 'Failed to fetch repo details' });
  }
});

// ─── GET /api/github/status ───────────────────────────────────────────────────
router.get('/status', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT connected FROM public.user_github_tokens WHERE user_id = $1',
      [req.userId]
    );
    res.json({ connected: !!(result.rows[0]?.connected) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check status' });
  }
});

// ─── POST /api/github/disconnect ─────────────────────────────────────────────
router.post('/disconnect', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await pool.query(
      'DELETE FROM public.user_github_tokens WHERE user_id = $1',
      [req.userId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[GITHUB] disconnect error:', err);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

export default router;
