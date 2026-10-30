
import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Users, Calendar, Briefcase, GitBranch, FileText, GitPullRequest } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePaidStatus } from '@/contexts/PaidStatusContext';

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // const { isPaidUser } = usePaidStatus(); // Commented out for now as Version Control is accessible to all.

  const sections = [
    {
      id: 'correct-sentence',
      label: 'PR & Commit Studio',
      icon: GitPullRequest,
      description: 'Commits, PRs & dev writing',
      path: '/correct-sentence'
    },
    {
      id: 'structure-templates',
      label: 'Structure Templates',
      icon: FileText,
      description: 'Custom formatting',
      path: '/structure-templates'
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
    },
    // Version Control is now visible for all users, not just paid users.
    {
      id: 'version-control',
      label: "Version Control",
      icon: GitBranch,
      description: "GitHub & GitLab tools",
      path: '/version-control'
    }
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 shadow-sm z-40 pt-16">
      <div className="p-6">
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
