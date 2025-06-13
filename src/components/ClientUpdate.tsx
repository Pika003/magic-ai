
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Send, MessageSquare, User, Mail, Link, MessageCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ClientMessage {
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

You can check the progress here: https://example.com

Thanks`,
      liveLink: 'https://example.com',
      sentAt: '2024-01-15 2:30 PM',
      status: 'sent'
    }
  ]);

  const correctSentence = (text: string) => {
    // First, correct common spacing and spelling issues
    let correctedText = text
      .replace(/\s+/g, ' ') // Multiple spaces to single space
      .trim()
      // Fix common split words
      .replace(/\bsen tence\b/gi, 'sentence')
      .replace(/\bdata base\b/gi, 'database')
      .replace(/\blog in\b/gi, 'login')
      .replace(/\bsign up\b/gi, 'signup')
      .replace(/\bset up\b/gi, 'setup')
      .replace(/\bback end\b/gi, 'backend')
      .replace(/\bfront end\b/gi, 'frontend')
      .replace(/\bwork flow\b/gi, 'workflow')
      .replace(/\buser name\b/gi, 'username')
      .replace(/\bpass word\b/gi, 'password')
      .replace(/\bany thing\b/gi, 'anything')
      .replace(/\bsome thing\b/gi, 'something')
      .replace(/\bevery thing\b/gi, 'everything')
      .replace(/\bany one\b/gi, 'anyone')
      .replace(/\bsome one\b/gi, 'someone')
      .replace(/\bevery one\b/gi, 'everyone')
      .replace(/\bmay be\b/gi, 'maybe')
      .replace(/\bcan not\b/gi, 'cannot')
      .replace(/\bup date\b/gi, 'update')
      .replace(/\bcom pleted\b/gi, 'completed')
      .replace(/\bfix ed\b/gi, 'fixed')
      .replace(/\badd ed\b/gi, 'added')
      .replace(/\bfeat ures\b/gi, 'features')
      .replace(/\bimple mented\b/gi, 'implemented')
      .replace(/\boptim ized\b/gi, 'optimized')
      .replace(/\breso lved\b/gi, 'resolved')
      .replace(/\bdeploy ed\b/gi, 'deployed')
      // Fix basic grammar
      .replace(/\bi\b/g, 'I')
      .replace(/\bim\b/gi, "I'm")
      .replace(/\bdont\b/gi, "don't")
      .replace(/\bcant\b/gi, "can't")
      .replace(/\bwont\b/gi, "won't")
      .replace(/\bisnt\b/gi, "isn't")
      .replace(/\bwasnt\b/gi, "wasn't")
      .replace(/\bwerent\b/gi, "weren't")
      .replace(/\bdidnt\b/gi, "didn't")
      .replace(/\bhavent\b/gi, "haven't")
      .replace(/\bhasnt\b/gi, "hasn't")
      .replace(/\bshouldnt\b/gi, "shouldn't")
      .replace(/\bwouldnt\b/gi, "wouldn't")
      .replace(/\bcouldnt\b/gi, "couldn't")
      // Improve common phrases
      .replace(/\bmade\s+(the\s+)?website\b/gi, 'developed the website')
      .replace(/\bdid\s+(the\s+)?coding\b/gi, 'completed the development')
      .replace(/\bfixed\s+(the\s+)?bugs?\b/gi, 'resolved the issues')
      .replace(/\bmade\s+(it\s+)?better\b/gi, 'improved the functionality')
      .replace(/\bput\s+new\s+things?\b/gi, 'added new features')
      .replace(/\bmade\s+(it\s+)?faster\b/gi, 'optimized the performance')
      .replace(/\bworking\s+on\b/gi, 'developing')
      .replace(/\bmaking\s+sure\b/gi, 'ensuring')
      .replace(/\btesting\s+(the\s+)?stuff\b/gi, 'conducting quality assurance')
      .replace(/\bfixing\s+(the\s+)?problems?\b/gi, 'resolving issues');

    return correctedText;
  };

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
      // Correct and improve the entire message first
      const correctedMessage = correctSentence(originalMessage);
      
      // Split the corrected message into sentences and format as numbered list
      const sentences = correctedMessage
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .map(s => {
          // Capitalize first letter and ensure proper sentence structure
          let sentence = s.charAt(0).toUpperCase() + s.slice(1);
          
          // Ensure professional language
          sentence = sentence
            .replace(/\bwe\s+/gi, 'We ')
            .replace(/\bi\s+/gi, 'We ');
          
          return sentence + '.';
        });

      const numberedList = sentences
        .map((sentence, index) => `${index + 1}. ${sentence}`)
        .join('\n');

      let formatted = `Hi @${clientName},

Today's Update:
----------------
${numberedList}`;

      // Add live link if provided
      if (liveLink.trim()) {
        formatted += `\n\nYou can check the progress here: ${liveLink}`;
      }

      formatted += '\n\nThanks';
      
      setFormattedUpdate(formatted);
      setIsProcessing(false);
      
      toast({
        title: "Update Formatted!",
        description: "Your client update has been formatted professionally with improved sentences.",
      });
    }, 1500);
  };

  const shareToWhatsApp = () => {
    const message = encodeURIComponent(formattedUpdate);
    window.open(`https://wa.me/?text=${message}`, '_blank');
    toast({
      title: "WhatsApp Opened",
      description: "Share your update via WhatsApp.",
    });
  };

  const shareToSlack = () => {
    const message = encodeURIComponent(formattedUpdate);
    window.open(`https://slack.com/intl/en-in/help/articles/201330736-Add-apps-to-your-Slack-workspace#share-content-in-slack`, '_blank');
    navigator.clipboard.writeText(formattedUpdate);
    toast({
      title: "Copied for Slack",
      description: "Message copied to clipboard. Paste it in Slack.",
    });
  };

  const shareToTeams = () => {
    navigator.clipboard.writeText(formattedUpdate);
    window.open('https://teams.microsoft.com/', '_blank');
    toast({
      title: "Copied for Teams",
      description: "Message copied to clipboard. Paste it in Microsoft Teams.",
    });
  };

  const shareToUpwork = () => {
    navigator.clipboard.writeText(formattedUpdate);
    window.open('https://www.upwork.com/nx/wm/workroom', '_blank');
    toast({
      title: "Copied for Upwork",
      description: "Message copied to clipboard. Paste it in Upwork messages.",
    });
  };

  const sendMessage = () => {
    const newMessage: ClientMessage = {
      id: Date.now().toString(),
      clientName,
      originalMessage,
      formattedUpdate,
      liveLink,
      sentAt: new Date().toLocaleString(),
      status: 'sent'
    };

    setClientMessages([newMessage, ...clientMessages]);
    setClientName('');
    setOriginalMessage('');
    setFormattedUpdate('');
    setLiveLink('');
    
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
      liveLink,
      sentAt: new Date().toLocaleString(),
      status: 'draft'
    };

    setClientMessages([newMessage, ...clientMessages]);
    setClientName('');
    setOriginalMessage('');
    setFormattedUpdate('');
    setLiveLink('');
    
    toast({
      title: "Draft Saved!",
      description: "Update saved as draft for later sending.",
    });
  };

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Client Update</h2>
        <p className="text-slate-600">Format your sentences into professional client updates with improved grammar</p>
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
                placeholder="i completed task A. i fix ed issue B. i add ed feature C."
                value={originalMessage}
                onChange={(e) => setOriginalMessage(e.target.value)}
                className="min-h-32 resize-none border-slate-200 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Live Link (Optional)
              </label>
              <Input
                placeholder="https://your-website.com"
                value={liveLink}
                onChange={(e) => setLiveLink(e.target.value)}
                className="border-slate-200 focus:border-blue-500"
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
              <div className="space-y-3">
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
                
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium text-slate-700 mb-2">Share via:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={shareToWhatsApp}
                      className="flex items-center space-x-2"
                    >
                      <MessageCircle className="w-4 h-4 text-green-600" />
                      <span>WhatsApp</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={shareToSlack}
                      className="flex items-center space-x-2"
                    >
                      <MessageSquare className="w-4 h-4 text-purple-600" />
                      <span>Slack</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={shareToTeams}
                      className="flex items-center space-x-2"
                    >
                      <Users className="w-4 h-4 text-blue-600" />
                      <span>Teams</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={shareToUpwork}
                      className="flex items-center space-x-2"
                    >
                      <User className="w-4 h-4 text-green-500" />
                      <span>Upwork</span>
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
                      {message.liveLink && (
                        <Link className="w-4 h-4 text-blue-500" />
                      )}
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
