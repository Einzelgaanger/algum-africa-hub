
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon, User, Mail, Shield, Database } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User as SupabaseUser } from "@supabase/supabase-js";

export default function Settings() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [stats, setStats] = useState({
    projects: 0,
    tasks: 0,
    comments: 0
  });

  useEffect(() => {
    fetchUserData();
    fetchUserStats();
  }, []);

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchUserStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Count projects created by user
      const { count: projectCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id);

      // Count tasks created by user
      const { count: taskCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id);

      // Count comments by user
      const { count: commentCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id);

      setStats({
        projects: projectCount || 0,
        tasks: taskCount || 0,
        comments: commentCount || 0
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account and system preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {user && (
              <>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <User className="h-8 w-8 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {user.user_metadata?.full_name || 'Unknown User'}
                    </h3>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span>{user.email}</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800 mt-2">
                      <Shield className="h-3 w-3 mr-1" />
                      Authenticated
                    </Badge>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium text-gray-900 mb-3">Account Statistics</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{stats.projects}</div>
                      <div className="text-sm text-gray-600">Projects Created</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{stats.tasks}</div>
                      <div className="text-sm text-gray-600">Tasks Created</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{stats.comments}</div>
                      <div className="text-sm text-gray-600">Comments Posted</div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Account Created:</strong> {new Date(user.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Last Sign In:</strong> {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">System Version</span>
                <Badge variant="outline">v1.0.0</Badge>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Database Status</span>
                <Badge className="bg-green-100 text-green-800">Connected</Badge>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Authentication</span>
                <Badge className="bg-blue-100 text-blue-800">Google OAuth</Badge>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">File Storage</span>
                <Badge className="bg-purple-100 text-purple-800">Enabled</Badge>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium text-gray-900 mb-3">Security Features</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span>Row Level Security (RLS) Enabled</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span>OAuth Authentication</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span>Encrypted Data Storage</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Company Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              About Algum Africa Capitals LLP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-r from-red-50 to-white p-6 rounded-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Internal Project Management System
              </h3>
              <p className="text-gray-700 mb-4">
                This system is designed to streamline project management, enhance team collaboration, 
                and maintain accountability across all client projects at Algum Africa Capitals LLP.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Key Features</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Client project management</li>
                    <li>• Task assignment and tracking</li>
                    <li>• Real-time collaboration</li>
                    <li>• Activity logging and accountability</li>
                    <li>• Secure file sharing</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Security & Privacy</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Google OAuth authentication</li>
                    <li>• Role-based access control</li>
                    <li>• Encrypted data transmission</li>
                    <li>• Audit trail logging</li>
                    <li>• Regular security updates</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
