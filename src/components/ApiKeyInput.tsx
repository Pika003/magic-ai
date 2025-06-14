
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Key, Eye, EyeOff } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { setApiKey } from '@/services/openaiService';

interface ApiKeyInputProps {
  onApiKeySet: () => void;
}

export const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onApiKeySet }) => {
  const [apiKey, setApiKeyState] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter your OpenAI API key.",
        variant: "destructive"
      });
      return;
    }

    if (!apiKey.startsWith('sk-')) {
      toast({
        title: "Error",
        description: "Invalid API key format. OpenAI API keys start with 'sk-'.",
        variant: "destructive"
      });
      return;
    }

    setApiKey(apiKey.trim());
    toast({
      title: "Success!",
      description: "API key saved successfully.",
    });
    onApiKeySet();
  };

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-amber-800">
          <Key className="w-5 h-5" />
          <span>OpenAI API Key Required</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-amber-700 text-sm">
          To use AI features, please enter your OpenAI API key. Your key will be stored locally in your browser.
        </p>
        
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <Input
              type={showApiKey ? 'text' : 'password'}
              placeholder="sk-proj-..."
              value={apiKey}
              onChange={(e) => setApiKeyState(e.target.value)}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </Button>
          </div>
          <Button onClick={handleSaveApiKey} className="bg-amber-600 hover:bg-amber-700">
            Save Key
          </Button>
        </div>
        
        <p className="text-xs text-amber-600">
          Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">OpenAI Platform</a>
        </p>
      </CardContent>
    </Card>
  );
};
