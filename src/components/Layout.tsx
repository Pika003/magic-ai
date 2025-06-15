
import React from 'react';
import { Navigation } from './Navigation';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/contexts/AuthContext';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      <div className="flex pt-0">
        {user && (
          <div className="w-64 shrink-0">
            <Sidebar />
          </div>
        )}
        <main className="flex-1 pt-10 px-2 md:px-4">
          {/* Wrap children in a max-w-7xl container and center */}
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
