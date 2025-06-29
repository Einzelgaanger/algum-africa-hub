
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://jvppazqkoonwnrrfeorq.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2cHBhenFrb29ud25ycmZlb3JxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMDA5NzEsImV4cCI6MjA2NjY3Njk3MX0.9Wvs4MAhurqY9Y7gA2C_RebDJJLCTa8KDaICm5TKJkg";

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
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  deadline?: string;
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

export interface CommentReadStatus {
  id: string;
  user_id: string;
  comment_id: string;
  read_at: string;
  created_at: string;
}
