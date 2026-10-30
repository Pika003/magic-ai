import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/apiClient';
import { toast } from '@/hooks/use-toast';
import { User, Save } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { GoogleCalendarIntegration } from '@/components/GoogleCalendarIntegration';
import { UsageStatsCard } from './UsageStatsCard';

interface ProfileData {
  id: string;
  email: string;
  fullName: string | null;
  username: string | null;
  paidUser: boolean;
  avatarUrl: string | null;
}

export const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isPaidUser, setIsPaidUser] = useState(false);

  // Form state
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const data = await api.get<ProfileData>('/profile');
      if (data) {
        setFullName(data.fullName || '');
        setUsername(data.username || '');
        setIsPaidUser(!!data.paidUser);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/profile', {
        fullName,
        username,
      });

      toast({
        title: "Success",
        description: "Profile updated successfully!"
      });
      fetchProfile();
      refreshUser();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Navigation />
        <div className="pt-10 px-2 md:px-4">
          <div className="animate-pulse">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navigation />
      <div className="pt-10 px-2 md:px-4 max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Profile Settings</h2>
          <p className="text-slate-600">Manage your account and integrations</p>
        </div>
        
        {isPaidUser && (
          <div className="mb-6">
            <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg font-semibold text-center">
              You have unlimited usage unlocked! 🎉
            </div>
          </div>
        )}

        {/* Three sections in one row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Information */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5 text-blue-500" />
                <span>Profile Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={updateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-slate-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={saving} className="w-full">
                  {saving ? (
                    "Saving..."
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Profile
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Usage Statistics */}
          <div className="h-fit">
            <UsageStatsCard />
          </div>

          {/* Google Calendar Integration */}
          <div className="h-fit">
            <GoogleCalendarIntegration />
          </div>
        </div>
      </div>
    </div>
  );
};
