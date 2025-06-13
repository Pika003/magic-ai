
import React, { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { CorrectSentence } from '@/components/CorrectSentence';
import { ClientUpdate } from '@/components/ClientUpdate';
import { TodaysUpdate } from '@/components/TodaysUpdate';

const Index = () => {
  const [activeSection, setActiveSection] = useState('correct-sentence');

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'correct-sentence':
        return <CorrectSentence />;
      case 'client-update':
        return <ClientUpdate />;
      case 'todays-update':
        return <TodaysUpdate />;
      default:
        return <CorrectSentence />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navigation 
        activeSection={activeSection} 
        setActiveSection={setActiveSection} 
      />
      <main className="pt-20 pb-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              {renderActiveSection()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
