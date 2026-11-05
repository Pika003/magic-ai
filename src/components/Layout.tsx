import React, { useState } from 'react';
import { Navigation } from './Navigation';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/contexts/AuthContext';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-200">
      <Navigation />
      <div className="flex-1 flex">
        {user && (
          <div className="hidden md:block shrink-0">
            <Sidebar
              collapsed={collapsed}
              onToggleCollapse={() => setCollapsed(!collapsed)}
            />
          </div>
        )}
        <main
          className={`flex-1 min-w-0 transition-all duration-300 ${
            user ? (collapsed ? 'md:pl-20' : 'md:pl-64') : ''
          }`}
        >
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
