
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ActivityLog } from "@/lib/supabase";
import { Activity, User, Calendar } from "lucide-react";

interface ProjectLogsProps {
  logs: ActivityLog[];
}

export function ProjectLogs({ logs }: ProjectLogsProps) {
  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'project_created':
        return '🎯';
      case 'task_created':
        return '✅';
      case 'status_updated':
      case 'task_status_updated':
        return '🔄';
      case 'comment_added':
      case 'project_comment_added':
        return '💬';
      default:
        return '📝';
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'project_created':
        return 'bg-blue-100 text-blue-800';
      case 'task_created':
        return 'bg-green-100 text-green-800';
      case 'status_updated':
      case 'task_status_updated':
        return 'bg-yellow-100 text-yellow-800';
      case 'comment_added':
      case 'project_comment_added':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No activity yet</h4>
              <p className="text-gray-600">Activity will appear here as team members work on this project</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log, index) => (
                <div key={log.id} className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-sm">
                      {getActivityIcon(log.action)}
                    </div>
                    {index < logs.length - 1 && (
                      <div className="w-0.5 h-8 bg-gray-200 mx-auto mt-2"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getActivityColor(log.action)}>
                        {log.action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <User className="h-3 w-3" />
                        <span>{log.user_name}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-800">{log.details}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
