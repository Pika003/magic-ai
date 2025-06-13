
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Wand2, Copy, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const CorrectSentence = () => {
  const [inputText, setInputText] = useState('');
  const [correctedText, setCorrectedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [corrections, setCorrections] = useState<string[]>([]);

  const handleCorrection = async () => {
    if (!inputText.trim()) {
      toast({
        title: "Error",
        description: "Please enter a sentence to correct.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate AI processing
    setTimeout(() => {
      // Mock correction logic - replace with actual AI API call
      const mockCorrections = [
        "Grammar improved",
        "Punctuation fixed", 
        "Word choice enhanced"
      ];
      
      const mockCorrectedText = inputText
        .replace(/\bi\b/g, 'I')
        .replace(/\bim\b/g, "I'm")
        .replace(/\bdont\b/g, "don't")
        .replace(/\bcant\b/g, "can't")
        .replace(/\bwont\b/g, "won't");
      
      setCorrectedText(mockCorrectedText || inputText);
      setCorrections(mockCorrections);
      setIsLoading(false);
      
      toast({
        title: "Success!",
        description: "Your sentence has been corrected.",
      });
    }, 2000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Text copied to clipboard.",
    });
  };

  const clearAll = () => {
    setInputText('');
    setCorrectedText('');
    setCorrections([]);
  };

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Correct Sentence</h2>
        <p className="text-slate-600">Enter your sentence and get instant AI-powered corrections</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wand2 className="w-5 h-5 text-blue-500" />
              <span>Original Sentence</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Type your sentence here..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="min-h-32 resize-none border-slate-200 focus:border-blue-500"
            />
            <div className="flex items-center space-x-2 mt-4">
              <Button 
                onClick={handleCorrection}
                disabled={isLoading || !inputText.trim()}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Correcting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Correct Sentence
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={clearAll}>
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Corrected Sentence</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="min-h-32 p-4 bg-green-50 border border-green-200 rounded-lg">
              {correctedText ? (
                <p className="text-slate-800 leading-relaxed">{correctedText}</p>
              ) : (
                <p className="text-slate-400 italic">Corrected sentence will appear here...</p>
              )}
            </div>
            
            {corrections.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Corrections Applied:</h4>
                <div className="flex flex-wrap gap-2">
                  {corrections.map((correction, index) => (
                    <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                      {correction}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {correctedText && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(correctedText)}
                className="mt-4"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Corrected Text
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
