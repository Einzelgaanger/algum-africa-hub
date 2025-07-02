-- Fix the project invitations RLS policy that's causing permission denied error
-- The policy was trying to access auth.users table which is restricted

DROP POLICY IF EXISTS "Users can view their own invitations by email" ON public.project_invitations;

-- Create a new policy that uses the profiles table instead of auth.users
CREATE POLICY "Users can view their own invitations by email" ON public.project_invitations 
  FOR SELECT USING (
    email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  );

-- Also need to allow users to update invitation status when they accept/decline
CREATE POLICY "Users can update their own invitations" ON public.project_invitations 
  FOR UPDATE USING (
    email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  );