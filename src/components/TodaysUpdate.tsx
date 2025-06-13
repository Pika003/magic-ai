
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Send, MessageSquare, RefreshCw, Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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

  const processMessage = async () => {
    if (!originalMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter your update message.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate AI processing with sentence correction and formatting
    setTimeout(() => {
      // First, correct common spacing and spelling issues
      let correctedText = originalMessage
        .replace(/\s+/g, ' ') // Multiple spaces to single space
        .replace(/\b(\w+)\s+(\w+)\b/g, (match, word1, word2) => {
          // Fix common split words
          const commonWords = {
            'sen tence': 'sentence',
            'data base': 'database',
            'log in': 'login',
            'sign up': 'signup',
            'set up': 'setup',
            'back end': 'backend',
            'front end': 'frontend',
            'work flow': 'workflow',
            'user name': 'username',
            'pass word': 'password',
            'any thing': 'anything',
            'some thing': 'something',
            'every thing': 'everything',
            'any one': 'anyone',
            'some one': 'someone',
            'every one': 'everyone',
            'may be': 'maybe',
            'can not': 'cannot',
            'a lot': 'a lot', // This one is correct as two words
            'up date': 'update',
            'com pleted': 'completed',
            'fix ed': 'fixed',
            'add ed': 'added',
            'feat ures': 'features'
          };
          
          const combined = `${word1} ${word2}`.toLowerCase();
          return commonWords[combined] || match;
        })
        // Fix basic grammar and capitalization
        .replace(/\bi\b/g, 'I')
        .replace(/\bim\b/g, "I'm")
        .replace(/\bdont\b/g, "don't")
        .replace(/\bcant\b/g, "can't")
        .replace(/\bwont\b/g, "won't")
        .replace(/\bisnt\b/g, "isn't")
        .replace(/\bwasnt\b/g, "wasn't")
        .replace(/\bwerent\b/g, "weren't")
        .replace(/\bdidnt\b/g, "didn't")
        .replace(/\bhavent\b/g, "haven't")
        .replace(/\bhasnt\b/g, "hasn't")
        .replace(/\bshouldnt\b/g, "shouldn't")
        .replace(/\bwouldnt\b/g, "wouldn't")
        .replace(/\bcouldnt\b/g, "couldn't");

      // Split into sentences and clean them up
      const sentences = correctedText
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .map(s => {
          // Capitalize first letter and ensure proper sentence structure
          let sentence = s.charAt(0).toUpperCase() + s.slice(1);
          
          // Ensure sentences end with period
          if (!sentence.endsWith('.') && !sentence.endsWith('!') && !sentence.endsWith('?')) {
            sentence += '.';
          }
          
          return sentence;
        });

      // Format as numbered list
      const numberedList = sentences
        .map((sentence, index) => `${index + 1}. ${sentence}`)
        .join('\n');

      const formatted = `Today's Update:
----------------
${numberedList}`;
      
      setFormattedUpdate(formatted);
      setIsProcessing(false);
      
      toast({
        title: "Update Formatted!",
        description: "Your daily update has been corrected and formatted.",
      });
    }, 1500);
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
        <p className="text-slate-600">Create formatted daily updates with automatic sentence correction</p>
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
            
            <Button 
              onClick={processMessage}
              disabled={isProcessing || !originalMessage.trim()}
              className="w-full bg-blue-500 hover:bg-blue-600"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  Format Update
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-green-500" />
              <span>Formatted Update</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="min-h-32 p-4 bg-green-50 border border-green-200 rounded-lg mb-4 font-mono text-sm">
              {formattedUpdate ? (
                <pre className="text-slate-800 whitespace-pre-wrap">{formattedUpdate}</pre>
              ) : (
                <p className="text-slate-400 italic">Formatted update will appear here...</p>
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
