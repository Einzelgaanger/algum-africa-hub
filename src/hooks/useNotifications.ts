
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';

export function useNotifications(projectId?: string) {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchUnreadCount = async () => {
      try {
        // Get all comments for the project or all projects if no projectId
        const commentsQuery = supabase
          .from('comments')
          .select('id, created_at');

        if (projectId) {
          commentsQuery.eq('project_id', projectId);
        }

        const { data: comments } = await commentsQuery;

        if (!comments) return;

        // Get read status for current user
        const { data: readStatuses } = await supabase
          .from('comment_read_status')
          .select('comment_id')
          .eq('user_id', user.id);

        const readCommentIds = new Set(readStatuses?.map(rs => rs.comment_id) || []);
        
        // Count unread comments (comments not in read status and not created by current user)
        const { data: userComments } = await supabase
          .from('comments')
          .select('id')
          .neq('created_by', user.id);

        const unreadComments = userComments?.filter(comment => 
          !readCommentIds.has(comment.id)
        ) || [];

        setUnreadCount(unreadComments.length);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();

    // Set up real-time subscription for new comments
    const channel = supabase
      .channel('comments-notifications')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'comments',
          ...(projectId ? { filter: `project_id=eq.${projectId}` } : {})
        }, 
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, projectId]);

  const markCommentAsRead = async (commentId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('comment_read_status')
        .upsert({
          user_id: user.id,
          comment_id: commentId,
        });

      if (error) throw error;
      
      // Refresh unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking comment as read:', error);
    }
  };

  return { unreadCount, markCommentAsRead };
}
