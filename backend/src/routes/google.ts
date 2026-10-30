import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// ─── POST /api/google/token ───────────────────────────────────────────────────
router.post('/token', async (req: AuthRequest, res: Response): Promise<void> => {
  const { accessToken, refreshToken, expiresAt } = req.body;

  if (!accessToken || !expiresAt) {
    res.status(400).json({ error: 'accessToken and expiresAt are required' });
    return;
  }

  try {
    await pool.query(
      `INSERT INTO public.user_google_tokens
         (user_id, access_token, refresh_token, expires_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) DO UPDATE SET
         access_token  = EXCLUDED.access_token,
         refresh_token = COALESCE(EXCLUDED.refresh_token, user_google_tokens.refresh_token),
         expires_at    = EXCLUDED.expires_at,
         updated_at    = now()`,
      [req.userId, accessToken, refreshToken || null, new Date(expiresAt)]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[GOOGLE] token save error:', err);
    res.status(500).json({ error: 'Failed to save Google token' });
  }
});

// ─── GET /api/google/token ────────────────────────────────────────────────────
router.get('/token', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT access_token, expires_at FROM public.user_google_tokens WHERE user_id = $1',
      [req.userId]
    );

    if (!result.rows[0]) {
      res.status(404).json({ error: 'No Google token found' });
      return;
    }

    res.json({
      accessToken: result.rows[0].access_token,
      expiresAt: result.rows[0].expires_at,
    });
  } catch (err) {
    console.error('[GOOGLE] get token error:', err);
    res.status(500).json({ error: 'Failed to fetch Google token' });
  }
});

// ─── GET /api/google/status ───────────────────────────────────────────────────
router.get('/status', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT expires_at FROM public.user_google_tokens WHERE user_id = $1',
      [req.userId]
    );

    if (!result.rows[0]) {
      res.json({ connected: false });
      return;
    }

    const expiresAt = new Date(result.rows[0].expires_at);
    res.json({ connected: new Date() < expiresAt });
  } catch (err) {
    console.error('[GOOGLE] status error:', err);
    res.status(500).json({ error: 'Failed to check Google status' });
  }
});

// ─── POST /api/google/sync-events ─────────────────────────────────────────────
router.post('/sync-events', async (req: AuthRequest, res: Response): Promise<void> => {
  const { events } = req.body; // array of CalendarEvent

  if (!Array.isArray(events)) {
    res.status(400).json({ error: 'events must be an array' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const evt of events) {
      await client.query(
        `INSERT INTO public.user_calendar_events
           (user_id, event_id, title, description, start_time, end_time, location)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [
          req.userId,
          evt.id,
          evt.title,
          evt.description || null,
          new Date(evt.start),
          new Date(evt.end),
          evt.location || null,
        ]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true, count: events.length });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[GOOGLE] sync events error:', err);
    res.status(500).json({ error: 'Failed to sync calendar events' });
  } finally {
    client.release();
  }
});

export default router;
