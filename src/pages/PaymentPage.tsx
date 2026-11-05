import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  CreditCard,
  Sparkles,
  ShieldCheck,
  Zap,
  HelpCircle,
  Lock,
  ArrowRight,
  Clock,
  Layers,
  Infinity,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/apiClient';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { usePaidStatus } from '@/contexts/PaidStatusContext';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const PLAN = {
  name: "Lifetime Unlimited Pro",
  priceINR: 499,
  originalPriceINR: 1999,
  priceDisplay: "₹499",
  currency: "INR",
  features: [
    "Unlimited Conventional Commit & PR generations",
    "Unlimited Agile Daily Standup & Slack summaries",
    "Unlimited Client Progress Digests & Milestone reports",
    "Full access to CI/CD Action Marketplace templates",
    "GitHub & GitLab OAuth branch & commit automation",
    "One-click AI README generator with direct commit",
    "Custom Structure Templates saved to your cloud profile",
    "All future updates & AI models included — No renewals ever",
  ],
};

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
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please log in before upgrading your account.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);

    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast({
          title: "Payment Error",
          description: "Failed to load Razorpay SDK. Please check your internet connection.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const orderData = await api.post<{
        orderId: string;
        amount: number;
        currency: string;
        keyId: string;
      }>('/payment/razorpay/order', {
        planName: PLAN.name,
        amount: PLAN.priceINR * 100,
        currency: PLAN.currency,
      });

      if (!orderData?.orderId) {
        toast({
          title: "Order Failed",
          description: "Failed to create payment order. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

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
        theme: { color: "#4f46e5" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            await api.post('/payment/razorpay/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            await refreshPaidStatus();
            toast({
              title: "Payment Verified! 🎉",
              description: "Welcome to Lifetime Pro! Unlimited access has been unlocked.",
            });
            setTimeout(() => navigate('/profile'), 1500);
          } catch (verifyErr: any) {
            toast({
              title: "Verification Notice",
              description: verifyErr.message || "Payment processed. Refreshing account status.",
              variant: "destructive",
            });
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        toast({
          title: "Payment Failed",
          description: response.error?.description || "Payment failed or cancelled.",
          variant: "destructive",
        });
        setLoading(false);
      });
      rzp.open();
    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initialize payment.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-16">
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-semibold px-3 py-1">
          ⚡ One-Time Lifetime License
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Supercharge Your Workflow Forever
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
          Say goodbye to monthly subscriptions. Pay once, use unlimited AI tools, CI/CD templates, and repository sync forever.
        </p>
      </div>

      {/* Main Pricing Box */}
      <div className="relative rounded-3xl border-2 border-indigo-500/40 bg-gradient-to-b from-card via-card to-indigo-950/20 p-6 sm:p-10 shadow-2xl overflow-hidden">
        {/* Glow blur element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-center">
          {/* Left: Perks list (3 cols) */}
          <div className="md:col-span-3 space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight">{PLAN.name}</h3>
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]">
                  Save 75%
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Zero recurring fees. Instant unlock for your account.
              </p>
            </div>

            <ul className="space-y-2.5 pt-2">
              {PLAN.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Checkout card (2 cols) */}
          <div className="md:col-span-2 p-6 rounded-2xl border border-border/80 bg-background/80 backdrop-blur-md shadow-lg space-y-5 text-center">
            <div>
              <p className="text-xs text-muted-foreground line-through">Regular: ₹{PLAN.originalPriceINR}/year</p>
              <div className="flex items-baseline justify-center gap-1.5 mt-1">
                <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
                  {PLAN.priceDisplay}
                </span>
                <span className="text-xs text-muted-foreground font-medium">/ lifetime</span>
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                One-time payment • Never renews
              </p>
            </div>

            <Button
              onClick={handleRazorpayPayment}
              disabled={loading}
              size="lg"
              className="w-full h-12 text-sm font-bold bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 rounded-xl gap-2"
            >
              {loading ? (
                "Processing payment..."
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Unlock Unlimited for {PLAN.priceDisplay}</span>
                </>
              )}
            </Button>

            <div className="space-y-2 text-[11px] text-muted-foreground border-t border-border/60 pt-3">
              <div className="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <ShieldCheck className="w-4 h-4" />
                <span>100% Secure Checkout via Razorpay</span>
              </div>
              <p className="text-[10px]">
                Accepts UPI (Google Pay, PhonePe, Paytm), Credit & Debit Cards, NetBanking.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Plan comparison: Free vs Lifetime Pro */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-center">Free Tier vs Lifetime Pro</h3>
        <div className="rounded-xl border border-border/70 overflow-hidden bg-card text-xs">
          <div className="grid grid-cols-3 p-3 bg-muted/60 font-semibold border-b border-border/70">
            <span>Feature</span>
            <span className="text-center">Free Tier</span>
            <span className="text-center text-indigo-600 dark:text-indigo-400 font-bold">Lifetime Pro (₹499)</span>
          </div>
          {[
            { name: "Monthly AI feature calls", free: "50 / month", pro: "Unlimited forever" },
            { name: "Conventional Commit Studio", free: "Included (capped)", pro: "Unlimited" },
            { name: "Daily Standup Formatter", free: "Included (capped)", pro: "Unlimited" },
            { name: "Action Marketplace CI/CD", free: "Included", pro: "Unlimited commits" },
            { name: "AI README Generator", free: "Included (capped)", pro: "Unlimited commits" },
            { name: "Structure Templates", free: "Standard presets", pro: "Custom presets + Cloud sync" },
            { name: "Future AI Models & Features", free: "Standard", pro: "Priority access" },
          ].map((row, i) => (
            <div
              key={i}
              className={`grid grid-cols-3 p-3 items-center border-b border-border/40 ${
                i % 2 === 1 ? "bg-muted/20" : ""
              }`}
            >
              <span className="font-medium text-foreground">{row.name}</span>
              <span className="text-center text-muted-foreground">{row.free}</span>
              <span className="text-center font-semibold text-emerald-600 dark:text-emerald-400">{row.pro}</span>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="space-y-4 max-w-2xl mx-auto">
        <h3 className="text-lg font-bold text-center">Frequently Asked Questions</h3>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-xs sm:text-sm font-semibold">
              Is this really a one-time payment?
            </AccordionTrigger>
            <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
              Yes, absolutely. You pay ₹499 once, and your account is marked as a lifetime paid user permanently. There are no monthly recurring fees or hidden charges.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger className="text-xs sm:text-sm font-semibold">
              Which payment methods are supported?
            </AccordionTrigger>
            <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
              Our payment gateway is powered by Razorpay. We support UPI (Google Pay, PhonePe, Paytm, BHIM), all major Credit/Debit cards (Visa, Mastercard, RuPay, Amex), and 50+ NetBanking options.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger className="text-xs sm:text-sm font-semibold">
              How quickly is my unlimited access activated?
            </AccordionTrigger>
            <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
              Immediately. As soon as the Razorpay transaction succeeds, your profile's paid status is verified cryptographically and unlocked instantly.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};

export default PaymentPage;
