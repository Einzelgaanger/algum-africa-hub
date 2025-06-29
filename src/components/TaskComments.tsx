
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { supabase, Comment } from "@/lib/supabase";
import { Send, MessageSquare, User, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/useNotifications";
import { useIsMobile } from "@/hooks/use-mobile";

interface TaskCommentsProps {
  taskId: string;
  projectId: string;
  onCommentsChange: () => void;
}

export function TaskComments({ taskId, projectId, onCommentsChange }: TaskCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingComments, setFetchingComments] = useState(true);
  const { toast } = useToast();
  const { markCommentAsRead } = useNotifications();
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchComments();
  }, [taskId]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);

      // Mark all comments as read when viewing them
      if (data) {
        data.forEach(comment => {
          markCommentAsRead(comment.id);
        });
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setFetchingComments(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('comments')
        .insert({
          task_id: taskId,
          project_id: projectId,
          content: newComment.trim(),
          created_by: user.id,
          created_by_name: user.user_metadata?.full_name || user.email || 'Unknown User',
        });

      if (error) throw error;

      // Log the activity
      await supabase
        .from('activity_logs')
        .insert({
          project_id: projectId,
          user_id: user.id,
          user_name: user.user_metadata?.full_name || user.email || 'Unknown User',
          action: 'comment_added',
          details: `Added comment on task`,
        });

      setNewComment("");
      fetchComments();
      onCommentsChange();

      toast({
        title: "Success!",
        description: "Comment added successfully.",
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetchingComments) {
    return (
      <div className="space-y-4 w-full">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full overflow-hidden">
      <h4 className={`font-medium text-gray-900 flex items-center gap-2 ${isMobile ? 'text-sm' : 'text-base'}`}>
        <MessageSquare className="h-4 w-4 flex-shrink-0" />
        Comments ({comments.length})
      </h4>

      {/* Comments List */}
      {comments.length === 0 ? (
        <p className="text-gray-500 text-sm">No comments yet. Be the first to comment!</p>
      ) : (
        <div className="space-y-3 max-h-60 overflow-y-auto w-full">
          {comments.map((comment) => (
            <Card key={comment.id} className="w-full">
              <CardContent className="p-3">
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <User className="h-3 w-3 flex-shrink-0 text-gray-600" />
                      <span className="font-medium text-sm truncate">{comment.created_by_name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="h-3 w-3 flex-shrink-0" />
                      <span className="whitespace-nowrap">{new Date(comment.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-800 break-words leading-relaxed">{comment.content}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Comment Form */}
      <form onSubmit={handleSubmitComment} className="space-y-3 w-full">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows={isMobile ? 2 : 3}
          className="w-full resize-none"
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={loading || !newComment.trim()}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? (
              "Posting..."
            ) : (
              <>
                <Send className="h-3 w-3 mr-1" />
                Post
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
