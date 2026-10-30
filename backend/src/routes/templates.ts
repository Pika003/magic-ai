import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// ─── GET /api/templates ───────────────────────────────────────────────────────
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT id, name, template_content, created_at, updated_at
       FROM public.structure_templates
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[TEMPLATES] GET error:', err);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// ─── POST /api/templates ──────────────────────────────────────────────────────
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, templateContent } = req.body;

  if (!name || !templateContent) {
    res.status(400).json({ error: 'name and templateContent are required' });
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO public.structure_templates (user_id, name, template_content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.userId, name, templateContent]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('[TEMPLATES] POST error:', err);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// ─── PATCH /api/templates/:id ─────────────────────────────────────────────────
router.patch('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, templateContent } = req.body;

  try {
    const result = await pool.query(
      `UPDATE public.structure_templates
       SET name             = COALESCE($1, name),
           template_content = COALESCE($2, template_content),
           updated_at       = now()
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
      [name ?? null, templateContent ?? null, id, req.userId]
    );

    if (!result.rows[0]) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[TEMPLATES] PATCH error:', err);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// ─── DELETE /api/templates/:id ────────────────────────────────────────────────
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM public.structure_templates WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.userId]
    );

    if (!result.rows[0]) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error('[TEMPLATES] DELETE error:', err);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

export default router;
