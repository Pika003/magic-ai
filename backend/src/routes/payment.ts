import { Router, Response } from 'express';
import crypto from 'crypto';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// ─── POST /api/payment/razorpay/order ─────────────────────────────────────────
// Creates a Razorpay order and records a pending payment entry.
router.post('/razorpay/order', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { planName = 'Lifetime Unlimited', amount, currency = 'INR' } = req.body;
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    res.status(500).json({ error: 'Razorpay not configured' });
    return;
  }

  if (!amount || typeof amount !== 'number' || amount <= 0) {
    res.status(400).json({ error: 'Invalid amount' });
    return;
  }

  try {
    const orderData = {
      amount,          // paise (e.g. 49900 for ₹499)
      currency,
      receipt: `order_${Date.now()}`,
      notes: {
        user_id: req.userId,
        plan_name: planName,
      },
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
// Verifies the Razorpay HMAC signature, then marks the user as paid.
router.post('/razorpay/verify', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keySecret) {
    res.status(500).json({ error: 'Razorpay not configured' });
    return;
  }

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    res.status(400).json({ error: 'Missing payment verification fields' });
    return;
  }

  try {
    // Verify HMAC-SHA256 signature: "<orderId>|<paymentId>" signed with key secret
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

    // Update payment record to success
    await pool.query(
      `UPDATE public.payment_records
       SET status = 'success', updated_at = now()
       WHERE payment_id = $1`,
      [razorpayOrderId]
    );

    console.log(`[PAYMENT] User ${req.userId} unlocked via Razorpay (order: ${razorpayOrderId})`);
    res.json({ success: true, message: 'Payment verified. Unlimited access unlocked!' });
  } catch (err: any) {
    console.error('[PAYMENT] Razorpay verify error:', err);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

export default router;
