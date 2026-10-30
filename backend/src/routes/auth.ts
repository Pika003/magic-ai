import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// ─── Helper: sign JWT ─────────────────────────────────────────────────────────
const signToken = (userId: string) =>
  jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: (process.env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']) || '7d',
  });

// ─── POST /api/auth/register ──────────────────────────────────────────────────
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { email, password, fullName, username } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check existing user
    const existing = await client.query(
      'SELECT id FROM public.users WHERE email = $1',
      [email.toLowerCase()]
    );
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'Email already in use' });
      return;
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 12);

    // Insert user
    const userResult = await client.query(
      `INSERT INTO public.users (email, password_hash, full_name, username)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, full_name, username, created_at`,
      [email.toLowerCase(), password_hash, fullName || null, username || null]
    );
    const user = userResult.rows[0];

    // Create profile
    await client.query(
      'INSERT INTO public.profiles (id) VALUES ($1)',
      [user.id]
    );

    await client.query('COMMIT');

    const token = signToken(user.id);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        username: user.username,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[AUTH] Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  } finally {
    client.release();
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.password_hash, u.full_name, u.username, p.paid_user, p.avatar_url
       FROM public.users u
       LEFT JOIN public.profiles p ON p.id = u.id
       WHERE u.email = $1`,
      [email.toLowerCase()]
    );

    const user = result.rows[0];
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = signToken(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        username: user.username,
        paidUser: user.paid_user,
        avatarUrl: user.avatar_url,
      },
    });
  } catch (err) {
    console.error('[AUTH] Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.username, p.paid_user, p.avatar_url
       FROM public.users u
       LEFT JOIN public.profiles p ON p.id = u.id
       WHERE u.id = $1`,
      [req.userId]
    );

    const user = result.rows[0];
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      username: user.username,
      paidUser: user.paid_user,
      avatarUrl: user.avatar_url,
    });
  } catch (err) {
    console.error('[AUTH] Me error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
// JWT is stateless — client simply discards the token.
// This endpoint exists as a clean hook for future token blacklisting.
router.post('/logout', authenticate, (_req: AuthRequest, res: Response) => {
  res.json({ message: 'Logged out successfully' });
});

export default router;
