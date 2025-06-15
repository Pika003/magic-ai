
import { supabase } from '@/integrations/supabase/client';
import type { Project, CreateProjectData, UpdateProjectData } from '@/types/project';

export const getProjects = async (userId: string): Promise<Project[]> => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Project[];
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
};

export const createProject = async (
  userId: string, 
  projectData: CreateProjectData
): Promise<{ success: boolean; error?: string; data?: Project }> => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        ...projectData
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: data as Project };
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
    const { data, error } = await supabase
      .from('projects')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: data as Project };
  } catch (error: any) {
    console.error('Error updating project:', error);
    return { success: false, error: error.message };
  }
};

export const deleteProject = async (projectId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting project:', error);
    return { success: false, error: error.message };
  }
};
