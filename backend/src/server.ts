import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

dotenv.config();

import authRouter from './routes/auth';
import profileRouter from './routes/profile';
import projectsRouter from './routes/projects';
import notificationsRouter from './routes/notifications';
import aiRouter from './routes/ai';
import githubRouter from './routes/github';
import gitlabRouter from './routes/gitlab';
import paymentRouter from './routes/payment';
import usageRouter from './routes/usage';
import templatesRouter from './routes/templates';
import dailyUpdatesRouter from './routes/dailyUpdates';
import googleRouter from './routes/google';
import gitActionsRouter from './routes/gitActions';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Security middleware ──────────────────────────────────────────────────────
app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Rate limiting ────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: { error: 'Too many requests, please try again later.' },
});
app.use(globalLimiter);

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: { error: 'Too many AI requests, please slow down.' },
});

// ─── Stripe webhook: needs raw body BEFORE express.json() ────────────────────
app.use(
  '/api/payment/stripe/webhook',
  express.raw({ type: 'application/json' })
);

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/profile', profileRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/ai', aiLimiter, aiRouter);
app.use('/api/github', githubRouter);
app.use('/api/gitlab', gitlabRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/usage', usageRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/daily-updates', dailyUpdatesRouter);
app.use('/api/google', googleRouter);
app.use('/api/git-actions', gitActionsRouter);

// ─── 404 fallback ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Magic AI backend running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Frontend:    ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});

export default app;
