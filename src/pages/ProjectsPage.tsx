
import React from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export const ProjectsPage = () => {
  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Projects</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h2 className="text-xl font-semibold mb-2">Project Management Coming Soon!</h2>
        <p className="text-slate-600">
          This section is under construction. Soon you'll be able to create, view, and manage all your projects from here.
        </p>
      </div>
    </Layout>
  );
};
