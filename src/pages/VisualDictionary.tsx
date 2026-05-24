import React, { useState, useEffect, useRef } from 'react';
import { Search, BookA, Sparkles, Loader2, Volume2, Image as ImageIcon, ArrowLeft, Languages } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Use your existing AI service
import { aiService } from '../services/aiService';

// Types for our Dictionary Data
interface DictionaryResult {
  word: string;
  phonetic?: string;
  meanings: {
    partOfSpeech: string;
    definitions: { definition: string; example?: string }[];
  }[];
}

interface AIData {
  odiaMeaning: string;
  hindiMeaning: string;
  visualPrompt: string; // Used to tell an image generator what to draw
  imageUrl?: string; // We'll simulate this or you can connect an image API later
}

export default function VisualDictionary() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  
  const [result, setResult] = useState<DictionaryResult | null>(null);
  const [aiData, setAiData] = useState<AIData | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 🚀 SPEED SECRET: Local Cache
  const cache = useRef<{ [key: string]: { result: DictionaryResult, aiData: AIData | null } }>({});

  // 🚀 DEBOUNCING
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm.trim().toLowerCase());
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch Fast Standard Definition
  useEffect(() => {
    const fetchMeaning = async () => {
      if (!debouncedTerm) {
        setResult(null);
        setAiData(null);
        setError('');
        return;
      }

      // Instant Cache Hit
      if (cache.current[debouncedTerm]) {
        setResult(cache.current[debouncedTerm].result);
        setAiData(cache.current[debouncedTerm].aiData);
        setError('');
        return;
      }

      setIsLoading(true);
      setError('');
      setAiData(null); // Reset AI data on new word

      try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${debouncedTerm}`);
        
        if (!response.ok) {
          throw new Error('Word not found in standard archives.');
        }

        const data = await response.json();
        const wordData = data[0]; 

        // Save to cache
        cache.current[debouncedTerm] = { result: wordData, aiData: null };
        setResult(wordData);
      } catch (err) {
        setError("Definition not found. Try checking the spelling.");
        setResult(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMeaning();
  }, [debouncedTerm]);

  // 🚀 FETCH AI DATA (Translations & Visuals)
  const fetchAIData = async () => {
    if (!result || !debouncedTerm) return;

    setIsAiLoading(true);

    try {
      const prompt = `Provide the Odia and Hindi translations for the English word "${debouncedTerm}". Also provide a short, descriptive prompt (max 15 words) that could be used to generate a simple, educational image representing this word.
      
      Return ONLY a raw JSON object with this exact structure. Do not wrap in markdown:
      {
        "odiaMeaning": "Odia word here",
        "hindiMeaning": "Hindi word here",
        "visualPrompt": "A simple illustration of..."
      }`;

      // Call your existing AI service!
      const aiResponseText = await aiService.sendMessage([], prompt);
      const parsedAiData = JSON.parse(aiResponseText) as AIData;

      // Update State & Cache
      setAiData(parsedAiData);
      if (cache.current[debouncedTerm]) {
        cache.current[debouncedTerm].aiData = parsedAiData;
      }

    } catch (err) {
      console.error("AI Fetch Failed:", err);
      // Optional: Show a subtle toast error here
    } finally {
      setIsAiLoading(false);
    }
  };

  const playAudio = () => {
    if ('speechSynthesis' in window && result?.word) {
      const utterance = new SpeechSynthesisUtterance(result.word);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="min-h-screen bg-bg-deep pt-24 px-4 pb-24">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-brand transition-colors mb-6 font-bold uppercase tracking-widest text-[10px]">
            <ArrowLeft className="h-4 w-4" /> Return to Dashboard
          </Link>
          <h1 className="text-3xl sm:text-5xl font-black uppercase italic tracking-tighter text-white flex items-center gap-3">
             <BookA className="h-8 w-8 sm:h-10 sm:w-10 text-brand" /> Visual Dictionary
          </h1>
          <p className="text-slate-400 font-medium mt-2 text-sm sm:text-base">
             Instant semantic retrieval & AI translation system.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8 z-10 max-w-3xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            {isLoading ? (
              <Loader2 className="h-5 w-5 text-brand animate-spin" />
            ) : (
              <Search className="h-5 w-5 text-slate-500" />
            )}
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for a concept or word..."
            className="w-full bg-slate-900/80 border-2 border-slate-800 focus:border-brand pl-12 pr-4 py-5 rounded-2xl text-white font-bold text-lg outline-none transition-all shadow-xl"
            autoFocus
          />
        </div>

        {/* Results Area */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl text-center max-w-3xl">
              <p className="text-red-400 font-bold uppercase tracking-widest text-xs">{error}</p>
            </motion.div>
          )}

          {result && !isLoading && (
            <motion.div
              key={result.word}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              
              {/* Left Column: Fast English Definition */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-[32px] overflow-hidden shadow-2xl relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                <div className="p-8 sm:p-10 relative z-10">
                  <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-800/80 pb-6 mb-8">
                    <div>
                      <h2 className="text-4xl sm:text-6xl font-black italic tracking-tighter text-white capitalize">
                        {result.word}
                      </h2>
                      {result.phonetic && (
                        <p className="text-brand font-bold tracking-widest mt-2">{result.phonetic}</p>
                      )}
                    </div>
                    <button onClick={playAudio} className="p-4 bg-brand/10 text-brand rounded-2xl hover:bg-brand hover:text-white transition-all shadow-lg active:scale-95">
                      <Volume2 className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="space-y-10">
                    {result.meanings.map((meaning, index) => (
                      <div key={index} className="space-y-4">
                        <div className="inline-block px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-widest italic border border-slate-700">
                          {meaning.partOfSpeech}
                        </div>
                        
                        <ul className="space-y-6">
                          {meaning.definitions.slice(0, 3).map((def, idx) => (
                            <li key={idx} className="pl-4 border-l-2 border-brand/50">
                              <p className="text-white text-base sm:text-lg font-medium leading-relaxed">
                                {def.definition}
                              </p>
                              {def.example && (
                                <p className="mt-2 text-slate-400 text-sm italic">
                                  "{def.example}"
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: AI Visuals & Translation */}
              <div className="lg:col-span-1 space-y-6">
                
                {!aiData ? (
                  // Trigger AI Generation
                  <button 
                    onClick={fetchAIData} 
                    disabled={isAiLoading}
                    className="w-full bg-slate-900 border border-brand/30 hover:border-brand p-8 rounded-[32px] text-center transition-all group flex flex-col items-center justify-center gap-4 min-h-[250px]"
                  >
                    {isAiLoading ? (
                      <>
                        <Loader2 className="h-10 w-10 text-brand animate-spin mb-2" />
                        <span className="text-xs font-black uppercase tracking-widest text-brand">Consulting Neural Net...</span>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Sparkles className="h-8 w-8 text-brand" />
                        </div>
                        <h3 className="text-lg font-black uppercase italic tracking-tighter text-white">Deep AI Scan</h3>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Generate Hindi/Odia Translations & Visual Concept</p>
                      </>
                    )}
                  </button>
                ) : (
                  // Display AI Results
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                    
                    {/* Translations */}
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
                      <div className="flex items-center gap-2 mb-4 text-emerald-500">
                        <Languages className="h-5 w-5" />
                        <h3 className="text-xs font-black uppercase tracking-widest">Regional Translation</h3>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Hindi (हिंदी)</p>
                          <p className="text-2xl font-black text-white">{aiData.hindiMeaning}</p>
                        </div>
                        <div className="border-t border-slate-800 pt-4">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Odia (ଓଡ଼ିଆ)</p>
                          <p className="text-2xl font-black text-white">{aiData.odiaMeaning}</p>
                        </div>
                      </div>
                    </div>

                    {/* Visual Concept */}
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
                      <div className="flex items-center gap-2 mb-4 text-purple-500">
                        <ImageIcon className="h-5 w-5" />
                        <h3 className="text-xs font-black uppercase tracking-widest">Visual Concept</h3>
                      </div>
                      
                      {aiData.imageUrl ? (
                        <img src={aiData.imageUrl} alt="Visual Concept" className="w-full h-40 object-cover rounded-xl border border-slate-800" />
                      ) : (
                        <div className="w-full h-40 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center p-4 text-center">
                           <p className="text-xs font-medium text-slate-500 italic">"{aiData.visualPrompt}"</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
                
              </div>
            </motion.div>
          )}

          {!result && !isLoading && !error && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center flex flex-col items-center max-w-3xl">
                <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mb-6 shadow-xl border border-slate-800/50">
                  <Sparkles className="h-8 w-8 text-brand opacity-50" />
                </div>
                <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-300 mb-2">Awaiting Input</h3>
                <p className="text-slate-500 font-medium text-sm">Type a word above to instantly retrieve its semantic data.</p>
             </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}