
import React from 'react';
import { Navigation } from './Navigation';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/contexts/AuthContext';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();

  return (
    <>
      <Navigation />
      {user && <Sidebar />}
      <main className={`pt-16 ${user ? 'ml-64' : ''}`}>
        <div className="container mx-auto px-4 py-8">
          {children}
        </div>
      </main>
    </>
  );
};
