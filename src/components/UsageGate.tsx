
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUsageTracking } from '@/hooks/useUsageTracking';

interface UsageGateProps {
  children: React.ReactNode;
  featureName: string;
  bypassCheck?: boolean;
}

export const UsageGate: React.FC<UsageGateProps> = ({ 
  children, 
  featureName, 
  bypassCheck = false 
}) => {
  const navigate = useNavigate();
  const { hasReachedLimit, incrementUsage } = useUsageTracking();

  const handleFeatureUse = async () => {
    if (bypassCheck) return;
    
    if (hasReachedLimit) {
      navigate('/payment');
      return;
    }
    
    await incrementUsage(featureName);
  };

  // Wrap children with usage tracking
  return (
    <div onClick={handleFeatureUse}>
      {children}
    </div>
  );
};
