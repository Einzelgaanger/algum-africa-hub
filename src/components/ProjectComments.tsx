
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase, Comment } from "@/lib/supabase";
import { Send, MessageSquare, User, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface ProjectCommentsProps {
  projectId: string;
  comments: Comment[];
  onCommentsChange: () => void;
}

export function ProjectComments({ projectId, comments, onCommentsChange }: ProjectCommentsProps) {
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

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
          action: 'project_comment_added',
          details: `Added comment on project`,
        });

      setNewComment("");
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

  return (
    <div className={`space-y-4 md:space-y-6 ${isMobile ? 'p-4' : ''}`}>
      {/* Add Comment Form */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-lg' : 'text-xl'}`}>
            <MessageSquare className="h-5 w-5" />
            Add Comment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitComment} className="space-y-4">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts about this project..."
              rows={isMobile ? 3 : 4}
              className="resize-none"
            />
            <div className={`flex ${isMobile ? 'flex-col' : 'justify-end'}`}>
              <Button
                type="submit"
                disabled={loading || !newComment.trim()}
                className={`bg-red-600 hover:bg-red-700 ${isMobile ? 'w-full' : ''}`}
              >
                {loading ? (
                  "Posting..."
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Post Comment
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Comments List */}
      <div className="space-y-4">
        <h3 className={`font-medium text-gray-900 ${isMobile ? 'text-base' : 'text-lg'}`}>
          Comments ({comments.length})
        </h3>
        
        {comments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className={`font-medium text-gray-900 mb-2 ${isMobile ? 'text-base' : 'text-lg'}`}>No comments yet</h4>
              <p className="text-gray-600 text-sm">Start the conversation by adding the first comment!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <Card key={comment.id}>
                <CardContent className="p-4">
                  <div className={`flex ${isMobile ? 'flex-col gap-2' : 'items-start justify-between'} mb-3`}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-gray-900 truncate">{comment.created_by_name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(comment.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                  <p className="text-gray-800 whitespace-pre-wrap break-words">{comment.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
