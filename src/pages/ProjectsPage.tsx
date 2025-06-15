
import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { ProjectForm } from '@/components/projects/ProjectForm';
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from '@/services/projectService';
import type { Project, CreateProjectData, UpdateProjectData } from '@/types/project';

export const ProjectsPage = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const projectsData = await getProjects(user.id);
      setProjects(projectsData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch projects',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (data: CreateProjectData) => {
    if (!user) return;
    setFormLoading(true);
    try {
      const result = await createProject(user.id, data);
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Project created successfully',
        });
        setFormOpen(false);
        fetchProjects();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to create project',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create project',
        variant: 'destructive',
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditProject = async (data: CreateProjectData & { status?: Project['status'] }) => {
    if (!editingProject) return;
    setFormLoading(true);
    try {
      const result = await updateProject(editingProject.id, data as UpdateProjectData);
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Project updated successfully',
        });
        setFormOpen(false);
        setEditingProject(null);
        fetchProjects();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update project',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update project',
        variant: 'destructive',
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    
    try {
      const result = await deleteProject(projectId);
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Project deleted successfully',
        });
        fetchProjects();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to delete project',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete project',
        variant: 'destructive',
      });
    }
  };

  const handleSendUpdate = (project: Project) => {
    toast({
      title: 'Feature Coming Soon',
      description: 'Client update integration will be available soon',
    });
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const openCreateForm = () => {
    setEditingProject(null);
    setFormOpen(true);
  };

  const openEditForm = (project: Project) => {
    setEditingProject(project);
    setFormOpen(true);
  };

  return (
    <Layout>
      <div className="w-full px-2 md:px-4 pt-10">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Projects</h1>
              <p className="text-slate-600 mt-1">Manage your client projects and track progress</p>
            </div>
            <Button onClick={openCreateForm} className="bg-blue-500 hover:bg-blue-600">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>

          {/* Search and Filter Section */}
          <div className="flex gap-4 items-center mb-8">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-slate-200 focus:border-blue-500"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] border-slate-200">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Content Section */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading projects...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PlusCircle className="w-8 h-8 text-slate-400" />
                </div>
                <h2 className="text-xl font-semibold mb-2 text-slate-800">
                  {projects.length === 0 ? 'No projects yet' : 'No projects match your filters'}
                </h2>
                <p className="text-slate-600 mb-6 max-w-md mx-auto">
                  {projects.length === 0 
                    ? 'Create your first project to get started with client management and updates.'
                    : 'Try adjusting your search or filter criteria to find what you\'re looking for.'
                  }
                </p>
                {projects.length === 0 && (
                  <Button onClick={openCreateForm} className="bg-blue-500 hover:bg-blue-600">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Your First Project
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={openEditForm}
                  onDelete={handleDeleteProject}
                  onSendUpdate={handleSendUpdate}
                />
              ))}
            </div>
          )}

          {/* Project Form Modal */}
          <ProjectForm
            open={formOpen}
            onOpenChange={setFormOpen}
            onSubmit={editingProject ? handleEditProject : handleCreateProject}
            project={editingProject}
            loading={formLoading}
          />
        </div>
      </div>
    </Layout>
  );
};
