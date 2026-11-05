import React from 'react';
import { Button } from '@/components/ui/button';
import { GitBranch, ShoppingBag } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  {
    path: '/version-control',
    label: 'Version Control',
    description: 'GitHub & GitLab tools',
    icon: GitBranch,
    matchPrefix: '/version-control',
  },
  {
    path: '/action-marketplace',
    label: 'Action Marketplace',
    description: 'CI/CD workflow templates',
    icon: ShoppingBag,
    matchPrefix: '/action-marketplace',
  },
];

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 shadow-sm z-40 pt-16">
      <div className="p-6">
        <nav className="space-y-2">
          {NAV_ITEMS.map(({ path, label, description, icon: Icon, matchPrefix }) => {
            const isActive = location.pathname.startsWith(matchPrefix);
            return (
              <Button
                key={path}
                variant={isActive ? 'default' : 'ghost'}
                onClick={() => navigate(path)}
                className={`w-full justify-start h-12 px-3 transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-md'
                    : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                <Icon className="w-5 h-5 mr-3 shrink-0" />
                <div className="text-left">
                  <div className="font-medium">{label}</div>
                  <div className={`text-xs ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                    {description}
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
