
import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Users, Calendar, User, LogOut, Home } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface NavigationProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export const Navigation = ({ activeSection, setActiveSection }: NavigationProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const sections = [
    {
      id: 'correct-sentence',
      label: 'Correct Sentence',
      icon: CheckCircle,
      description: 'Instant AI correction'
    },
    {
      id: 'client-update',
      label: 'Client Update',
      icon: Users,
      description: 'Client communication'
    },
    {
      id: 'todays-update',
      label: "Today's Update",
      icon: Calendar,
      description: 'Daily updates'
    }
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive"
      });
    }
  };

  const goToProfile = () => {
    navigate('/profile');
  };

  const goHome = () => {
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">SentenceAI</h1>
          </div>
          
          <div className="flex items-center space-x-1">
            {user ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goHome}
                  className="flex items-center space-x-2 hover:bg-slate-100 text-slate-600"
                >
                  <Home className="w-4 h-4" />
                  <span className="hidden sm:inline">Home</span>
                </Button>
                
                {sections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  
                  return (
                    <Button
                      key={section.id}
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setActiveSection(section.id)}
                      className={`flex items-center space-x-2 transition-all duration-200 ${
                        isActive 
                          ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-md' 
                          : 'hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{section.label}</span>
                    </Button>
                  );
                })}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToProfile}
                  className="flex items-center space-x-2 hover:bg-slate-100 text-slate-600"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Profile</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 hover:bg-slate-100 text-slate-600"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </>
            ) : (
              <Button
                onClick={() => navigate('/auth')}
                className="bg-blue-500 hover:bg-blue-600"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
