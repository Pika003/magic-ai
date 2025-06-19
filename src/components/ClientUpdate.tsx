
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Send, MessageSquare, RefreshCw, Copy, ExternalLink, Mail } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { generateClientUpdateWithAI } from '@/services/openaiService';
import { Layout } from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useUsageTracking } from '@/hooks/useUsageTracking';

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
  const [yourName, setYourName] = useState('Your Name');
  const [recipientEmail, setRecipientEmail] = useState('');
  const { incrementUsage, hasReachedLimit } = useUsageTracking();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .maybeSingle();
        if (data && data.full_name) {
          setYourName(data.full_name);
        }
      }
    };
    fetchProfile();
  }, []);

  const processMessage = async (isRefresh: boolean = false) => {
    if (!originalMessage.trim() || !clientName.trim()) {
      toast({
        title: "Error",
        description: "Please enter client name and update message.",
        variant: "destructive"
      });
      return;
    }

    if (hasReachedLimit) {
      toast({
        title: "Usage Limit Reached",
        description: "You've reached your usage limit. Please upgrade to continue.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Track usage before making API call
      const usageSuccess = await incrementUsage('client_update_generation');
      if (!usageSuccess) {
        return; // Usage tracking will show the appropriate error
      }

      const formatted = await generateClientUpdateWithAI(originalMessage, clientName, liveLink, yourName, isRefresh);
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

  const getMailToLink = () => {
    if (!formattedUpdate) return '#';
    const subject = encodeURIComponent(`Client Update for ${clientName || "Project"}`);
    const body = encodeURIComponent(formattedUpdate);
    const to = recipientEmail ? encodeURIComponent(recipientEmail) : '';
    return `mailto:${to}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="w-full px-2 md:px-4 pt-10">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Client Update</h1>
          <p className="text-slate-600">Create professional client updates with automatic AI correction and formatting</p>
        </div>

        {/* Main Input/Output Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Input Card */}
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
                  placeholder="We completed the database setup. We fixed the login issue. We added new features for the client."
                  value={originalMessage}
                  onChange={(e) => setOriginalMessage(e.target.value)}
                  className="min-h-32 resize-none border-slate-200 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => processMessage(false)}
                  disabled={isProcessing || !originalMessage.trim() || !clientName.trim() || hasReachedLimit}
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
                  disabled={isProcessing || !originalMessage.trim() || !clientName.trim() || hasReachedLimit}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Output Card */}
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

                  <div className="flex items-center space-x-2">
                    <Input
                      type="email"
                      placeholder="Recipient Email (optional)"
                      value={recipientEmail}
                      onChange={e => setRecipientEmail(e.target.value)}
                      className="flex-1 border-slate-200 focus:border-blue-500"
                    />
                    <a
                      href={getMailToLink()}
                      onClick={e => {
                        if (!formattedUpdate) {
                          e.preventDefault();
                          toast({
                            title: "Error",
                            description: "No client update to send.",
                            variant: "destructive"
                          });
                        }
                      }}
                      className="flex-none"
                    >
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-blue-600"
                      >
                        <Mail className="w-4 h-4" />
                        Email Send
                      </Button>
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* History Section */}
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
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No client updates yet</p>
                <p className="text-slate-400 text-sm mt-2">Start creating client updates to see your history here</p>
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
