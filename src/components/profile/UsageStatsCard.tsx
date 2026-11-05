import React from 'react';
import { Progress } from '@/components/ui/progress';
import { useUsageTracking } from '@/hooks/useUsageTracking';
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Sparkles, RefreshCw, Zap, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export const UsageStatsCard = () => {
  const { totalUsage, loading, isPaidUser, resetDate, fetchTotalUsage } = useUsageTracking();
  const navigate = useNavigate();

  // If paid, show unlimited status
  if (isPaidUser) {
    return (
      <Card className="border-border/70 shadow-sm bg-gradient-to-br from-card via-card to-amber-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Usage & Tier</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Your current plan limits and allocation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Active Plan
            </p>
            <p className="text-xl font-extrabold text-foreground mt-1 flex items-center justify-center gap-1.5">
              <span>Unlimited Pro</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Lifetime license active. Zero restrictions on AI features.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs h-8 gap-1.5 border-border"
            onClick={fetchTotalUsage}
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Usage Status</span>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const usagePercentage = Math.min(((totalUsage || 0) / 50) * 100, 100);
  const remaining = Math.max(50 - (totalUsage || 0), 0);

  return (
    <Card className="border-border/70 shadow-sm bg-card/80">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center justify-between">
          <span>Free Usage Limits</span>
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
            {totalUsage} / 50
          </span>
        </CardTitle>
        <CardDescription className="text-xs">
          Monthly quota resets {resetDate ? `on ${resetDate.toLocaleDateString()}` : 'each calendar month'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Used this month</span>
            <span className="font-semibold text-foreground">{Math.round(usagePercentage)}%</span>
          </div>
          <Progress
            value={usagePercentage}
            className="h-2 bg-muted"
          />
          <div className="flex justify-between items-center text-[11px] text-muted-foreground">
            <span>{remaining} queries remaining</span>
            <span>50 max limit</span>
          </div>
        </div>

        <div className="pt-2">
          <Button
            size="sm"
            onClick={() => navigate('/payment')}
            className="w-full h-8 text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Upgrade to Unlimited (₹499)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
