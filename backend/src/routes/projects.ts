import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// ─── GET /api/projects ────────────────────────────────────────────────────────
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT id, name, description, status, client_name, client_email,
              last_update_sent, update_frequency_days, created_at, updated_at
       FROM public.projects
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[PROJECTS] GET error:', err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// ─── POST /api/projects ───────────────────────────────────────────────────────
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, description, status, clientName, clientEmail, updateFrequencyDays } = req.body;

  if (!name) {
    res.status(400).json({ error: 'Project name is required' });
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO public.projects
         (user_id, name, description, status, client_name, client_email, update_frequency_days)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        req.userId,
        name,
        description || null,
        status || 'active',
        clientName || null,
        clientEmail || null,
        updateFrequencyDays || null,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('[PROJECTS] POST error:', err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// ─── PATCH /api/projects/:id ──────────────────────────────────────────────────
router.patch('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, description, status, clientName, clientEmail, updateFrequencyDays, lastUpdateSent } = req.body;

  try {
    const result = await pool.query(
      `UPDATE public.projects
       SET name                  = COALESCE($1, name),
           description           = COALESCE($2, description),
           status                = COALESCE($3, status),
           client_name           = COALESCE($4, client_name),
           client_email          = COALESCE($5, client_email),
           update_frequency_days = COALESCE($6, update_frequency_days),
           last_update_sent      = COALESCE($7, last_update_sent),
           updated_at            = now()
       WHERE id = $8 AND user_id = $9
       RETURNING *`,
      [
        name ?? null,
        description ?? null,
        status ?? null,
        clientName ?? null,
        clientEmail ?? null,
        updateFrequencyDays ?? null,
        lastUpdateSent ?? null,
        id,
        req.userId,
      ]
    );

    if (!result.rows[0]) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[PROJECTS] PATCH error:', err);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// ─── DELETE /api/projects/:id ─────────────────────────────────────────────────
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM public.projects WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.userId]
    );

    if (!result.rows[0]) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error('[PROJECTS] DELETE error:', err);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;
