import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/apiClient';
import { toast } from '@/hooks/use-toast';
import { User, Save, Sparkles, Shield, Mail, Key, CheckCircle2, ArrowRight } from 'lucide-react';
import { UsageStatsCard } from './UsageStatsCard';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

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
  const navigate = useNavigate();
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
        description: "Profile updated successfully!",
      });
      fetchProfile();
      refreshUser();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-muted rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 bg-muted rounded-xl lg:col-span-2" />
          <div className="h-80 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Account & Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your personal credentials, workspace integrations, and subscription status.
          </p>
        </div>

        {isPaidUser ? (
          <Badge className="bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-indigo-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-3 py-1.5 text-xs font-semibold gap-1.5 shadow-sm">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Lifetime Unlimited Access</span>
          </Badge>
        ) : (
          <Button
            onClick={() => navigate('/payment')}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-xs shadow-md"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Upgrade to Pro (₹499)
          </Button>
        )}
      </div>

      {isPaidUser && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Lifetime Unlimited License Active</p>
              <p className="text-xs opacity-90">You have zero usage limits across all AI features, repositories, and CI/CD tools.</p>
            </div>
          </div>
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs">
            Permanent
          </Badge>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information Form */}
        <Card className="lg:col-span-2 border-border/70 shadow-sm bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-lg">
              <User className="w-5 h-5 text-indigo-500" />
              <span>Personal Information</span>
            </CardTitle>
            <CardDescription>
              Your public identity and contact email address
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={updateProfile} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium">Email Address</Label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="pl-9 bg-muted/50 cursor-not-allowed text-xs text-muted-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-xs font-medium">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="e.g. Satyajit Maity"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="username" className="text-xs font-medium">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="e.g. dev_pro"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" disabled={saving} className="text-xs font-semibold">
                  {saving ? (
                    "Saving changes..."
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Usage Statistics Card */}
        <div className="space-y-6">
          <UsageStatsCard />

          <Card className="border-border/70 shadow-sm bg-card/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-500" />
                <span>Quick Shortcuts</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <button
                onClick={() => navigate('/version-control')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-medium hover:bg-muted transition-colors text-left"
              >
                <span>Manage GitHub & GitLab OAuth</span>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              <button
                onClick={() => navigate('/action-marketplace')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-medium hover:bg-muted transition-colors text-left"
              >
                <span>Explore CI/CD Action Marketplace</span>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
