
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase, Task } from "@/lib/supabase";
import { Plus, Upload, Calendar, User, MessageSquare, CheckCircle, Clock, AlertCircle, Bell, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TaskComments } from "./TaskComments";
import { useNotifications } from "@/hooks/useNotifications";
import { useIsMobile } from "@/hooks/use-mobile";

interface ProjectTasksProps {
  projectId: string;
  tasks: Task[];
  onTasksChange: () => void;
}

export function ProjectTasks({ projectId, tasks, onTasksChange }: ProjectTasksProps) {
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newTaskData, setNewTaskData] = useState({
    title: "",
    description: "",
    deadline: "",
    priority: "medium" as const,
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { unreadCount } = useNotifications(projectId);
  const isMobile = useIsMobile();

  // Sort tasks by deadline (upcoming first), then by priority
  const sortedTasks = [...tasks].sort((a, b) => {
    // First sort by deadline (upcoming first)
    if (a.deadline && b.deadline) {
      const dateA = new Date(a.deadline);
      const dateB = new Date(b.deadline);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
    } else if (a.deadline && !b.deadline) {
      return -1;
    } else if (!a.deadline && b.deadline) {
      return 1;
    }

    // Then sort by priority
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const aPriority = priorityOrder[a.priority || 'medium'];
    const bPriority = priorityOrder[b.priority || 'medium'];
    return aPriority - bPriority;
  });

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let fileUrl = null;
      let fileName = null;

      // Upload file if provided
      if (file) {
        const fileExt = file.name.split('.').pop();
        const filePath = `task-files/${projectId}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('project-files')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('project-files')
          .getPublicUrl(filePath);

        fileUrl = publicUrl;
        fileName = file.name;
      }

      const { error } = await supabase
        .from('tasks')
        .insert({
          project_id: projectId,
          title: newTaskData.title,
          description: newTaskData.description,
          deadline: newTaskData.deadline || null,
          priority: newTaskData.priority,
          file_url: fileUrl,
          file_name: fileName,
          status: 'todo',
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
          action: 'task_created',
          details: `Created task: ${newTaskData.title}`,
        });

      toast({
        title: "Success!",
        description: "Task created successfully.",
      });

      setNewTaskData({ title: "", description: "", deadline: "", priority: "medium" });
      setFile(null);
      setShowNewTaskForm(false);
      onTasksChange();
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', taskId);

      if (error) throw error;

      // Log the activity
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const task = tasks.find(t => t.id === taskId);
        await supabase
          .from('activity_logs')
          .insert({
            project_id: projectId,
            user_id: user.id,
            user_name: user.user_metadata?.full_name || user.email || 'Unknown User',
            action: 'task_status_updated',
            details: `Updated task "${task?.title}" status to ${newStatus.replace('_', ' ')}`,
          });
      }

      onTasksChange();
    } catch (error) {
      console.error('Error updating task status:', error);
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
      <Badge className={`${variants[status as keyof typeof variants]} ${isMobile ? 'text-xs px-2 py-1' : ''}`}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      urgent: "bg-red-100 text-red-800 border-red-300",
      high: "bg-orange-100 text-orange-800 border-orange-300",
      medium: "bg-blue-100 text-blue-800 border-blue-300",
      low: "bg-gray-100 text-gray-800 border-gray-300"
    };

    const labels = {
      urgent: "Urgent",
      high: "High",
      medium: "Medium",
      low: "Low"
    };

    return (
      <Badge className={`${variants[priority as keyof typeof variants]} border ${isMobile ? 'text-xs px-2 py-1' : ''}`}>
        {labels[priority as keyof typeof labels]}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const isTaskOverdue = (deadline: string) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  const getDaysUntilDeadline = (deadline: string) => {
    if (!deadline) return null;
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className={`space-y-4 md:space-y-6 ${isMobile ? 'p-4' : ''}`}>
      {/* Header with notification badge */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h2 className={`font-semibold ${isMobile ? 'text-lg' : 'text-xl'}`}>Tasks</h2>
          {unreadCount > 0 && (
            <div className="flex items-center gap-1 bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
              <Bell className="h-3 w-3" />
              {unreadCount} unread
            </div>
          )}
        </div>
        <Button
          onClick={() => setShowNewTaskForm(!showNewTaskForm)}
          className="bg-red-600 hover:bg-red-700"
          size={isMobile ? "sm" : "default"}
        >
          <Plus className="h-4 w-4 mr-2" />
          {isMobile ? "Add" : "Add Task"}
        </Button>
      </div>

      {/* New Task Form */}
      {showNewTaskForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className={isMobile ? 'text-lg' : 'text-xl'}>Create New Task</CardTitle>
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNewTaskForm(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-4`}>
                <div className="space-y-2">
                  <Label htmlFor="taskTitle">Task Title *</Label>
                  <Input
                    id="taskTitle"
                    value={newTaskData.title}
                    onChange={(e) => setNewTaskData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter task title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taskDeadline">Deadline</Label>
                  <Input
                    id="taskDeadline"
                    type="date"
                    value={newTaskData.deadline}
                    onChange={(e) => setNewTaskData(prev => ({ ...prev, deadline: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="taskPriority">Priority</Label>
                <Select value={newTaskData.priority} onValueChange={(value: any) => setNewTaskData(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="taskDescription">Description</Label>
                <Textarea
                  id="taskDescription"
                  value={newTaskData.description}
                  onChange={(e) => setNewTaskData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the task..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taskFile">Attach File</Label>
                <Input
                  id="taskFile"
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="cursor-pointer"
                />
              </div>

              <div className={`flex ${isMobile ? 'flex-col gap-2' : 'justify-end gap-2'}`}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewTaskForm(false)}
                  className={isMobile ? 'w-full' : ''}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className={`bg-red-600 hover:bg-red-700 ${isMobile ? 'w-full' : ''}`}
                >
                  {loading ? "Creating..." : "Create Task"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tasks List */}
      {sortedTasks.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className={`font-medium text-gray-900 mb-2 ${isMobile ? 'text-base' : 'text-lg'}`}>No tasks yet</h3>
            <p className="text-gray-600 text-sm">Create your first task to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedTasks.map((task) => {
            const daysUntilDeadline = task.deadline ? getDaysUntilDeadline(task.deadline) : null;
            const isOverdue = task.deadline ? isTaskOverdue(task.deadline) : false;

            return (
              <Card key={task.id} className={`${isOverdue ? 'border-red-300 bg-red-50' : ''}`}>
                <CardHeader className={isMobile ? 'pb-2' : ''}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {getStatusIcon(task.status)}
                      <div className="flex-1 min-w-0">
                        <CardTitle className={`${isMobile ? 'text-base' : 'text-lg'} break-words`}>{task.title}</CardTitle>
                        {task.description && (
                          <p className={`text-gray-600 mt-1 ${isMobile ? 'text-sm' : ''} break-words`}>{task.description}</p>
                        )}
                      </div>
                    </div>
                    <div className={`flex ${isMobile ? 'flex-col' : 'items-center'} gap-2 ml-2`}>
                      {getStatusBadge(task.status)}
                      {getPriorityBadge(task.priority || 'medium')}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Task metadata */}
                  <div className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center justify-between'} text-sm text-gray-500`}>
                    <div className={`flex ${isMobile ? 'flex-col gap-1' : 'items-center gap-4'}`}>
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span className="truncate">{task.created_by_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Created: {new Date(task.created_at).toLocaleDateString()}</span>
                      </div>
                      {task.deadline && (
                        <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : daysUntilDeadline !== null && daysUntilDeadline <= 3 ? 'text-yellow-600 font-medium' : ''}`}>
                          <Calendar className="h-4 w-4" />
                          <span className="break-words">
                            Due: {new Date(task.deadline).toLocaleDateString()}
                            {daysUntilDeadline !== null && (
                              <span className="ml-1">
                                ({isOverdue ? `${Math.abs(daysUntilDeadline)} days overdue` : 
                                  daysUntilDeadline === 0 ? 'Due today' : 
                                  `${daysUntilDeadline} days left`})
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                      {task.file_url && (
                        <div className="flex items-center gap-1">
                          <Upload className="h-4 w-4" />
                          <a
                            href={task.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline truncate"
                          >
                            {task.file_name}
                          </a>
                        </div>
                      )}
                    </div>
                    
                    <div className={`flex ${isMobile ? 'flex-wrap' : ''} gap-1`}>
                      {task.status !== 'todo' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(task.id, 'todo')}
                          className={isMobile ? 'text-xs' : ''}
                        >
                          To Do
                        </Button>
                      )}
                      {task.status !== 'in_progress' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(task.id, 'in_progress')}
                          className={isMobile ? 'text-xs' : ''}
                        >
                          In Progress
                        </Button>
                      )}
                      {task.status !== 'done' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(task.id, 'done')}
                          className={isMobile ? 'text-xs' : ''}
                        >
                          Done
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Comments button */}
                  <div className="flex justify-between items-center pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedTask(selectedTask?.id === task.id ? null : task)}
                      className="relative"
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      {isMobile ? "Comments" : "View Comments"}
                    </Button>
                  </div>

                  {/* Task Comments */}
                  {selectedTask?.id === task.id && (
                    <div className="border-t pt-4">
                      <TaskComments
                        taskId={task.id}
                        projectId={projectId}
                        onCommentsChange={onTasksChange}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
