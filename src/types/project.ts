
export interface Project {
  id: string;
  name: string;
  description?: string;
  client_name?: string;
  client_email?: string;
  status: 'active' | 'completed' | 'on_hold' | 'cancelled';
  last_update_sent?: string;
  update_frequency_days: number;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  client_name?: string;
  client_email?: string;
  update_frequency_days: number;
}

export interface UpdateProjectData extends Partial<CreateProjectData> {
  status?: Project['status'];
  last_update_sent?: string;
}
