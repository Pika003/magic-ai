
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BarChart3, Zap, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface FeatureUsage {
  feature_name: string;
  usage_count: number;
  last_used_at: string;
}

export const UsageStatsCard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [totalUsage, setTotalUsage] = useState(0);
  const [featureBreakdown, setFeatureBreakdown] = useState<FeatureUsage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsageStats = async () => {
    if (!user) return;
    
    try {
      // Get total usage
      const { data: totalData, error: totalError } = await supabase.rpc('get_total_usage', {
        p_user_id: user.id
      });
      
      if (totalError) throw totalError;
      setTotalUsage(totalData || 0);

      // Get feature breakdown
      const { data: featuresData, error: featuresError } = await supabase
        .from('feature_usage')
        .select('feature_name, usage_count, last_used_at')
        .eq('user_id', user.id)
        .order('usage_count', { ascending: false });
      
      if (featuresError) throw featuresError;
      setFeatureBreakdown(featuresData || []);
    } catch (error) {
      console.error('Error fetching usage stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsageStats();
  }, [user]);

  const usagePercentage = (totalUsage / 50) * 100;
  const isNearLimit = totalUsage >= 40;
  const hasReachedLimit = totalUsage >= 50;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-purple-500" />
            <span>Usage Statistics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">Loading usage stats...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-purple-500" />
          <span>Usage Statistics</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Total Usage</span>
            <span className={`text-sm font-bold ${hasReachedLimit ? 'text-red-600' : isNearLimit ? 'text-orange-600' : 'text-green-600'}`}>
              {totalUsage} / 50
            </span>
          </div>
          
          <Progress 
            value={usagePercentage} 
            className={`h-3 ${hasReachedLimit ? 'bg-red-100' : isNearLimit ? 'bg-orange-100' : 'bg-green-100'}`}
          />
          
          {hasReachedLimit && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-700">Usage limit reached! Please upgrade to continue.</span>
            </div>
          )}
          
          {isNearLimit && !hasReachedLimit && (
            <div className="flex items-center space-x-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <span className="text-sm text-orange-700">You're approaching your usage limit.</span>
            </div>
          )}
        </div>

        {featureBreakdown.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-slate-700">Feature Breakdown</h4>
            {featureBreakdown.map((feature) => (
              <div key={feature.feature_name} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-b-0">
                <span className="text-sm capitalize">{feature.feature_name.replace(/-/g, ' ')}</span>
                <span className="text-sm font-medium text-slate-600">{feature.usage_count} uses</span>
              </div>
            ))}
          </div>
        )}

        {(hasReachedLimit || isNearLimit) && (
          <Button 
            onClick={() => navigate('/payment')}
            className="w-full bg-purple-500 hover:bg-purple-600"
          >
            <Zap className="w-4 h-4 mr-2" />
            Upgrade Plan
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
