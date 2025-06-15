
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  User, 
  Mail, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Send,
  Clock
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Project } from '@/types/project';

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
  onSendUpdate: (project: Project) => void;
}

export const ProjectCard = ({ project, onEdit, onDelete, onSendUpdate }: ProjectCardProps) => {
  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getNextUpdateDate = () => {
    if (!project.last_update_sent) return 'No update sent yet';
    const lastUpdate = new Date(project.last_update_sent);
    const nextUpdate = new Date(lastUpdate);
    nextUpdate.setDate(lastUpdate.getDate() + project.update_frequency_days);
    return nextUpdate.toLocaleDateString();
  };

  const isUpdateDue = () => {
    if (!project.last_update_sent) return true;
    const lastUpdate = new Date(project.last_update_sent);
    const nextUpdate = new Date(lastUpdate);
    nextUpdate.setDate(lastUpdate.getDate() + project.update_frequency_days);
    return new Date() >= nextUpdate;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900">
              {project.name}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className={getStatusColor(project.status)}>
                {project.status.replace('_', ' ')}
              </Badge>
              {isUpdateDue() && project.status === 'active' && (
                <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                  Update Due
                </Badge>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(project)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Project
              </DropdownMenuItem>
              {project.status === 'active' && (
                <DropdownMenuItem onClick={() => onSendUpdate(project)}>
                  <Send className="h-4 w-4 mr-2" />
                  Send Update
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={() => onDelete(project.id)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {project.description && (
          <p className="text-sm text-gray-600">{project.description}</p>
        )}
        
        <div className="space-y-2">
          {project.client_name && (
            <div className="flex items-center text-sm text-gray-600">
              <User className="h-4 w-4 mr-2" />
              <span>{project.client_name}</span>
            </div>
          )}
          {project.client_email && (
            <div className="flex items-center text-sm text-gray-600">
              <Mail className="h-4 w-4 mr-2" />
              <span>{project.client_email}</span>
            </div>
          )}
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            <span>Updates every {project.update_frequency_days} days</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-2" />
            <span>Next update: {getNextUpdateDate()}</span>
          </div>
        </div>

        {project.status === 'active' && isUpdateDue() && (
          <Button 
            onClick={() => onSendUpdate(project)}
            className="w-full mt-3"
            size="sm"
          >
            <Send className="h-4 w-4 mr-2" />
            Send Client Update
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
