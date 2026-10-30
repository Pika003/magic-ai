import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ─── POST /api/payment/stripe/checkout ────────────────────────────────────────
router.post('/stripe/checkout', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { planName = 'Lifetime Unlimited', amount = 500, currency = 'usd' } = req.body;
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeKey) {
    res.status(500).json({ error: 'Stripe not configured' });
    return;
  }

  try {
    // Get user email
    const userResult = await pool.query('SELECT email FROM public.users WHERE id = $1', [req.userId]);
    const email = userResult.rows[0]?.email;

    // Create Stripe checkout session via REST API (no SDK dependency)
    const params = new URLSearchParams({
      'payment_method_types[]': 'card',
      'line_items[0][price_data][currency]': currency,
      'line_items[0][price_data][product_data][name]': planName,
      'line_items[0][price_data][unit_amount]': String(amount),
      'line_items[0][quantity]': '1',
      mode: 'payment',
      success_url: process.env.STRIPE_SUCCESS_URL || `${FRONTEND_URL}/payment?payment=success`,
      cancel_url: process.env.STRIPE_CANCEL_URL || `${FRONTEND_URL}/payment`,
      'metadata[user_id]': req.userId!,
      'metadata[plan_name]': planName,
      ...(email ? { customer_email: email } : {}),
    });

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const session: any = await response.json();
    if (!response.ok) {
      throw new Error(session.error?.message || 'Stripe session creation failed');
    }

    // Record payment attempt
    await pool.query(
      `INSERT INTO public.payment_records (user_id, payment_provider, payment_id, amount, currency, status)
       VALUES ($1, 'stripe', $2, $3, $4, 'pending')`,
      [req.userId, session.id, amount / 100, currency.toUpperCase()]
    );

    res.json({ url: session.url });
  } catch (err: any) {
    console.error('[PAYMENT] Stripe checkout error:', err);
    res.status(500).json({ error: err.message || 'Failed to create checkout session' });
  }
});

// ─── POST /api/payment/stripe/webhook ─────────────────────────────────────────
// IMPORTANT: This route must receive RAW body — mount it with express.raw() in server.ts
router.post(
  '/stripe/webhook',
  async (req: Request, res: Response): Promise<void> => {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      res.status(500).json({ error: 'Webhook secret not configured' });
      return;
    }

    const sig = req.headers['stripe-signature'] as string;
    const rawBody = req.body as Buffer;

    // Verify Stripe signature manually
    let event: any;
    try {
      // Stripe signature format: t=timestamp,v1=signature
      const parts = sig.split(',');
      const timestamp = parts.find((p) => p.startsWith('t='))?.split('=')[1];
      const v1 = parts.find((p) => p.startsWith('v1='))?.split('=')[1];

      const payload = `${timestamp}.${rawBody.toString()}`;
      const expected = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      if (expected !== v1) {
        res.status(400).json({ error: 'Invalid signature' });
        return;
      }

      event = JSON.parse(rawBody.toString());
    } catch (err) {
      res.status(400).json({ error: 'Webhook verification failed' });
      return;
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata?.user_id;

      if (userId) {
        try {
          await pool.query(
            'UPDATE public.profiles SET paid_user = true, updated_at = now() WHERE id = $1',
            [userId]
          );
          await pool.query(
            `UPDATE public.payment_records SET status = 'success', updated_at = now()
             WHERE payment_id = $1`,
            [session.id]
          );
          console.log(`[PAYMENT] User ${userId} unlocked via Stripe`);
        } catch (err) {
          console.error('[PAYMENT] Failed to unlock user:', err);
        }
      }
    }

    res.json({ received: true });
  }
);

// ─── POST /api/payment/razorpay/order ─────────────────────────────────────────
router.post('/razorpay/order', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { planName = 'Lifetime Unlimited', amount, currency = 'INR' } = req.body;
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    res.status(500).json({ error: 'Razorpay not configured' });
    return;
  }

  try {
    const orderData = {
      amount: amount, // paise
      currency,
      receipt: `order_${Date.now()}`,
      notes: { user_id: req.userId, plan_name: planName },
    };

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
      },
      body: JSON.stringify(orderData),
    });

    const order: any = await response.json();
    if (!response.ok) {
      throw new Error(order.error?.description || 'Failed to create Razorpay order');
    }

    // Record payment attempt
    await pool.query(
      `INSERT INTO public.payment_records (user_id, payment_provider, payment_id, amount, currency, status)
       VALUES ($1, 'razorpay', $2, $3, $4, 'pending')`,
      [req.userId, order.id, amount / 100, currency]
    );

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
    });
  } catch (err: any) {
    console.error('[PAYMENT] Razorpay order error:', err);
    res.status(500).json({ error: err.message || 'Failed to create order' });
  }
});

// ─── POST /api/payment/razorpay/verify ────────────────────────────────────────
router.post('/razorpay/verify', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keySecret) {
    res.status(500).json({ error: 'Razorpay not configured' });
    return;
  }

  try {
    // Verify HMAC signature
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expected = crypto
      .createHmac('sha256', keySecret)
      .update(body)
      .digest('hex');

    if (expected !== razorpaySignature) {
      res.status(400).json({ error: 'Invalid payment signature' });
      return;
    }

    // Mark user as paid
    await pool.query(
      'UPDATE public.profiles SET paid_user = true, updated_at = now() WHERE id = $1',
      [req.userId]
    );

    // Update payment record
    await pool.query(
      `UPDATE public.payment_records
       SET status = 'success', updated_at = now()
       WHERE payment_id = $1`,
      [razorpayOrderId]
    );

    console.log(`[PAYMENT] User ${req.userId} unlocked via Razorpay`);
    res.json({ success: true, message: 'Payment verified. Unlimited access unlocked!' });
  } catch (err: any) {
    console.error('[PAYMENT] Razorpay verify error:', err);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

export default router;
