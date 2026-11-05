import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, Filter, Briefcase, Sparkles } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';

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
      title: 'Dispatched to Client Update',
      description: `Opening update studio for ${project.name}`,
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
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Project Hub</h1>
            <Badge variant="outline" className="text-xs font-mono">
              {projects.length} Total
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Track client repositories, deliverables, milestones, and automated status reports.
          </p>
        </div>
        <Button
          onClick={openCreateForm}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-xs shadow-sm self-start sm:self-auto gap-1.5"
        >
          <PlusCircle className="h-4 w-4" />
          <span>New Project</span>
        </Button>
      </div>

      {/* Search and Filter Section */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44 h-9 text-xs">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="on_hold">On Hold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="text-center py-16 text-xs text-muted-foreground">
          Loading projects...
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-border bg-card/40 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mx-auto">
            <Briefcase className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold">No Projects Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {searchTerm || statusFilter !== 'all'
              ? 'No projects match your active search filters.'
              : 'Create your first client project to start tracking milestones and updates.'}
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <Button
              onClick={openCreateForm}
              size="sm"
              className="text-xs font-semibold mt-2"
            >
              <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
              Create Project
            </Button>
          )}
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
  );
};
