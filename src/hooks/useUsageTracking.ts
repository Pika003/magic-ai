
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export const useUsageTracking = () => {
  const { user } = useAuth();
  const [totalUsage, setTotalUsage] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchTotalUsage = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.rpc('get_total_usage', {
        p_user_id: user.id
      });
      
      if (error) throw error;
      setTotalUsage(data || 0);
    } catch (error) {
      console.error('Error fetching usage:', error);
    }
  };

  const incrementUsage = async (featureName: string): Promise<boolean> => {
    if (!user) return false;

    // Check if user has reached limit before incrementing
    if (totalUsage >= 50) {
      toast({
        title: "Usage Limit Reached",
        description: "You've reached your usage limit. Please upgrade to continue.",
        variant: "destructive"
      });
      return false;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('increment_feature_usage', {
        p_user_id: user.id,
        p_feature_name: featureName
      });
      
      if (error) throw error;
      
      await fetchTotalUsage(); // Refresh total usage
      return true;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      toast({
        title: "Error",
        description: "Failed to track usage",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTotalUsage();
  }, [user]);

  return {
    totalUsage,
    loading,
    incrementUsage,
    fetchTotalUsage,
    hasReachedLimit: totalUsage >= 50
  };
};
