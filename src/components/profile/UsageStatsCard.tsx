
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BarChart3, Zap, AlertTriangle, TrendingUp } from 'lucide-react';
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
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-purple-500" />
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
    <Card className="h-fit">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2 text-lg">
          <TrendingUp className="w-5 h-5 text-purple-500" />
          <span>Usage Statistics</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-slate-700">Total Usage</span>
            <span className={`text-lg font-bold ${hasReachedLimit ? 'text-red-600' : isNearLimit ? 'text-orange-600' : 'text-green-600'}`}>
              {totalUsage} / 50
            </span>
          </div>
          
          <Progress 
            value={usagePercentage} 
            className="h-2"
          />
          
          {hasReachedLimit && (
            <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">Usage limit reached!</p>
                <p className="text-sm text-red-600">Please upgrade to continue using features.</p>
              </div>
            </div>
          )}
          
          {isNearLimit && !hasReachedLimit && (
            <div className="flex items-start space-x-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-orange-800">Approaching limit</p>
                <p className="text-sm text-orange-600">You're close to your usage limit.</p>
              </div>
            </div>
          )}
        </div>

        {featureBreakdown.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-slate-700 text-sm">Feature Breakdown</h4>
            <div className="space-y-2">
              {featureBreakdown.slice(0, 5).map((feature) => (
                <div key={feature.feature_name} className="flex justify-between items-center py-2 px-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-700 capitalize">{feature.feature_name.replace(/-/g, ' ')}</span>
                  <span className="text-sm font-medium text-slate-900">{feature.usage_count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(hasReachedLimit || isNearLimit) && (
          <Button 
            onClick={() => navigate('/payment')}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white"
          >
            <Zap className="w-4 h-4 mr-2" />
            Upgrade Plan
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
