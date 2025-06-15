import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MessageSquare, RefreshCw, Copy, Send } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatDailyUpdateWithAI } from '@/services/openaiService';
import { Navigation } from '@/components/Navigation';
import { Layout } from '@/components/Layout';

interface DailyUpdate {
  id: string;
  originalText: string;
  formattedUpdate: string;
  createdAt: string;
}

export const TodaysUpdate = () => {
  const [inputText, setInputText] = useState('');
  const [formattedUpdate, setFormattedUpdate] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [dailyUpdates, setDailyUpdates] = useState<DailyUpdate[]>([]);

  const processUpdate = async (isRefresh: boolean = false) => {
    if (!inputText.trim()) {
      toast({
        title: "Error",
        description: "Please enter your daily updates.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const formatted = await formatDailyUpdateWithAI(inputText, isRefresh);
      setFormattedUpdate(formatted);
      
      toast({
        title: "Daily Update Formatted!",
        description: isRefresh ? "Generated a new variation of your daily update." : "Your daily update has been formatted using AI.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to format daily update. Please check your API key in Profile settings.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefresh = () => {
    processUpdate(true);
  };

  const saveUpdate = () => {
    const newUpdate: DailyUpdate = {
      id: Date.now().toString(),
      originalText: inputText,
      formattedUpdate: formattedUpdate,
      createdAt: new Date().toLocaleString()
    };

    setDailyUpdates([newUpdate, ...dailyUpdates]);
    setInputText('');
    setFormattedUpdate('');
    
    toast({
      title: "Daily Update Saved!",
      description: "Your daily update has been saved.",
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Update copied to clipboard.",
    });
  };

  return (
    <Layout>
      <div className="p-8 max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Today's Update</h2>
          <p className="text-slate-600">Format your daily updates with AI-powered structure and correction</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                <span>Daily Update Input</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Enter your daily updates here... completed task 1, worked on task 2, fixed bug in task 3..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="min-h-32 resize-none border-slate-200 focus:border-blue-500"
              />
              
              <div className="flex items-center space-x-2">
                <Button 
                  onClick={() => processUpdate(false)}
                  disabled={isProcessing || !inputText.trim()}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4 mr-2" />
                      Format with AI
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleRefresh}
                  disabled={isProcessing || !inputText.trim()}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-green-500" />
                <span>AI Formatted Update</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="min-h-32 p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                {formattedUpdate ? (
                  <div className="text-slate-800 whitespace-pre-wrap">{formattedUpdate}</div>
                ) : (
                  <p className="text-slate-400 italic">Formatted daily update will appear here...</p>
                )}
              </div>
              
              {formattedUpdate && (
                <div className="flex space-x-2">
                  <Button 
                    onClick={saveUpdate}
                    className="flex-1 bg-green-500 hover:bg-green-600"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Save Update
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(formattedUpdate)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-slate-600" />
                <span>Daily Update History</span>
              </div>
              <Badge variant="secondary">
                {dailyUpdates.length} updates
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dailyUpdates.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No daily updates yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dailyUpdates.map((update) => (
                  <div 
                    key={update.id}
                    className="p-4 border border-slate-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-slate-500">{update.createdAt}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(update.formattedUpdate)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="bg-green-50 p-3 rounded border border-green-200">
                      <p className="text-sm font-medium text-green-700 mb-1">Formatted Update:</p>
                      <div className="text-green-800 text-sm whitespace-pre-wrap">{update.formattedUpdate}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};
