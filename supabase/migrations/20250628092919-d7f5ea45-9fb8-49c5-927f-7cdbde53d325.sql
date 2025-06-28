
-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  goals TEXT,
  deadline DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  created_by UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_name TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  created_by UUID REFERENCES auth.users NOT NULL,
  created_by_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create comments table
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID REFERENCES auth.users NOT NULL,
  created_by_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create activity logs table
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage bucket for project files
INSERT INTO storage.buckets (id, name, public) VALUES ('project-files', 'project-files', true);

-- Enable Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Users can view all projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Users can create projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update projects" ON public.projects FOR UPDATE USING (true);
CREATE POLICY "Users can delete their own projects" ON public.projects FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for tasks
CREATE POLICY "Users can view all tasks" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Users can create tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update all tasks" ON public.tasks FOR UPDATE USING (true);
CREATE POLICY "Users can delete their own tasks" ON public.tasks FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for comments
CREATE POLICY "Users can view all comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own comments" ON public.comments FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete their own comments" ON public.comments FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for activity logs
CREATE POLICY "Users can view all activity logs" ON public.activity_logs FOR SELECT USING (true);
CREATE POLICY "Users can create activity logs" ON public.activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Storage policies for project files
CREATE POLICY "Users can upload files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'project-files');
CREATE POLICY "Users can view files" ON storage.objects FOR SELECT USING (bucket_id = 'project-files');
CREATE POLICY "Users can update files" ON storage.objects FOR UPDATE USING (bucket_id = 'project-files');
CREATE POLICY "Users can delete files" ON storage.objects FOR DELETE USING (bucket_id = 'project-files');
