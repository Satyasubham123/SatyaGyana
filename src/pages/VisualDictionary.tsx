import React, { useState, useEffect, useRef } from 'react';
import { Search, BookA, Sparkles, Loader2, Volume2, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Types for our Dictionary Data
interface DictionaryResult {
  word: string;
  phonetic?: string;
  meanings: {
    partOfSpeech: string;
    definitions: { definition: string; example?: string }[];
  }[];
}

export default function VisualDictionary() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [result, setResult] = useState<DictionaryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 🚀 THE SPEED SECRET: Local Cache Dictionary
  // This remembers words you've already searched so they load instantly next time
  const cache = useRef<{ [key: string]: DictionaryResult }>({});

  // 🚀 SPEED FIX 1: Debouncing
  // Wait 500ms after the user STOPS typing before searching. 
  // This prevents the app from freezing or spamming the API on every single keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm.trim().toLowerCase());
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch Definition
  useEffect(() => {
    const fetchMeaning = async () => {
      if (!debouncedTerm) {
        setResult(null);
        setError('');
        return;
      }

      // 🚀 SPEED FIX 2: Instant Cache Hit
      if (cache.current[debouncedTerm]) {
        setResult(cache.current[debouncedTerm]);
        setError('');
        return; // Load instantly, skip the API!
      }

      setIsLoading(true);
      setError('');

      try {
        // Using Free Dictionary API for blazing fast standard definitions
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${debouncedTerm}`);
        
        if (!response.ok) {
          throw new Error('Word not found in standard archives.');
        }

        const data = await response.json();
        const wordData = data[0]; // Take the first best match

        // Save to cache for next time
        cache.current[debouncedTerm] = wordData;
        
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

  const playAudio = () => {
    // Basic text-to-speech fallback
    if ('speechSynthesis' in window && result?.word) {
      const utterance = new SpeechSynthesisUtterance(result.word);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="min-h-screen bg-bg-deep pt-24 px-4 pb-24">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-brand transition-colors mb-6 font-bold uppercase tracking-widest text-[10px]">
            <ArrowLeft className="h-4 w-4" /> Return to Dashboard
          </Link>
          <h1 className="text-3xl sm:text-5xl font-black uppercase italic tracking-tighter text-white flex items-center gap-3">
             <BookA className="h-8 w-8 sm:h-10 sm:w-10 text-brand" /> Visual Dictionary
          </h1>
          <p className="text-slate-400 font-medium mt-2 text-sm sm:text-base">
             Instant semantic retrieval system.
          </p>
        </div>

        {/* 🚀 Search Bar */}
        <div className="relative mb-8 z-10">
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
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl text-center">
              <p className="text-red-400 font-bold uppercase tracking-widest text-xs">{error}</p>
            </motion.div>
          )}

          {result && !isLoading && (
            <motion.div
              key={result.word}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-slate-900 border border-slate-800 rounded-[32px] overflow-hidden shadow-2xl relative"
            >
              {/* Visual Flare */}
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
            </motion.div>
          )}

          {!result && !isLoading && !error && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center flex flex-col items-center">
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