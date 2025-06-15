
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, CreditCard, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const PLANS = [
  {
    name: "Basic",
    price: 9.99,
    currency: "USD",
    features: [
      "100 additional feature uses",
      "Basic support",
      "Valid for 30 days"
    ]
  },
  {
    name: "Pro", 
    price: 19.99,
    currency: "USD",
    features: [
      "Unlimited feature uses",
      "Priority support",
      "Advanced features",
      "Valid for 30 days"
    ],
    popular: true
  },
  {
    name: "Enterprise",
    price: 49.99,
    currency: "USD", 
    features: [
      "Unlimited everything",
      "24/7 dedicated support",
      "Custom integrations",
      "Valid for 30 days"
    ]
  }
];

export const PaymentPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handleStripePayment = async (plan: typeof PLANS[0]) => {
    if (!user) return;
    
    setLoading(`stripe-${plan.name}`);
    try {
      const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
        body: {
          plan_name: plan.name,
          amount: plan.price * 100, // Convert to cents
          currency: plan.currency.toLowerCase()
        }
      });

      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Stripe payment error:', error);
      toast({
        title: "Payment Error",
        description: "Failed to initialize Stripe payment",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  const handleRazorpayPayment = async (plan: typeof PLANS[0]) => {
    if (!user) return;
    
    setLoading(`razorpay-${plan.name}`);
    try {
      const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: {
          plan_name: plan.name,
          amount: plan.price * 100, // Convert to smallest unit
          currency: 'INR' // Razorpay primarily works with INR
        }
      });

      if (error) throw error;

      // Initialize Razorpay checkout
      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: 'Your App Name',
        description: `${plan.name} Plan Subscription`,
        order_id: data.order_id,
        handler: async (response: any) => {
          // Verify payment on success
          const { error: verifyError } = await supabase.functions.invoke('verify-razorpay-payment', {
            body: {
              order_id: data.order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature
            }
          });
          
          if (!verifyError) {
            toast({
              title: "Payment Successful",
              description: "Your plan has been activated!",
            });
          }
        },
        prefill: {
          email: user.email,
          name: user.user_metadata?.full_name || user.email
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Razorpay payment error:', error);
      toast({
        title: "Payment Error", 
        description: "Failed to initialize Razorpay payment",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">Choose Your Plan</h1>
          <p className="text-xl text-slate-600">Upgrade to continue using our features</p>
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg inline-block">
            <p className="text-red-700">⚠️ You've reached your usage limit of 50 features. Please upgrade to continue.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PLANS.map((plan) => (
            <Card key={plan.name} className={`relative ${plan.popular ? 'border-blue-500 shadow-lg scale-105' : ''}`}>
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <div className="text-3xl font-bold text-blue-600">
                  ${plan.price}
                  <span className="text-sm font-normal text-slate-500">/month</span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-slate-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="space-y-3">
                  <Button
                    onClick={() => handleStripePayment(plan)}
                    disabled={loading !== null}
                    className="w-full bg-black hover:bg-gray-800"
                  >
                    {loading === `stripe-${plan.name}` ? (
                      "Processing..."
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Pay with Stripe
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={() => handleRazorpayPayment(plan)}
                    disabled={loading !== null}
                    variant="outline"
                    className="w-full border-blue-500 text-blue-600 hover:bg-blue-50"
                  >
                    {loading === `razorpay-${plan.name}` ? (
                      "Processing..."
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Pay with Razorpay
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
