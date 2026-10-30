import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// All profile routes require auth
router.use(authenticate);

// ─── GET /api/profile ─────────────────────────────────────────────────────────
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.username, p.paid_user, p.avatar_url,
              u.created_at, u.updated_at
       FROM public.users u
       LEFT JOIN public.profiles p ON p.id = u.id
       WHERE u.id = $1`,
      [req.userId]
    );

    if (!result.rows[0]) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    const row = result.rows[0];
    res.json({
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      username: row.username,
      paidUser: row.paid_user,
      avatarUrl: row.avatar_url,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  } catch (err) {
    console.error('[PROFILE] GET error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// ─── PATCH /api/profile ───────────────────────────────────────────────────────
router.patch('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { fullName, username, avatarUrl } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Update users table
    await client.query(
      `UPDATE public.users
       SET full_name = COALESCE($1, full_name),
           username  = COALESCE($2, username),
           updated_at = now()
       WHERE id = $3`,
      [fullName ?? null, username ?? null, req.userId]
    );

    // Update profiles table
    await client.query(
      `UPDATE public.profiles
       SET avatar_url = COALESCE($1, avatar_url),
           updated_at = now()
       WHERE id = $2`,
      [avatarUrl ?? null, req.userId]
    );

    await client.query('COMMIT');

    // Return updated profile
    const result = await client.query(
      `SELECT u.id, u.email, u.full_name, u.username, p.paid_user, p.avatar_url
       FROM public.users u
       LEFT JOIN public.profiles p ON p.id = u.id
       WHERE u.id = $1`,
      [req.userId]
    );

    const row = result.rows[0];
    res.json({
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      username: row.username,
      paidUser: row.paid_user,
      avatarUrl: row.avatar_url,
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('[PROFILE] PATCH error:', err);
    if (err.code === '23505') {
      res.status(409).json({ error: 'Username already taken' });
    } else {
      res.status(500).json({ error: 'Failed to update profile' });
    }
  } finally {
    client.release();
  }
});

export default router;
