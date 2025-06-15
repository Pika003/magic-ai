
import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { useUsageTracking } from '@/hooks/useUsageTracking';

export const UsageStatsCard = () => {
  const { totalUsage, loading, fetchTotalUsage } = useUsageTracking();

  // Refresh usage stats every 10 seconds to show real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTotalUsage();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchTotalUsage]);

  const usagePercentage = Math.min((totalUsage / 50) * 100, 100);

  return (
    <div className="p-6 border rounded-lg bg-white flex flex-col justify-center gap-4 h-full w-full">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-slate-700 mb-2">Usage Statistics</h3>
        <p className="text-sm text-slate-500 mb-4">Monthly API usage tracking</p>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-slate-600">Total Usage</span>
          <span className={`text-sm font-bold ${totalUsage >= 50 ? 'text-red-600' : totalUsage >= 40 ? 'text-orange-600' : 'text-green-600'}`}>
            {loading ? '-' : `${totalUsage} / 50`}
          </span>
        </div>
        
        <Progress 
          value={usagePercentage}
          className={`h-3 ${totalUsage >= 50 ? 'bg-red-100' : totalUsage >= 40 ? 'bg-orange-100' : 'bg-green-100'}`}
        />
        
        <div className="text-xs text-slate-400 text-center">
          {loading ? 'Loading...' : `${Math.round(usagePercentage)}% of monthly limit used`}
        </div>
        
        <div className="text-xs text-slate-500 text-center">
          Updates every 10 seconds
        </div>
      </div>
    </div>
  );
};
