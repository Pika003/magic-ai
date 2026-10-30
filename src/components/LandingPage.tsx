import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  GitPullRequest,
  Users,
  Calendar,
  Wand2,
  GitBranch,
  Terminal,
  Send,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: GitPullRequest,
      title: 'PR & Commit Studio',
      description: 'Generate Conventional Commits (feat, fix) and GitHub PR descriptions from rough notes or git diffs.',
      color: 'text-blue-500',
    },
    {
      icon: Calendar,
      title: 'Daily Standup Formatter',
      description: 'Transform quick task dumps into clean Agile/Scrum standup updates ready for Slack or Teams.',
      color: 'text-purple-500',
    },
    {
      icon: Users,
      title: 'Client Progress Hub',
      description: 'Draft diplomatic, milestone-driven progress digests linked directly to your active client projects.',
      color: 'text-green-500',
    },
    {
      icon: Terminal,
      title: 'Structure Templates',
      description: 'One-click industry presets for Agile standups, changelogs, release notes, and incident post-mortems.',
      color: 'text-indigo-500',
    },
    {
      icon: GitBranch,
      title: 'Version Control Sync',
      description: 'Connect GitHub and GitLab to track repositories, commits, and project activity.',
      color: 'text-orange-500',
    },
    {
      icon: Send,
      title: 'Direct Slack & Email Dispatch',
      description: 'Send formatted daily updates directly to your Slack channels or dispatch client emails in seconds.',
      color: 'text-rose-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-20 pb-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Terminal className="w-8 h-8 text-white" />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Built for Software Developers & Freelancers
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight">
            Code All Day.{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Let AI Handle The Updates.
            </span>
          </h1>

          <p className="text-xl text-slate-600 mb-8 leading-relaxed max-w-2xl mx-auto">
            Transform messy commit logs and task notes into professional daily standups, Conventional Commits, Pull Request descriptions, and client milestone updates.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <div className="text-center">
                <Button
                  size="lg"
                  onClick={() => navigate('/correct-sentence')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-3 text-lg"
                >
                  <Wand2 className="w-5 h-5 mr-2" />
                  Open Dev Dashboard
                </Button>
              </div>
            ) : (
              <>
                <Button
                  size="lg"
                  onClick={() => navigate('/auth')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-3 text-lg shadow-md"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/auth')}
                  className="border-slate-300 hover:bg-slate-50 px-8 py-3 text-lg"
                >
                  Sign In
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-20 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="border-slate-200/80 hover:border-slate-300 transition-all duration-300 hover:shadow-lg bg-white/80 backdrop-blur-sm"
              >
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 rounded-lg bg-slate-100">
                      <Icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-lg text-slate-800">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 leading-relaxed text-sm">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
