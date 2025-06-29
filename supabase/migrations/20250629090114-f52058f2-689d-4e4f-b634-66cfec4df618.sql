
-- Add deadline and priority columns to tasks table
ALTER TABLE public.tasks 
ADD COLUMN deadline DATE,
ADD COLUMN priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- Create index for better performance when sorting by deadline
CREATE INDEX idx_tasks_deadline ON public.tasks(deadline);
CREATE INDEX idx_tasks_priority ON public.tasks(priority);

-- Add a table to track read status of comments for notifications
CREATE TABLE public.comment_read_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for comment read status
ALTER TABLE public.comment_read_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own read status" 
  ON public.comment_read_status 
  FOR ALL 
  USING (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX idx_comment_read_status_user ON public.comment_read_status(user_id);
CREATE INDEX idx_comment_read_status_comment ON public.comment_read_status(comment_id);
