import React, { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { LandingPage } from '@/components/LandingPage';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [userToken, setUserToken] = useState<string | null>(null);
  const [isSlackConnected, setIsSlackConnected] = useState(false);


  // This effect must always be called
  React.useEffect(() => {
    if (user && !loading) {
      navigate('/correct-sentence');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('slack_user_token');
    if (tokenFromUrl) {
      setUserToken(tokenFromUrl);
      setIsSlackConnected(true);
      localStorage.setItem('slack_user_token', tokenFromUrl);
      // Clean up the URL
      params.delete('slack_user_token');
      window.history.replaceState({}, document.title, window.location.pathname + (params.toString() ? '?' + params.toString() : ''));
    } else {
      // If not in URL, check localStorage
      const tokenFromStorage = localStorage.getItem('slack_user_token');
      if (tokenFromStorage) {
        setUserToken(tokenFromStorage);
        setIsSlackConnected(true);
      }
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show landing page for non-authenticated users
  if (!user) {
    return (
      <>
        <Navigation />
        <LandingPage />
      </>
    );
  }

  // For authenticated users, show a spinner (since we redirect in useEffect)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navigation />
      <div className="pt-16 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    </div>
  );
};

export default Index;
