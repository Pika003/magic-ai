import { api } from '@/lib/apiClient';
import type { Project, CreateProjectData, UpdateProjectData } from '@/types/project';

export const getProjects = async (): Promise<Project[]> => {
  try {
    return await api.get<Project[]>('/projects');
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
};

export const createProject = async (
  _userId: string, // kept for backwards compat with call-sites; ignored — server uses JWT
  projectData: CreateProjectData
): Promise<{ success: boolean; error?: string; data?: Project }> => {
  try {
    const data = await api.post<Project>('/projects', {
      name: projectData.name,
      description: projectData.description,
      status: projectData.status,
      clientName: projectData.client_name,
      clientEmail: projectData.client_email,
      updateFrequencyDays: projectData.update_frequency_days,
    });
    return { success: true, data };
  } catch (error: any) {
    console.error('Error creating project:', error);
    return { success: false, error: error.message };
  }
};

export const updateProject = async (
  projectId: string,
  updates: UpdateProjectData
): Promise<{ success: boolean; error?: string; data?: Project }> => {
  try {
    const data = await api.patch<Project>(`/projects/${projectId}`, {
      name: updates.name,
      description: updates.description,
      status: updates.status,
      clientName: updates.client_name,
      clientEmail: updates.client_email,
      updateFrequencyDays: updates.update_frequency_days,
      lastUpdateSent: updates.last_update_sent,
    });
    return { success: true, data };
  } catch (error: any) {
    console.error('Error updating project:', error);
    return { success: false, error: error.message };
  }
};

export const deleteProject = async (
  projectId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await api.delete(`/projects/${projectId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting project:', error);
    return { success: false, error: error.message };
  }
};
