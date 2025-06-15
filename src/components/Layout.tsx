
import React from 'react';
import { Navigation } from './Navigation';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const location = useLocation();

  // Apply extra top padding for Version Control page
  const isVersionControl = location.pathname === '/version-control';

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      <div className="flex pt-0">
        {user && (
          <div className="w-64 shrink-0">
            <Sidebar />
          </div>
        )}
        <main
          className={`
            flex-1
            ${isVersionControl ? 'pt-10' : 'pt-6'}
            px-4 md:px-6
            transition-all
          `}
        >
          {children}
        </main>
      </div>
    </div>
  );
};
