
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Send, MessageSquare, RefreshCw, Copy, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { generateClientUpdateWithAI } from '@/services/openaiService';
import { Navigation } from '@/components/Navigation';

interface ClientUpdate {
  id: string;
  clientName: string;
  originalMessage: string;
  formattedUpdate: string;
  liveLink: string;
  sentAt: string;
  status: 'draft' | 'sent';
}

export const ClientUpdate = () => {
  const [clientName, setClientName] = useState('');
  const [originalMessage, setOriginalMessage] = useState('');
  const [liveLink, setLiveLink] = useState('');
  const [formattedUpdate, setFormattedUpdate] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientUpdates, setClientUpdates] = useState<ClientUpdate[]>([]);

  const processMessage = async (isRefresh: boolean = false) => {
    if (!originalMessage.trim() || !clientName.trim()) {
      toast({
        title: "Error",
        description: "Please enter client name and update message.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const formatted = await generateClientUpdateWithAI(originalMessage, clientName, liveLink, isRefresh);
      setFormattedUpdate(formatted);
      
      toast({
        title: "Client Update Generated!",
        description: isRefresh ? "Generated a new variation of your client update." : "Your client update has been corrected and formatted using AI.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate client update. Please check your API key in Profile settings.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefresh = () => {
    processMessage(true);
  };

  const shareToWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(formattedUpdate)}`;
    window.open(url, '_blank');
    toast({
      title: "Shared to WhatsApp!",
      description: "Update shared to WhatsApp.",
    });
  };

  const shareToSlack = () => {
    const url = `https://slack.com/intl/en-in/help/articles/201330736-Add-apps-to-your-Slack-workspace`;
    window.open(url, '_blank');
    navigator.clipboard.writeText(formattedUpdate);
    toast({
      title: "Copied for Slack!",
      description: "Update copied to clipboard for Slack sharing.",
    });
  };

  const shareToTeams = () => {
    navigator.clipboard.writeText(formattedUpdate);
    const url = 'https://teams.microsoft.com/';
    window.open(url, '_blank');
    toast({
      title: "Copied for Teams!",
      description: "Update copied to clipboard for Teams sharing.",
    });
  };

  const shareToUpwork = () => {
    navigator.clipboard.writeText(formattedUpdate);
    const url = 'https://www.upwork.com/nx/find-work/best-matches';
    window.open(url, '_blank');
    toast({
      title: "Copied for Upwork!",
      description: "Update copied to clipboard for Upwork sharing.",
    });
  };

  const sendUpdate = () => {
    const newUpdate: ClientUpdate = {
      id: Date.now().toString(),
      clientName,
      originalMessage,
      formattedUpdate,
      liveLink,
      sentAt: new Date().toLocaleString(),
      status: 'sent'
    };

    setClientUpdates([newUpdate, ...clientUpdates]);
    setClientName('');
    setOriginalMessage('');
    setLiveLink('');
    setFormattedUpdate('');
    
    toast({
      title: "Client Update Sent!",
      description: "Your client update has been sent.",
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navigation />
      <div className="pt-16 p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Client Update</h2>
          <p className="text-slate-600">Create professional client updates with automatic AI correction and formatting</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                <span>Client Information & Updates</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Client Name
                </label>
                <Input
                  placeholder="Enter client name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="border-slate-200 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Live Link (Optional)
                </label>
                <Input
                  placeholder="https://your-project-link.com"
                  value={liveLink}
                  onChange={(e) => setLiveLink(e.target.value)}
                  className="border-slate-200 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Update Message
                </label>
                <Textarea
                  placeholder="We com pleted the data base setup. We fix ed the log in issue. We add ed new feat ures for the client."
                  value={originalMessage}
                  onChange={(e) => setOriginalMessage(e.target.value)}
                  className="min-h-32 resize-none border-slate-200 focus:border-blue-500"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Button 
                  onClick={() => processMessage(false)}
                  disabled={isProcessing || !originalMessage.trim() || !clientName.trim()}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4 mr-2" />
                      Generate with AI
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleRefresh}
                  disabled={isProcessing || !originalMessage.trim() || !clientName.trim()}
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
                <Users className="w-5 h-5 text-green-500" />
                <span>AI Generated Client Update</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="min-h-32 p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                {formattedUpdate ? (
                  <div className="text-slate-800 whitespace-pre-wrap">{formattedUpdate}</div>
                ) : (
                  <p className="text-slate-400 italic">AI generated client update will appear here...</p>
                )}
              </div>
              
              {formattedUpdate && (
                <div className="space-y-3">
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
                      size="sm"
                      onClick={() => copyToClipboard(formattedUpdate)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="border-t pt-3">
                    <p className="text-sm font-medium text-slate-700 mb-2">Share to platforms:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" onClick={shareToWhatsApp} className="text-green-600">
                        WhatsApp
                      </Button>
                      <Button variant="outline" size="sm" onClick={shareToSlack} className="text-purple-600">
                        Slack
                      </Button>
                      <Button variant="outline" size="sm" onClick={shareToTeams} className="text-blue-600">
                        Teams
                      </Button>
                      <Button variant="outline" size="sm" onClick={shareToUpwork} className="text-green-700">
                        Upwork
                      </Button>
                    </div>
                  </div>
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
                <span>Client Update History</span>
              </div>
              <Badge variant="secondary">
                {clientUpdates.length} updates
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {clientUpdates.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No client updates yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {clientUpdates.map((update) => (
                  <div 
                    key={update.id}
                    className="p-4 border border-slate-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-slate-500" />
                        <span className="font-medium text-slate-800">Client: {update.clientName}</span>
                        {update.liveLink && (
                          <a 
                            href={update.liveLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
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
                    
                    <div className="bg-green-50 p-3 rounded border border-green-200">
                      <p className="text-sm font-medium text-green-700 mb-1">Client Update:</p>
                      <div className="text-green-800 text-sm whitespace-pre-wrap">{update.formattedUpdate}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
