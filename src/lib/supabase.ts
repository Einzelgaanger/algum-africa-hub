
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database
export interface Project {
  id: string;
  title: string;
  description: string;
  goals: string;
  deadline: string;
  status: 'todo' | 'in_progress' | 'done';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string;
  file_url?: string;
  file_name?: string;
  status: 'todo' | 'in_progress' | 'done';
  created_by: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  project_id?: string;
  task_id?: string;
  content: string;
  created_by: string;
  created_by_name: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  project_id: string;
  user_id: string;
  user_name: string;
  action: string;
  details: string;
  created_at: string;
}
