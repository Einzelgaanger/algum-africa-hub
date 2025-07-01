
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { Mail, UserPlus, Clock, CheckCircle, XCircle, Trash2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProjectInvitationsProps {
  projectId: string;
  isOwner: boolean;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  invited_at: string;
  expires_at: string;
}

interface Member {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profiles: {
    full_name: string;
    email: string;
  } | null;
}

export function ProjectInvitations({ projectId, isOwner }: ProjectInvitationsProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const { toast } = useToast();

  useEffect(() => {
    fetchInvitationsAndMembers();
  }, [projectId]);

  const fetchInvitationsAndMembers = async () => {
    try {
      // Fetch invitations
      const { data: invitationsData } = await supabase
        .from('project_invitations')
        .select('*')
        .eq('project_id', projectId)
        .order('invited_at', { ascending: false });

      setInvitations(invitationsData || []);

      // Fetch members with profiles
      const { data: membersData } = await supabase
        .from('project_members')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .eq('project_id', projectId)
        .order('joined_at', { ascending: false });

      setMembers(membersData || []);
    } catch (error) {
      console.error('Error fetching invitations and members:', error);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('project_members')
        .select('profiles:user_id(email)')
        .eq('project_id', projectId);

      const memberEmails = existingMember
        ?.map(m => m.profiles?.email)
        .filter(Boolean) || [];
      
      if (memberEmails.includes(email)) {
        toast({
          title: 'User already a member',
          description: 'This user is already a member of the project.',
          variant: 'destructive',
        });
        return;
      }

      // Check for existing pending invitation
      const { data: existingInvitation } = await supabase
        .from('project_invitations')
        .select('*')
        .eq('project_id', projectId)
        .eq('email', email)
        .eq('status', 'pending')
        .single();

      if (existingInvitation) {
        toast({
          title: 'Invitation already sent',
          description: 'An invitation has already been sent to this email.',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase
        .from('project_invitations')
        .insert({
          project_id: projectId,
          email: email.trim(),
          role,
          invited_by: user.id,
        });

      if (error) throw error;

      // Log the activity
      await supabase
        .from('activity_logs')
        .insert({
          project_id: projectId,
          user_id: user.id,
          user_name: user.user_metadata?.full_name || user.email || 'Unknown User',
          action: 'member_invited',
          details: `Invited ${email} as ${role}`,
        });

      toast({
        title: 'Invitation sent!',
        description: `Invitation sent to ${email}`,
      });

      setEmail('');
      setRole('member');
      fetchInvitationsAndMembers();
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send invitation',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('project_invitations')
        .update({ status: 'declined' })
        .eq('id', invitationId);

      if (error) throw error;

      toast({
        title: 'Invitation cancelled',
        description: 'The invitation has been cancelled.',
      });

      fetchInvitationsAndMembers();
    } catch (error: any) {
      console.error('Error cancelling invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel invitation',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800',
    };

    const icons = {
      pending: <Clock className="h-3 w-3" />,
      accepted: <CheckCircle className="h-3 w-3" />,
      declined: <XCircle className="h-3 w-3" />,
      expired: <XCircle className="h-3 w-3" />,
    };

    return (
      <Badge className={`${variants[status as keyof typeof variants]} flex items-center gap-1`}>
        {icons[status as keyof typeof icons]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      owner: 'bg-purple-100 text-purple-800',
      admin: 'bg-blue-100 text-blue-800',
      member: 'bg-gray-100 text-gray-800',
    };

    return (
      <Badge className={variants[role as keyof typeof variants]}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Invite Collaborators
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" disabled={loading} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                {loading ? 'Sending...' : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Current Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No team members yet.</p>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {member.profiles?.full_name?.charAt(0) || member.profiles?.email?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">{member.profiles?.full_name || 'Unknown User'}</div>
                      <div className="text-sm text-gray-500">{member.profiles?.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getRoleBadge(member.role)}
                    <span className="text-xs text-gray-500">
                      Joined {new Date(member.joined_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations ({invitations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="font-medium">{invitation.email}</div>
                      <div className="text-sm text-gray-500">
                        Invited {new Date(invitation.invited_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getRoleBadge(invitation.role)}
                    {getStatusBadge(invitation.status)}
                    {isOwner && invitation.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCancelInvitation(invitation.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
