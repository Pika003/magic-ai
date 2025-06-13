
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Send, MessageSquare, User, Mail } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ClientMessage {
  id: string;
  clientName: string;
  originalMessage: string;
  formattedUpdate: string;
  sentAt: string;
  status: 'draft' | 'sent';
}

export const ClientUpdate = () => {
  const [clientName, setClientName] = useState('');
  const [originalMessage, setOriginalMessage] = useState('');
  const [formattedUpdate, setFormattedUpdate] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientMessages, setClientMessages] = useState<ClientMessage[]>([
    {
      id: '1',
      clientName: 'John Smith',
      originalMessage: 'We completed the database setup. We fixed the login issue. We added new features.',
      formattedUpdate: `Hi @John Smith,

Today's Update:
----------------
1. We completed the database setup.
2. We fixed the login issue.
3. We added new features.

Thanks`,
      sentAt: '2024-01-15 2:30 PM',
      status: 'sent'
    }
  ]);

  const processMessage = async () => {
    if (!clientName.trim() || !originalMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter both client name and message.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate AI processing
    setTimeout(() => {
      // Split the message into sentences and format as numbered list
      const sentences = originalMessage
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .map(s => s.charAt(0).toUpperCase() + s.slice(1));

      const numberedList = sentences
        .map((sentence, index) => `${index + 1}. ${sentence}.`)
        .join('\n');

      const formatted = `Hi @${clientName},

Today's Update:
----------------
${numberedList}

Thanks`;
      
      setFormattedUpdate(formatted);
      setIsProcessing(false);
      
      toast({
        title: "Update Formatted!",
        description: "Your client update has been formatted professionally.",
      });
    }, 1500);
  };

  const sendMessage = () => {
    const newMessage: ClientMessage = {
      id: Date.now().toString(),
      clientName,
      originalMessage,
      formattedUpdate,
      sentAt: new Date().toLocaleString(),
      status: 'sent'
    };

    setClientMessages([newMessage, ...clientMessages]);
    setClientName('');
    setOriginalMessage('');
    setFormattedUpdate('');
    
    toast({
      title: "Update Sent!",
      description: `Professional update sent to ${clientName}.`,
    });
  };

  const saveDraft = () => {
    const newMessage: ClientMessage = {
      id: Date.now().toString(),
      clientName,
      originalMessage,
      formattedUpdate,
      sentAt: new Date().toLocaleString(),
      status: 'draft'
    };

    setClientMessages([newMessage, ...clientMessages]);
    setClientName('');
    setOriginalMessage('');
    setFormattedUpdate('');
    
    toast({
      title: "Draft Saved!",
      description: "Update saved as draft for later sending.",
    });
  };

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Client Update</h2>
        <p className="text-slate-600">Format your sentences into professional client updates</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              <span>Create Update</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Client Name
              </label>
              <Input
                placeholder="Enter client name..."
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="border-slate-200 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Your Updates (separate with periods)
              </label>
              <Textarea
                placeholder="We completed task A. We fixed issue B. We implemented feature C."
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
              {isProcessing ? 'Formatting...' : 'Format Update'}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="w-5 h-5 text-green-500" />
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
                  onClick={sendMessage}
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-slate-600" />
              <span>Update History</span>
            </div>
            <Badge variant="secondary">
              {clientMessages.length} updates
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {clientMessages.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No updates yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {clientMessages.map((message) => (
                <div 
                  key={message.id}
                  className="p-4 border border-slate-200 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-slate-500" />
                      <span className="font-medium text-slate-800">{message.clientName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={message.status === 'sent' ? 'default' : 'secondary'}
                        className={message.status === 'sent' ? 'bg-green-500' : ''}
                      >
                        {message.status === 'sent' ? 'Sent' : 'Draft'}
                      </Badge>
                      <span className="text-sm text-slate-500">{message.sentAt}</span>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 p-3 rounded border mb-3">
                    <p className="text-sm font-medium text-slate-600 mb-1">Original:</p>
                    <p className="text-slate-700">{message.originalMessage}</p>
                  </div>
                  
                  <div className="bg-green-50 p-3 rounded border border-green-200">
                    <p className="text-sm font-medium text-green-700 mb-1">Formatted Update:</p>
                    <pre className="text-green-800 text-sm whitespace-pre-wrap font-mono">{message.formattedUpdate}</pre>
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
