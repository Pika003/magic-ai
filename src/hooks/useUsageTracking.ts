
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface ProfileStatus {
  paid_user: boolean;
}

// Create a global event for paid unlocks
const PAID_UNLOCK_EVENT = "sentence-ai-paid-unlock";

export const useUsageTracking = () => {
  const { user } = useAuth();
  const [totalUsage, setTotalUsage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isPaidUser, setIsPaidUser] = useState(false);
  const [resetDate, setResetDate] = useState<Date | null>(null);

  // Get user's paid status & usage reset date on mount & after payment
  const fetchUserStatus = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('paid_user')
        .eq('id', user.id)
        .maybeSingle();
      if (!error && data) {
        setIsPaidUser(!!data.paid_user);
      }
    } catch (e) {
      // fail silently, keep default false
    }
  };

  const fetchTotalUsage = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('paid_user')
        .eq('id', user.id)
        .maybeSingle();

      setIsPaidUser(!!profile?.paid_user);

      const { data, error } = await supabase.rpc('get_total_usage', {
        p_user_id: user.id
      });
      if (error) throw error;
      setTotalUsage(data || 0);

      // fetch a feature_usage record for this user to get reset_date
      const usageRow = await supabase
        .from('feature_usage')
        .select('reset_date')
        .eq('user_id', user.id)
        .maybeSingle();
      if (usageRow.data?.reset_date) {
        setResetDate(new Date(usageRow.data.reset_date));
      } else {
        setResetDate(null);
      }
    } catch (error) {
      console.error('Error fetching usage:', error);
    }
  };

  // Called when using a feature. Fails if over limit and not paid user.
  const incrementUsage = async (featureName: string): Promise<boolean> => {
    if (!user) return false;

    await fetchUserStatus();
    if (isPaidUser) return true;

    // Monthly limit logic for free user
    if (totalUsage >= 50) {
      toast({
        title: "Usage Limit Reached",
        description: "You've reached your free usage limit for this month. Please upgrade to unlimited.",
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

      await fetchTotalUsage();
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

  // After upgrade, this fetch will reload paid_user state,
  // and fire a GLOBAL event to all listeners to refetch paid status.
  const refreshPaidStatus = async () => {
    await fetchUserStatus();
    await fetchTotalUsage();
    window.dispatchEvent(new Event(PAID_UNLOCK_EVENT));
  };

  useEffect(() => {
    fetchTotalUsage();
    // Listen for global paid status change events
    const listener = () => {
      fetchTotalUsage();
    };
    window.addEventListener(PAID_UNLOCK_EVENT, listener);
    return () => {
      window.removeEventListener(PAID_UNLOCK_EVENT, listener);
    };
    // We want to fire when user changes as well
  }, [user]);

  return {
    totalUsage,
    loading,
    incrementUsage,
    fetchTotalUsage,
    hasReachedLimit: !isPaidUser && totalUsage >= 50,
    isPaidUser,
    resetDate,
    refreshPaidStatus // Add this so consumers can force refresh after payment.
  };
};

