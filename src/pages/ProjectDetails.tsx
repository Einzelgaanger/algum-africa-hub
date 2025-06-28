
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase, Project, Task, Comment, ActivityLog } from "@/lib/supabase";
import { ArrowLeft, Calendar, User, MessageSquare, CheckList, Activity } from "lucide-react";
import { ProjectTasks } from "@/components/ProjectTasks";
import { ProjectComments } from "@/components/ProjectComments";
import { ProjectLogs } from "@/components/ProjectLogs";
import { ProjectStatusUpdate } from "@/components/ProjectStatusUpdate";

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchProjectData();
    }
  }, [id]);

  const fetchProjectData = async () => {
    try {
      // Fetch project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      // Fetch tasks
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false });

      setTasks(tasksData || []);

      // Fetch project comments
      const { data: commentsData } = await supabase
        .from('comments')
        .select('*')
        .eq('project_id', id)
        .is('task_id', null)
        .order('created_at', { ascending: false });

      setComments(commentsData || []);

      // Fetch activity logs
      const { data: logsData } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false });

      setLogs(logsData || []);

    } catch (error) {
      console.error('Error fetching project data:', error);
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      todo: "bg-gray-100 text-gray-800",
      in_progress: "bg-yellow-100 text-yellow-800",
      done: "bg-green-100 text-green-800"
    };
    
    const labels = {
      todo: "To Do",
      in_progress: "In Progress", 
      done: "Done"
    };

    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!project) return;

    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', project.id);

      if (error) throw error;

      // Log the activity
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('activity_logs')
          .insert({
            project_id: project.id,
            user_id: user.id,
            user_name: user.user_metadata?.full_name || user.email || 'Unknown User',
            action: 'status_updated',
            details: `Updated project status to ${newStatus.replace('_', ' ')}`,
          });
      }

      setProject({ ...project, status: newStatus as any });
      fetchProjectData(); // Refresh logs
    } catch (error) {
      console.error('Error updating project status:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Project not found</h1>
        <Button onClick={() => navigate('/projects')}>
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
            {getStatusBadge(project.status)}
          </div>
          <p className="text-gray-600">{project.description}</p>
        </div>
        <ProjectStatusUpdate 
          currentStatus={project.status}
          onStatusUpdate={handleStatusUpdate}
        />
      </div>

      {/* Project Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Project Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>Deadline: {new Date(project.deadline).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>Created: {new Date(project.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          {project.goals && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Goals & Objectives</h4>
              <p className="text-gray-600 text-sm">{project.goals}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <CheckList className="h-4 w-4" />
            Tasks ({tasks.length})
          </TabsTrigger>
          <TabsTrigger value="comments" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Comments ({comments.length})
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activity ({logs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <ProjectTasks 
            projectId={project.id}
            tasks={tasks}
            onTasksChange={fetchProjectData}
          />
        </TabsContent>

        <TabsContent value="comments">
          <ProjectComments
            projectId={project.id}
            comments={comments}
            onCommentsChange={fetchProjectData}
          />
        </TabsContent>

        <TabsContent value="logs">
          <ProjectLogs logs={logs} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
