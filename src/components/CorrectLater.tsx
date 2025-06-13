
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Plus, Trash2, CheckCircle, Calendar } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SavedSentence {
  id: string;
  text: string;
  savedAt: string;
  status: 'pending' | 'corrected';
  correctedText?: string;
}

export const CorrectLater = () => {
  const [inputText, setInputText] = useState('');
  const [savedSentences, setSavedSentences] = useState<SavedSentence[]>([
    {
      id: '1',
      text: 'This is an example sentence that needs correction later.',
      savedAt: '2024-01-15 10:30 AM',
      status: 'pending'
    },
    {
      id: '2',
      text: 'Another sentence i want to check tommorrow.',
      savedAt: '2024-01-14 3:45 PM',
      status: 'pending'
    }
  ]);

  const saveSentence = () => {
    if (!inputText.trim()) {
      toast({
        title: "Error",
        description: "Please enter a sentence to save.",
        variant: "destructive"
      });
      return;
    }

    const newSentence: SavedSentence = {
      id: Date.now().toString(),
      text: inputText,
      savedAt: new Date().toLocaleString(),
      status: 'pending'
    };

    setSavedSentences([newSentence, ...savedSentences]);
    setInputText('');
    
    toast({
      title: "Saved!",
      description: "Sentence saved for later correction.",
    });
  };

  const deleteSentence = (id: string) => {
    setSavedSentences(savedSentences.filter(sentence => sentence.id !== id));
    toast({
      title: "Deleted",
      description: "Sentence removed from queue.",
    });
  };

  const correctSentence = (id: string) => {
    setSavedSentences(savedSentences.map(sentence => 
      sentence.id === id 
        ? { 
            ...sentence, 
            status: 'corrected' as const,
            correctedText: sentence.text.replace(/\bi\b/g, 'I').replace(/tommorrow/g, 'tomorrow')
          }
        : sentence
    ));
    
    toast({
      title: "Corrected!",
      description: "Sentence has been corrected.",
    });
  };

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Correct Later</h2>
        <p className="text-slate-600">Save sentences to correct when you have more time</p>
      </div>

      <Card className="mb-6 border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="w-5 h-5 text-blue-500" />
            <span>Add New Sentence</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Enter a sentence to save for later correction..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="min-h-24 resize-none border-slate-200 focus:border-blue-500"
          />
          <Button 
            onClick={saveSentence}
            className="mt-4 bg-blue-500 hover:bg-blue-600"
          >
            <Clock className="w-4 h-4 mr-2" />
            Save for Later
          </Button>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-slate-600" />
              <span>Saved Sentences</span>
            </div>
            <Badge variant="secondary">
              {savedSentences.length} items
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {savedSentences.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No sentences saved yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {savedSentences.map((sentence) => (
                <div 
                  key={sentence.id}
                  className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <Badge 
                      variant={sentence.status === 'corrected' ? 'default' : 'secondary'}
                      className={sentence.status === 'corrected' ? 'bg-green-500' : ''}
                    >
                      {sentence.status === 'corrected' ? 'Corrected' : 'Pending'}
                    </Badge>
                    <span className="text-sm text-slate-500">{sentence.savedAt}</span>
                  </div>
                  
                  <p className="text-slate-800 mb-2">{sentence.text}</p>
                  
                  {sentence.correctedText && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                      <p className="text-sm font-medium text-green-800 mb-1">Corrected:</p>
                      <p className="text-green-700">{sentence.correctedText}</p>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2 mt-3">
                    {sentence.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => correctSentence(sentence.id)}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Correct Now
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteSentence(sentence.id)}
                      className="text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
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
