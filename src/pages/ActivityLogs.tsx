
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase, ActivityLog, Project } from "@/lib/supabase";
import { Activity, Search, User, Calendar, FolderOpen } from "lucide-react";
import { Link } from "react-router-dom";

export default function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState<string>("all");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, selectedProject]);

  const fetchData = async () => {
    try {
      // Fetch all activity logs
      const { data: logsData, error: logsError } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (logsError) throw logsError;

      // Fetch projects for filtering
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, title')
        .order('title');

      if (projectsError) throw projectsError;

      setLogs(logsData || []);
      setProjects(projectsData || []);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = logs;

    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedProject !== "all") {
      filtered = filtered.filter(log => log.project_id === selectedProject);
    }

    setFilteredLogs(filtered);
  };

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

  const getProjectTitle = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.title : 'Unknown Project';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Activity Logs</h1>
        <p className="text-gray-600">Track all team activities across projects</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search activities or users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={selectedProject === "all" ? "default" : "outline"}
            onClick={() => setSelectedProject("all")}
            size="sm"
          >
            All Projects
          </Button>
          {projects.slice(0, 3).map((project) => (
            <Button
              key={project.id}
              variant={selectedProject === project.id ? "default" : "outline"}
              onClick={() => setSelectedProject(project.id)}
              size="sm"
              className="hidden sm:inline-flex"
            >
              {project.title.length > 15 ? `${project.title.slice(0, 15)}...` : project.title}
            </Button>
          ))}
        </div>
      </div>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Timeline ({filteredLogs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || selectedProject !== "all" ? "No activities found" : "No activities yet"}
              </h3>
              <p className="text-gray-600">
                {searchTerm || selectedProject !== "all" 
                  ? "Try adjusting your search or filters" 
                  : "Activity will appear here as team members work on projects"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredLogs.map((log, index) => (
                <div key={log.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-lg">{getActivityIcon(log.action)}</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getActivityColor(log.action)}>
                        {log.action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <User className="h-4 w-4" />
                        <span className="font-medium">{log.user_name}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-800 mb-2">{log.details}</p>
                    
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-gray-500" />
                      <Link 
                        to={`/projects/${log.project_id}`}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        {getProjectTitle(log.project_id)}
                      </Link>
                    </div>
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
