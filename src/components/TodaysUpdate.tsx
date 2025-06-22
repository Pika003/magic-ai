import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MessageSquare, RefreshCw, Copy, Send, Github } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatDailyUpdateWithAI, generateCommitMessageWithAI } from '@/services/openaiService';
import { Layout } from '@/components/Layout';
import { useUsageTracking } from '@/hooks/useUsageTracking';
import { sendSlackMessage, fetchSlackChannels, fetchSlackAllUsers } from '@/services/slackService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectItem, SelectTrigger, SelectContent } from '@/components/ui/select';

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
  const [commitSummary, setCommitSummary] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [isCommitGenerating, setIsCommitGenerating] = useState(false);
  const { incrementUsage, hasReachedLimit } = useUsageTracking();
  const [isSlackDialogOpen, setIsSlackDialogOpen] = useState(false);
  const [slackChannels, setSlackChannels] = useState<any[]>([]);
  const [slackUsers, setSlackUsers] = useState<any[]>([]);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [isSendingSlack, setIsSendingSlack] = useState(false);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [isSlackConnected, setIsSlackConnected] = useState(false);

  useEffect(() => {
    const tokenFromStorage = localStorage.getItem('slack_user_token');
    if (tokenFromStorage) {
      setUserToken(tokenFromStorage);
      setIsSlackConnected(true);
    }
  }, []);

  const handleConnectSlack = () => {
    window.open('https://battleship-8p92.onrender.com/slack/oauth/start', '_self');
  };

  const processUpdate = async (isRefresh: boolean = false) => {
    if (!inputText.trim()) {
      toast({
        title: "Error",
        description: "Please enter your daily updates.",
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
      const usageSuccess = await incrementUsage('daily_update_format');
      if (!usageSuccess) {
        return; // Usage tracking will show the appropriate error
      }

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

  const processCommitMessage = async () => {
    if (!commitSummary.trim()) {
      toast({
        title: "Error",
        description: "Please enter a summary or details to generate a commit message.",
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

    setIsCommitGenerating(true);
    try {
      // Track usage before making API call
      const usageSuccess = await incrementUsage('commit_message_generation');
      if (!usageSuccess) {
        return; // Usage tracking will show the appropriate error
      }

      const result = await generateCommitMessageWithAI(commitSummary);
      setCommitMessage(result);
      toast({
        title: "Commit Message Generated!",
        description: "Your professional commit message is ready.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to generate commit message.",
        variant: "destructive"
      });
    } finally {
      setIsCommitGenerating(false);
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
      description: "Text copied to clipboard.",
    });
  };

  const copyCommitMessage = () => {
    if (!commitMessage) return;
    navigator.clipboard.writeText(commitMessage);
    toast({
      title: "Copied!",
      description: "Commit message copied to clipboard.",
    });
  };

  const openSlackDialog = async () => {
    setIsSlackDialogOpen(true);
    if (slackChannels.length === 0) {
      try {
        const channels = await fetchSlackChannels();
        setSlackChannels(channels);
      } catch (e) {
        toast({ title: 'Error', description: 'Failed to fetch Slack channels', variant: 'destructive' });
      }
    }
    if (slackUsers.length === 0) {
      try {
        const usersResp = await fetchSlackAllUsers();
        if (usersResp.ok && Array.isArray(usersResp.members)) {
          // Filter out bots and deleted users if needed
          const filteredUsers = usersResp.members.filter(
            (u: any) => !u.deleted && !u.is_bot && u.id !== 'USLACKBOT'
          );
          setSlackUsers(filteredUsers);
        }
      } catch (e) {
        toast({ title: 'Error', description: 'Failed to fetch Slack users', variant: 'destructive' });
      }
    }
  };

  const handleSendToSlack = async () => {
    if (!selectedChannel) {
      toast({ title: 'Error', description: 'Please select a Slack channel or user', variant: 'destructive' });
      return;
    }
    setIsSendingSlack(true);
    try {
      await sendSlackMessage({ channel: selectedChannel, text: formattedUpdate, userToken: userToken });
      toast({ title: 'Sent!', description: 'Update sent to Slack successfully.' });
      setIsSlackDialogOpen(false);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to send to Slack', variant: 'destructive' });
    } finally {
      setIsSendingSlack(false);
    }
  };

  return (
    <div className="w-full px-2 md:px-4 pt-10">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Today's Update</h1>
          <p className="text-slate-600">Format your daily updates and generate commit messages with AI</p>
          {!isSlackConnected && (
            <button onClick={handleConnectSlack} className="mt-4 bg-[#4A154B] hover:bg-[#350d36] text-white px-4 py-2 rounded">
              <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/slack.svg" alt="Slack" className="w-5 h-5 mr-2 inline" />
              Connect Slack
            </button>
          )}
          {isSlackConnected && (
            <div className="mt-4 text-green-600 font-medium flex items-center justify-center gap-2">
              <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/slack.svg" alt="Slack" className="w-5 h-5 inline" />
              Slack Connected
            </div>
          )}
        </div>

        {/* Main Input/Output Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Input Card */}
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
                  disabled={isProcessing || !inputText.trim() || hasReachedLimit}
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
                  disabled={isProcessing || !inputText.trim() || hasReachedLimit}
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openSlackDialog}
                    disabled={isProcessing || !formattedUpdate}
                  >
                    <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/slack.svg" alt="Slack" className="w-4 h-4 mr-1 inline" />
                    Send to Slack
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Git Commit Message Section */}
        <Card className="border-slate-200 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Github className="w-5 h-5 text-violet-700" />
              <span>AI Generated Commit Message</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Commit Details / Summary
              </label>
              <Textarea
                placeholder="Describe what your commit does..."
                value={commitSummary}
                onChange={(e) => setCommitSummary(e.target.value)}
                className="min-h-20 resize-none border-slate-200 focus:border-violet-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={processCommitMessage}
                disabled={isCommitGenerating || !commitSummary.trim() || hasReachedLimit}
                className="bg-violet-700 hover:bg-violet-800"
              >
                {isCommitGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Github className="w-4 h-4 mr-2" />
                    Generate Commit Message
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={copyCommitMessage}
                disabled={!commitMessage}
              >
                <Copy className="w-4 h-4" />
                Copy
              </Button>
            </div>
            {commitMessage && (
              <div className="bg-gray-50 border border-gray-200 rounded px-4 py-3">
                <span className="font-mono text-green-800">{commitMessage}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* History Section */}
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
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No daily updates yet</p>
                <p className="text-slate-400 text-sm mt-2">Start creating daily updates to see your history here</p>
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

      <Dialog open={isSlackDialogOpen} onOpenChange={setIsSlackDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Update to Slack</DialogTitle>
          </DialogHeader>
          <div className="mb-4">
            <Select value={selectedChannel} onValueChange={setSelectedChannel}>
              <SelectTrigger>
                <span>
                  {selectedChannel
                    ? (
                        slackChannels.find(ch => ch.id === selectedChannel)?.name ||
                        slackUsers.find(u => u.id === selectedChannel)?.real_name ||
                        slackUsers.find(u => u.id === selectedChannel)?.name
                      )
                    : 'Select a channel or user'}
                </span>
              </SelectTrigger>
              <SelectContent className="max-h-72 overflow-y-auto">
                <div className="px-2 py-1 text-xs text-gray-500 font-semibold">Channels</div>
                {slackChannels.map((ch) => (
                  <SelectItem key={ch.id} value={ch.id}>
                    {ch.is_private ? ' ' : '#'}{ch.name}
                  </SelectItem>
                ))}
                <div className="px-2 py-1 text-xs text-gray-500 font-semibold mt-2">Users</div>
                {slackUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.real_name || u.name} {u.is_bot ? '(bot)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSendToSlack} disabled={isSendingSlack || !selectedChannel} className="w-full bg-blue-600 hover:bg-blue-700">
            {isSendingSlack ? 'Sending...' : 'Send'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};
