import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { User, Settings, Key, Save } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { GoogleCalendarIntegration } from '@/components/GoogleCalendarIntegration';
import { UsageStatsCard } from './UsageStatsCard';

interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

export const ProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openaiKey, setOpenaiKey] = useState('');
  const [keyLoading, setKeyLoading] = useState(false);
  const [isPaidUser, setIsPaidUser] = useState(false);

  // Form state
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchOpenAIKey();
      fetchPaidStatus();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfile(data);
        setFullName(data.full_name || '');
        setUsername(data.username || '');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOpenAIKey = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_secrets')
        .select('secret_value')
        .eq('user_id', user.id)
        .eq('secret_name', 'OPENAI_API_KEY')
        .maybeSingle();

      if (data) {
        setOpenaiKey(data.secret_value);
      }
    } catch (error) {
      console.error('Error fetching API key:', error);
    }
  };

  const fetchPaidStatus = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('paid_user')
        .eq('id', user.id)
        .maybeSingle();
      if (!error && data) {
        setIsPaidUser(!!data.paid_user);
      }
    } catch (e) {
      // ignore
    }
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: fullName,
          username: username,
          updated_at: new Date().toISOString()
        });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Profile updated successfully!"
        });
        fetchProfile();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const saveOpenAIKey = async () => {
    if (!user || !openaiKey.trim()) return;

    setKeyLoading(true);
    try {
      const { error } = await supabase
        .from('user_secrets')
        .upsert({
          user_id: user.id,
          secret_name: 'OPENAI_API_KEY',
          secret_value: openaiKey.trim(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "OpenAI API key saved securely!"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save API key",
        variant: "destructive"
      });
    } finally {
      setKeyLoading(false);
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
          <p className="text-slate-600">Manage your account, API settings, and integrations</p>
        </div>
        
        {/* Profile Info & Usage Stats Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Card className="h-full">
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
          </div>
          
          <div className="flex items-stretch">
            <UsageStatsCard />
          </div>
        </div>
        
        {/* API Configuration & Integrations Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="w-5 h-5 text-green-500" />
                <span>API Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="openaiKey">OpenAI API Key</Label>
                <Input
                  id="openaiKey"
                  type="password"
                  placeholder="Enter your OpenAI API key"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                />
                <p className="text-sm text-slate-500">
                  Your API key is stored securely and encrypted in the database.
                </p>
              </div>
              <Button 
                onClick={saveOpenAIKey} 
                disabled={keyLoading || !openaiKey.trim()}
                className="w-full bg-green-500 hover:bg-green-600"
              >
                {keyLoading ? (
                  "Saving..."
                ) : (
                  <>
                    <Key className="w-4 h-4 mr-2" />
                    Save API Key
                  </>
                )}
              </Button>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-1">Why is this needed?</h4>
                <p className="text-sm text-blue-700">
                  Your OpenAI API key enables the AI text correction features. It's stored securely and only accessible by you.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <GoogleCalendarIntegration />
          </Card>
        </div>
        {isPaidUser && (
          <div className="mb-8">
            <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg font-semibold text-center">
              You have unlimited usage unlocked! 🎉
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
