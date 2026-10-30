import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// ─── GET /api/usage ───────────────────────────────────────────────────────────
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [usageResult, profileResult, resetResult] = await Promise.all([
      pool.query('SELECT public.get_total_usage($1) AS total', [req.userId]),
      pool.query('SELECT paid_user FROM public.profiles WHERE id = $1', [req.userId]),
      pool.query(
        `SELECT reset_date FROM public.feature_usage
         WHERE user_id = $1 LIMIT 1`,
        [req.userId]
      ),
    ]);

    res.json({
      totalUsage: usageResult.rows[0]?.total ?? 0,
      isPaidUser: profileResult.rows[0]?.paid_user ?? false,
      resetDate: resetResult.rows[0]?.reset_date ?? null,
      freeLimit: 50,
    });
  } catch (err) {
    console.error('[USAGE] GET error:', err);
    res.status(500).json({ error: 'Failed to fetch usage' });
  }
});

// ─── POST /api/usage/increment ────────────────────────────────────────────────
router.post('/increment', async (req: AuthRequest, res: Response): Promise<void> => {
  const { featureName } = req.body;

  if (!featureName) {
    res.status(400).json({ error: 'featureName is required' });
    return;
  }

  try {
    // Check if paid user first
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

    const result = await pool.query(
      'SELECT public.increment_feature_usage($1, $2) AS new_count',
      [req.userId, featureName]
    );

    res.json({
      success: true,
      newCount: result.rows[0].new_count,
    });
  } catch (err) {
    console.error('[USAGE] increment error:', err);
    res.status(500).json({ error: 'Failed to increment usage' });
  }
});

export default router;
