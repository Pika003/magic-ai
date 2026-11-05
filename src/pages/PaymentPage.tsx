import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/apiClient';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { usePaidStatus } from '@/contexts/PaidStatusContext';

// Razorpay global type (loaded via CDN script)
declare global {
  interface Window {
    Razorpay: any;
  }
}

const PLAN = {
  name: "Lifetime Unlimited",
  priceINR: 499,      // ₹499 one-time
  priceDisplay: "₹499",
  currency: "INR",
  features: [
    "Unlimited feature usage – forever",
    "One-time payment, no renewal",
    "Thank you for your support!"
  ]
};

/** Dynamically load the Razorpay checkout script once */
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export const PaymentPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { refreshPaidStatus, isPaidUser } = usePaidStatus();

  // Redirect already-paid users straight to profile
  useEffect(() => {
    if (isPaidUser) {
      navigate('/profile');
    }
  }, [isPaidUser, navigate]);

  const handleRazorpayPayment = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Load Razorpay SDK
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast({
          title: "Payment Error",
          description: "Failed to load Razorpay. Please check your connection.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // 2. Create order on backend
      const orderData = await api.post<{
        orderId: string;
        amount: number;
        currency: string;
        keyId: string;
      }>('/payment/razorpay/order', {
        planName: PLAN.name,
        amount: PLAN.priceINR * 100, // paise
        currency: PLAN.currency,
      });

      if (!orderData?.orderId) {
        toast({
          title: "Payment Error",
          description: "Failed to create order. Please try again.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // 3. Open Razorpay checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Magic AI",
        description: PLAN.name,
        order_id: orderData.orderId,
        prefill: {
          email: user.email ?? '',
        },
        theme: { color: "#2563EB" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          // 4. Verify payment signature on backend
          try {
            await api.post('/payment/razorpay/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            await refreshPaidStatus();
            toast({
              title: "Thank You! 🎉",
              description: "Payment successful. Unlimited access unlocked!",
              variant: "default"
            });
            setTimeout(() => navigate('/profile'), 1500);
          } catch (verifyErr: any) {
            toast({
              title: "Verification Failed",
              description: verifyErr.message || "Payment received but verification failed. Contact support.",
              variant: "destructive"
            });
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        toast({
          title: "Payment Failed",
          description: response.error?.description || "Payment failed. Please try again.",
          variant: "destructive"
        });
        setLoading(false);
      });
      rzp.open();

    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initialize payment.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">Upgrade for Unlimited Usage</h1>
          <p className="text-lg text-slate-600 mb-4">A one-time payment unlocks all features – forever!</p>
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg inline-block">
            <p className="text-green-700">
              ⭐ Pay just <span className="font-bold">{PLAN.priceDisplay}</span> once, unlock forever. No recurring fees ever. ⭐
            </p>
          </div>
        </div>
        <Card className="shadow-lg border-blue-500">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold">{PLAN.name}</CardTitle>
            <div className="text-3xl font-bold text-blue-600">
              {PLAN.priceDisplay}
            </div>
            <p className="text-sm text-slate-400">One-time · INR · Powered by Razorpay</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <ul className="space-y-3">
              {PLAN.features.map((feature, i) => (
                <li key={i} className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-slate-600">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              onClick={handleRazorpayPayment}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                "Processing..."
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay {PLAN.priceDisplay} &amp; Unlock Forever
                </>
              )}
            </Button>

            <p className="text-xs text-center text-slate-400">
              Secure payment via Razorpay · UPI, Cards, Net Banking accepted
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentPage;
