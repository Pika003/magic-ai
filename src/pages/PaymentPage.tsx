
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

// ONLY ONE TIME $5 PAYMENT, NO PLANS
const PLAN = {
  name: "Lifetime Unlimited",
  price: 5.00,
  currency: "USD",
  features: [
    "Unlimited feature usage – forever",
    "One-time payment, no renewal",
    "Thank you for your support!"
  ]
};

export const PaymentPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleStripePayment = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Call the payment function for a one-time lifetime unlock
      const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
        body: {
          plan_name: PLAN.name,
          amount: PLAN.price * 100, // cents
          currency: PLAN.currency.toLowerCase()
        }
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        toast({
          title: "Payment Error",
          description: "Failed to initialize checkout.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Payment Error",
        description: "Failed to initialize Stripe payment.",
        variant: "destructive"
      });
    } finally {
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
            <p className="text-green-700">⭐ Pay just <span className="font-bold">${PLAN.price}</span> once, unlock forever. No recurring fees ever. ⭐</p>
          </div>
        </div>
        <Card className={`shadow-lg border-blue-500`}>
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold">{PLAN.name}</CardTitle>
            <div className="text-3xl font-bold text-blue-600">
              ${PLAN.price}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <ul className="space-y-3">
              {PLAN.features.map((feature, i) => (
                <li key={i} className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-slate-600">{feature}</span>
                </li>
              ))}
            </ul>
            
            <Button
              onClick={handleStripePayment}
              disabled={loading}
              className="w-full bg-black hover:bg-gray-900"
            >
              {loading ? (
                "Processing..."
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay & Unlock Forever
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentPage;
