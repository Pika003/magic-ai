
import React, { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { CorrectSentence } from '@/components/CorrectSentence';
import { TodaysUpdate } from '@/components/TodaysUpdate';
import { LandingPage } from '@/components/LandingPage';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user, loading } = useAuth();
  const [activeSection, setActiveSection] = useState('correct-sentence');

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
        <Navigation activeSection={activeSection} setActiveSection={setActiveSection} />
        <LandingPage />
      </>
    );
  }

  // Show main app for authenticated users
  const renderActiveSection = () => {
    switch (activeSection) {
      case 'correct-sentence':
        return <CorrectSentence />;
      case 'todays-update':
        return <TodaysUpdate />;
      default:
        return <CorrectSentence />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navigation activeSection={activeSection} setActiveSection={setActiveSection} />
      <div className="pt-16">
        {renderActiveSection()}
      </div>
    </div>
  );
};

export default Index;
