import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface UsageData {
  totalUsage: number;
  isPaidUser: boolean;
  resetDate: Date | null;
  freeLimit: number;
}

const PAID_UNLOCK_EVENT = 'sentence-ai-paid-unlock';

export const useUsageTracking = () => {
  const { user } = useAuth();
  const [totalUsage, setTotalUsage] = useState(0);
  const [isPaidUser, setIsPaidUser] = useState(true); // optimistic default
  const [resetDate, setResetDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchTotalUsage = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await api.get<UsageData>('/usage');
      setTotalUsage(data.totalUsage ?? 0);
      setIsPaidUser(data.isPaidUser ?? false);
      setResetDate(data.resetDate ? new Date(data.resetDate) : null);
    } catch (err) {
      console.error('Error fetching usage:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  /** Called when using a feature. Returns false if limit reached. */
  const incrementUsage = async (featureName: string): Promise<boolean> => {
    if (!user) return false;

    // Paid users are always allowed
    if (isPaidUser) return true;

    // Client-side guard before the server call
    if (totalUsage >= 50) {
      toast({
        title: 'Usage Limit Reached',
        description:
          "You've reached your free usage limit for this month. Please upgrade to unlimited.",
        variant: 'destructive',
      });
      return false;
    }

    try {
      await api.post('/usage/increment', { featureName });
      await fetchTotalUsage();
      return true;
    } catch (err: any) {
      if (err?.status === 429) {
        toast({
          title: 'Usage Limit Reached',
          description:
            "You've reached your free usage limit for this month. Please upgrade to unlimited.",
          variant: 'destructive',
        });
        return false;
      }
      toast({ title: 'Error', description: 'Failed to track usage', variant: 'destructive' });
      return false;
    }
  };

  /** Force-refresh paid status (called after payment) */
  const refreshPaidStatus = async () => {
    await fetchTotalUsage();
    window.dispatchEvent(new Event(PAID_UNLOCK_EVENT));
  };

  useEffect(() => {
    fetchTotalUsage();

    const listener = () => fetchTotalUsage();
    window.addEventListener(PAID_UNLOCK_EVENT, listener);
    return () => window.removeEventListener(PAID_UNLOCK_EVENT, listener);
  }, [user, fetchTotalUsage]);

  return {
    totalUsage,
    loading,
    incrementUsage,
    fetchTotalUsage,
    hasReachedLimit: !isPaidUser && totalUsage >= 50,
    isPaidUser,
    resetDate,
    refreshPaidStatus,
  };
};
