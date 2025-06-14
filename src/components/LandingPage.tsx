
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Users, Calendar, Wand2, Shield, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: CheckCircle,
      title: 'AI Text Correction',
      description: 'Fix grammar, spacing, and improve sentence structure with advanced AI.',
      color: 'text-blue-500'
    },
    {
      icon: Users,
      title: 'Client Updates',
      description: 'Generate professional client communication messages effortlessly.',
      color: 'text-green-500'
    },
    {
      icon: Calendar,
      title: 'Daily Updates',
      description: 'Create formatted daily progress reports with AI assistance.',
      color: 'text-purple-500'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your API keys and data are encrypted and stored securely.',
      color: 'text-red-500'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Get instant AI-powered corrections and formatting in seconds.',
      color: 'text-yellow-500'
    },
    {
      icon: Wand2,
      title: 'Smart Formatting',
      description: 'Multiple format variations and professional styling options.',
      color: 'text-indigo-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-20 pb-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-slate-800 mb-6">
            Perfect Your Text with{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Magic
            </span>
          </h1>
          
          <p className="text-xl text-slate-600 mb-8 leading-relaxed">
            Transform messy text into professional, polished content. Fix grammar, improve structure, 
            and create perfectly formatted updates with the power of artificial intelligence.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <div className="text-center">
                <p className="text-slate-600 mb-4">Welcome back, {user.email}!</p>
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-8 py-3 text-lg"
                >
                  <Wand2 className="w-5 h-5 mr-2" />
                  Continue to App
                </Button>
              </div>
            ) : (
              <>
                <Button 
                  size="lg" 
                  onClick={() => navigate('/auth')}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-8 py-3 text-lg"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Get Started Free
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => navigate('/auth')}
                  className="px-8 py-3 text-lg border-2"
                >
                  Sign In
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            Powerful Features for Professional Communication
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Everything you need to create perfect, professional text content with AI assistance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <Icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <span className="text-slate-800">{feature.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* CTA Section */}
      {!user && (
        <div className="container mx-auto px-4 py-16">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 md:p-12 text-center text-white">
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Transform Your Text?
            </h3>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of users who trust SentenceAI for professional communication.
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="bg-white text-blue-600 hover:bg-slate-50 px-8 py-3 text-lg font-semibold"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Start Using SentenceAI
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
