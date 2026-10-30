import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// ─── GET /api/daily-updates ───────────────────────────────────────────────────
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT id, original_text AS "originalText", formatted_update AS "formattedUpdate",
              projects, created_at, user_id AS "userId"
       FROM public.daily_updates
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[DAILY_UPDATES] GET error:', err);
    res.status(500).json({ error: 'Failed to fetch daily updates' });
  }
});

// ─── POST /api/daily-updates ──────────────────────────────────────────────────
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { originalText, formattedUpdate, projects, created_at } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO public.daily_updates
         (user_id, original_text, formatted_update, projects, created_at)
       VALUES ($1, $2, $3, $4, COALESCE($5, now()))
       RETURNING id, original_text AS "originalText", formatted_update AS "formattedUpdate",
                 projects, created_at, user_id AS "userId"`,
      [
        req.userId,
        originalText || '',
        formattedUpdate || '',
        JSON.stringify(projects || []),
        created_at ? new Date(created_at) : null,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('[DAILY_UPDATES] POST error:', err);
    res.status(500).json({ error: 'Failed to create daily update' });
  }
});

// ─── PATCH /api/daily-updates/:id ─────────────────────────────────────────────
router.patch('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { formattedUpdate, projects } = req.body;

  try {
    const result = await pool.query(
      `UPDATE public.daily_updates
       SET formatted_update = COALESCE($1, formatted_update),
           projects         = COALESCE($2, projects),
           updated_at       = now()
       WHERE id = $3 AND user_id = $4
       RETURNING id, original_text AS "originalText", formatted_update AS "formattedUpdate",
                 projects, created_at, user_id AS "userId"`,
      [
        formattedUpdate ?? null,
        projects ? JSON.stringify(projects) : null,
        id,
        req.userId,
      ]
    );

    if (!result.rows[0]) {
      res.status(404).json({ error: 'Daily update not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('[DAILY_UPDATES] PATCH error:', err);
    res.status(500).json({ error: 'Failed to update daily update' });
  }
});

// ─── DELETE /api/daily-updates/:id ────────────────────────────────────────────
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM public.daily_updates WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.userId]
    );

    if (!result.rows[0]) {
      res.status(404).json({ error: 'Daily update not found' });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    console.error('[DAILY_UPDATES] DELETE error:', err);
    res.status(500).json({ error: 'Failed to delete daily update' });
  }
});

export default router;
