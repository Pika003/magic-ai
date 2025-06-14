import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Send, MessageSquare, RefreshCw, Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatDailyUpdateWithAI } from '@/services/openaiService';

interface DailyUpdate {
  id: string;
  originalMessage: string;
  formattedUpdate: string;
  sentAt: string;
  status: 'draft' | 'sent';
}

export const TodaysUpdate = () => {
  const [originalMessage, setOriginalMessage] = useState('');
  const [formattedUpdate, setFormattedUpdate] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [dailyUpdates, setDailyUpdates] = useState<DailyUpdate[]>([
    {
      id: '1',
      originalMessage: 'We com pleted the data base setup. We fix ed the log in issue. We add ed new feat ures.',
      formattedUpdate: `Today's Update:
----------------
1. We completed the database setup.
2. We fixed the login issue.
3. We added new features.`,
      sentAt: '2024-01-15 2:30 PM',
      status: 'sent'
    }
  ]);

  const processMessage = async (isRefresh: boolean = false) => {
    if (!originalMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter your update message.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const formatted = await formatDailyUpdateWithAI(originalMessage, isRefresh);
      setFormattedUpdate(formatted);
      
      toast({
        title: "Update Formatted!",
        description: isRefresh ? "Generated a new variation of your formatted update." : "Your daily update has been corrected and formatted using AI.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to format update. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefresh = async () => {
    await processMessage(true);
  };

  const sendUpdate = () => {
    const newUpdate: DailyUpdate = {
      id: Date.now().toString(),
      originalMessage,
      formattedUpdate,
      sentAt: new Date().toLocaleString(),
      status: 'sent'
    };

    setDailyUpdates([newUpdate, ...dailyUpdates]);
    setOriginalMessage('');
    setFormattedUpdate('');
    
    toast({
      title: "Update Sent!",
      description: "Your daily update has been sent.",
    });
  };

  const saveDraft = () => {
    const newUpdate: DailyUpdate = {
      id: Date.now().toString(),
      originalMessage,
      formattedUpdate,
      sentAt: new Date().toLocaleString(),
      status: 'draft'
    };

    setDailyUpdates([newUpdate, ...dailyUpdates]);
    setOriginalMessage('');
    setFormattedUpdate('');
    
    toast({
      title: "Draft Saved!",
      description: "Update saved as draft for later sending.",
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
    <div className="p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Today's Update</h2>
        <p className="text-slate-600">Create formatted daily updates with automatic AI sentence correction</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              <span>Your Updates</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Enter your updates (separate with periods)
              </label>
              <Textarea
                placeholder="We com pleted the data base setup. We fix ed the log in issue. We add ed new feat ures."
                value={originalMessage}
                onChange={(e) => setOriginalMessage(e.target.value)}
                className="min-h-32 resize-none border-slate-200 focus:border-blue-500"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                onClick={processMessage}
                disabled={isProcessing || !originalMessage.trim()}
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
                disabled={isProcessing || !originalMessage.trim()}
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
            <div className="min-h-32 p-4 bg-green-50 border border-green-200 rounded-lg mb-4 font-mono text-sm">
              {formattedUpdate ? (
                <pre className="text-slate-800 whitespace-pre-wrap">{formattedUpdate}</pre>
              ) : (
                <p className="text-slate-400 italic">AI formatted update will appear here...</p>
              )}
            </div>
            
            {formattedUpdate && (
              <div className="flex space-x-2">
                <Button 
                  onClick={sendUpdate}
                  className="flex-1 bg-green-500 hover:bg-green-600"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Update
                </Button>
                <Button 
                  variant="outline"
                  onClick={saveDraft}
                  className="flex-1"
                >
                  Save Draft
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
              <span>Update History</span>
            </div>
            <Badge variant="secondary">
              {dailyUpdates.length} updates
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dailyUpdates.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No updates yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dailyUpdates.map((update) => (
                <div 
                  key={update.id}
                  className="p-4 border border-slate-200 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span className="font-medium text-slate-800">Daily Update</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={update.status === 'sent' ? 'default' : 'secondary'}
                        className={update.status === 'sent' ? 'bg-green-500' : ''}
                      >
                        {update.status === 'sent' ? 'Sent' : 'Draft'}
                      </Badge>
                      <span className="text-sm text-slate-500">{update.sentAt}</span>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 p-3 rounded border mb-3">
                    <p className="text-sm font-medium text-slate-600 mb-1">Original:</p>
                    <p className="text-slate-700">{update.originalMessage}</p>
                  </div>
                  
                  <div className="bg-green-50 p-3 rounded border border-green-200">
                    <p className="text-sm font-medium text-green-700 mb-1">Formatted Update:</p>
                    <pre className="text-green-800 text-sm whitespace-pre-wrap font-mono">{update.formattedUpdate}</pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
