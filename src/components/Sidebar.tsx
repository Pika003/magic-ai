
import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Users, Calendar, Briefcase } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const sections = [
    {
      id: 'correct-sentence',
      label: 'Correct Sentence',
      icon: CheckCircle,
      description: 'Instant AI correction',
      path: '/correct-sentence'
    },
    {
      id: 'client-update',
      label: 'Client Update',
      icon: Users,
      description: 'Client communication',
      path: '/client-update'
    },
    {
      id: 'todays-update',
      label: "Today's Update",
      icon: Calendar,
      description: 'Daily updates',
      path: '/todays-update'
    },
    {
      id: 'projects',
      label: "Projects",
      icon: Briefcase,
      description: 'Manage projects',
      path: '/projects'
    }
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 shadow-sm z-40">
      <div className="p-6">
        <div 
          className="flex items-center space-x-3 cursor-pointer mb-8"
          onClick={() => navigate('/')}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">SentenceAI</h1>
        </div>
        
        <nav className="space-y-2">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = location.pathname === section.path;
            
            return (
              <Button
                key={section.id}
                variant={isActive ? "default" : "ghost"}
                onClick={() => navigate(section.path)}
                className={`w-full justify-start h-12 px-3 transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-md' 
                    : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">{section.label}</div>
                  <div className={`text-xs ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                    {section.description}
                  </div>
                </div>
              </Button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
