
import React from 'react';
import { Navigation } from './Navigation';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Navigation />
      <main className="pt-20">
        <div className="container mx-auto px-4 py-8">
          {children}
        </div>
      </main>
    </>
  );
};
