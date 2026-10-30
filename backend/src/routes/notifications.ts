import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// ─── GET /api/notifications ───────────────────────────────────────────────────
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT id, project_id, title, message, type, is_read, is_dismissed,
              scheduled_for, created_at, updated_at
       FROM public.notifications
       WHERE user_id = $1 AND is_dismissed = false
       ORDER BY created_at DESC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[NOTIFICATIONS] GET error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// ─── PATCH /api/notifications/:id/read ───────────────────────────────────────
router.patch('/:id/read', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE public.notifications
       SET is_read = true, updated_at = now()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, req.userId]
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[NOTIFICATIONS] read error:', err);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// ─── PATCH /api/notifications/:id/dismiss ────────────────────────────────────
router.patch('/:id/dismiss', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE public.notifications
       SET is_dismissed = true, is_read = true, updated_at = now()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, req.userId]
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[NOTIFICATIONS] dismiss error:', err);
    res.status(500).json({ error: 'Failed to dismiss notification' });
  }
});

export default router;
