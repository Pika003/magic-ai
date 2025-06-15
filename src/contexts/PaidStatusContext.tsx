
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useUsageTracking } from "@/hooks/useUsageTracking";

interface PaidStatusContextType {
  isPaidUser: boolean;
  loading: boolean;
  refreshPaidStatus: () => Promise<void>;
}

const PaidStatusContext = createContext<PaidStatusContextType | undefined>(undefined);

export const usePaidStatus = () => {
  const ctx = useContext(PaidStatusContext);
  if (!ctx) throw new Error("usePaidStatus must be used within a PaidStatusProvider");
  return ctx;
};

export const PaidStatusProvider = ({ children }: { children: React.ReactNode }) => {
  const { isPaidUser, loading, refreshPaidStatus } = useUsageTracking();

  // Ensure refreshPaidStatus is always up-to-date reference
  const refresh = useCallback(() => refreshPaidStatus(), [refreshPaidStatus]);
  
  // Bubble up paid unlock event to trigger global listeners (incl. paid route re-render).
  useEffect(() => {
    if (isPaidUser) {
      window.dispatchEvent(new Event("sentence-ai-paid-unlock"));
    }
  }, [isPaidUser]);

  return (
    <PaidStatusContext.Provider value={{ isPaidUser, loading, refreshPaidStatus: refresh }}>
      {children}
    </PaidStatusContext.Provider>
  );
};
