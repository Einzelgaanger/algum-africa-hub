
-- Create user profiles table for better user management
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create project invitations table
CREATE TABLE public.project_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  UNIQUE(project_id, email)
);

-- Create project members table
CREATE TABLE public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Add owner role to existing projects table
ALTER TABLE public.projects ADD COLUMN owner_id UUID REFERENCES auth.users(id);

-- Update existing projects to have owner_id
UPDATE public.projects SET owner_id = created_by WHERE owner_id IS NULL;

-- Make owner_id not null
ALTER TABLE public.projects ALTER COLUMN owner_id SET NOT NULL;

-- Enable RLS on new tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Project invitations policies
CREATE POLICY "Users can view invitations for their projects" ON public.project_invitations 
  FOR SELECT USING (
    invited_by = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.project_members 
      WHERE project_id = project_invitations.project_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Project owners/admins can create invitations" ON public.project_invitations 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_members 
      WHERE project_id = project_invitations.project_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can view their own invitations by email" ON public.project_invitations 
  FOR SELECT USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Project members policies
CREATE POLICY "Users can view members of their projects" ON public.project_members 
  FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.project_members pm2 
      WHERE pm2.project_id = project_members.project_id 
      AND pm2.user_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can manage members" ON public.project_members 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE id = project_members.project_id 
      AND owner_id = auth.uid()
    )
  );

-- Update projects policies to include collaboration
DROP POLICY IF EXISTS "Users can view projects they created" ON public.projects;
DROP POLICY IF EXISTS "Users can update projects they created" ON public.projects;
DROP POLICY IF EXISTS "Users can delete projects they created" ON public.projects;

CREATE POLICY "Users can view projects they own or are members of" ON public.projects 
  FOR SELECT USING (
    owner_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.project_members 
      WHERE project_id = projects.id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can update projects" ON public.projects 
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Project owners can delete projects" ON public.projects 
  FOR DELETE USING (owner_id = auth.uid());

CREATE POLICY "Authenticated users can create projects" ON public.projects 
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Update tasks policies for collaboration
DROP POLICY IF EXISTS "Users can view tasks for their projects" ON public.tasks;
DROP POLICY IF EXISTS "Users can create tasks for their projects" ON public.tasks;
DROP POLICY IF EXISTS "Users can update tasks for their projects" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete tasks for their projects" ON public.tasks;

CREATE POLICY "Users can view tasks for projects they're members of" ON public.tasks 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      LEFT JOIN public.project_members pm ON p.id = pm.project_id
      WHERE p.id = tasks.project_id 
      AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())
    )
  );

CREATE POLICY "Project members can create tasks" ON public.tasks 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      LEFT JOIN public.project_members pm ON p.id = pm.project_id
      WHERE p.id = tasks.project_id 
      AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())
    )
  );

CREATE POLICY "Project members can update tasks" ON public.tasks 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      LEFT JOIN public.project_members pm ON p.id = pm.project_id
      WHERE p.id = tasks.project_id 
      AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())
    )
  );

CREATE POLICY "Project members can delete tasks" ON public.tasks 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      LEFT JOIN public.project_members pm ON p.id = pm.project_id
      WHERE p.id = tasks.project_id 
      AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())
    )
  );

-- Update comments policies for collaboration
DROP POLICY IF EXISTS "Users can view comments for their projects" ON public.comments;
DROP POLICY IF EXISTS "Users can create comments for their projects" ON public.comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;

CREATE POLICY "Users can view comments for projects they're members of" ON public.comments 
  FOR SELECT USING (
    (project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.projects p
      LEFT JOIN public.project_members pm ON p.id = pm.project_id
      WHERE p.id = comments.project_id 
      AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())
    )) OR
    (task_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.projects p ON t.project_id = p.id
      LEFT JOIN public.project_members pm ON p.id = pm.project_id
      WHERE t.id = comments.task_id 
      AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())
    ))
  );

CREATE POLICY "Project members can create comments" ON public.comments 
  FOR INSERT WITH CHECK (
    (project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.projects p
      LEFT JOIN public.project_members pm ON p.id = pm.project_id
      WHERE p.id = comments.project_id 
      AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())
    )) OR
    (task_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.projects p ON t.project_id = p.id
      LEFT JOIN public.project_members pm ON p.id = pm.project_id
      WHERE t.id = comments.task_id 
      AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())
    ))
  );

CREATE POLICY "Users can update their own comments" ON public.comments 
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own comments" ON public.comments 
  FOR DELETE USING (created_by = auth.uid());

-- Create function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to automatically add project owner as member
CREATE OR REPLACE FUNCTION public.add_project_owner_as_member()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to add project owner as member
CREATE TRIGGER on_project_created
  AFTER INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.add_project_owner_as_member();
