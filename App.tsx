import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import CodeInputPanel from './components/CodeInputPanel';
import ReviewOutputPanel from './components/ReviewOutputPanel';
import HistoryPanel from './components/HistoryPanel';
import { reviewCode } from './services/geminiService';
import { getHistory, saveHistory, clearHistory, type ReviewHistoryItem } from './services/historyService';
import { PROGRAMMING_LANGUAGES } from './constants';

const App: React.FC = () => {
  const [code, setCode] = useState<string>('');
  const [language, setLanguage] = useState<string>(PROGRAMMING_LANGUAGES[0]);
  const [review, setReview] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ReviewHistoryItem[]>([]);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState<boolean>(false);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const handleReview = useCallback(async () => {
    if (!code.trim()) {
      setError("Please enter some code to review.");
      setReview('');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setReview('');

    try {
      const result = await reviewCode(code, language);
      setReview(result);
      
      const newHistoryItem: ReviewHistoryItem = { 
        id: Date.now().toString(), 
        code, 
        language, 
        review: result, 
        timestamp: Date.now() 
      };
      
      // Add new item and prevent duplicates if the same code is reviewed again
      const updatedHistory = [newHistoryItem, ...history.filter(h => h.code !== code || h.language !== language)];
      
      setHistory(updatedHistory);
      saveHistory(updatedHistory);

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [code, language, history]);

  const handleLoadReview = useCallback((item: ReviewHistoryItem) => {
    setCode(item.code);
    setLanguage(item.language);
    setReview(item.review);
    setError(null);
    setIsHistoryPanelOpen(false);
  }, []);

  const handleClearHistory = useCallback(() => {
    if (window.confirm("Are you sure you want to delete all review history? This action cannot be undone.")) {
        setHistory([]);
        clearHistory();
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-800 text-gray-200 font-sans flex flex-col">
      <Header onToggleHistory={() => setIsHistoryPanelOpen(true)} />
      
      <HistoryPanel
        isOpen={isHistoryPanelOpen}
        history={history}
        onLoadReview={handleLoadReview}
        onClearHistory={handleClearHistory}
        onClose={() => setIsHistoryPanelOpen(false)}
      />

      <main className="flex-grow container mx-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
        <CodeInputPanel 
          code={code}
          setCode={setCode}
          language={language}
          setLanguage={setLanguage}
          onReview={handleReview}
          isLoading={isLoading}
        />
        <ReviewOutputPanel 
          review={review}
          isLoading={isLoading}
          error={error}
        />
      </main>
      <footer className="text-center p-4 text-gray-500 text-xs">
        <p>Powered by Google Gemini. For educational and demonstrative purposes only.</p>
      </footer>
    </div>
  );
};

export default App;
