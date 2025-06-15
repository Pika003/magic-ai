
import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const UsageStatsCard = () => {
  const { user } = useAuth();
  const [totalUsage, setTotalUsage] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUsageStats = async () => {
    if (!user) return;

    try {
      const { data: totalData, error: totalError } = await supabase.rpc('get_total_usage', {
        p_user_id: user.id
      });
      if (totalError) throw totalError;
      setTotalUsage(totalData || 0);
    } catch (error) {
      console.error('Error fetching usage stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsageStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const usagePercentage = Math.min((totalUsage / 50) * 100, 100);

  return (
    <div className="p-6 border rounded-lg bg-white flex flex-col gap-3 h-full min-w-[250px]">
      <div className="flex justify-between items-center">
        <span className="text-base font-medium text-slate-700">Total Usage</span>
        <span className={`text-sm font-bold ${totalUsage >= 50 ? 'text-red-600' : totalUsage >= 40 ? 'text-orange-600' : 'text-green-600'}`}>
          {loading ? '-' : `${totalUsage} / 50`}
        </span>
      </div>
      <Progress 
        value={usagePercentage}
        className={`h-3 ${totalUsage >= 50 ? 'bg-red-100' : totalUsage >= 40 ? 'bg-orange-100' : 'bg-green-100'}`}
      />
    </div>
  );
};
