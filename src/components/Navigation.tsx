import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, User, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { NotificationBell } from './NotificationBell';
import { useUsageTracking } from '@/hooks/use-usage-tracking';

export const Navigation = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isPaidUser, hasReachedLimit } = useUsageTracking();

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

  const goToPayment = () => {
    navigate('/payment');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo - always visible on the left */}
          <div 
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">SentenceAI</h1>
          </div>
          
          <div className="flex items-center space-x-1">
            {/* Show payment/upgrade button ONLY if not paid user */}
            {user && !isPaidUser && (
              <button
                onClick={goToPayment}
                className={`bg-yellow-400 hover:bg-yellow-500 text-slate-800 px-3 py-2 rounded-md font-semibold mr-2 transition ${
                  hasReachedLimit ? 'animate-pulse shadow-lg' : ''
                }`}
              >
                {hasReachedLimit ? 'Upgrade Required' : 'Go to Payment'}
              </button>
            )}
            {user ? (
              <>
                <NotificationBell />
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToProfile}
                  className={`flex items-center space-x-2 hover:bg-slate-100 text-slate-600 ${
                    location.pathname === '/profile' ? 'bg-slate-100' : ''
                  }`}
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
