import React, { useState } from 'react';
import { Search, Volume2, Brain, BookOpen, Loader2, Sparkles } from 'lucide-react';
import axios from 'axios';

interface DictionaryResult {
  word_english: string;
  word_odia: string;
  word_hindi: string;
  part_of_speech: string;
  explanation: string;
  mnemonic: string;
  image_url: string;
  synonyms: string[];
  antonyms: string[];
}

export default function VisualDictionary() {
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DictionaryResult | null>(null);
  const [error, setError] = useState('');

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchInput.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      // 🚀 NEW: Pointing to your custom local Python backend!
      const response = await axios.post('http://localhost:8000/api/dictionary/search', 
        {
          word: searchInput.trim(),
          targetLanguage: 'Odia'
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      setResult(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to find word. Is your Python server running?');
    } finally {
      setLoading(false);
    }
  };

  const playPronunciation = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-transparent p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="text-center space-y-4 animate-in slide-in-from-top-4 duration-500">
          <div className="inline-flex items-center justify-center p-4 bg-brand/10 rounded-2xl mb-2 border border-brand/20 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
            <Sparkles className="w-8 h-8 text-brand" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black italic uppercase text-white tracking-tighter drop-shadow-sm">
            AI Visual Dictionary
          </h1>
          
          <p className="text-slate-300 text-sm md:text-base font-medium max-w-2xl mx-auto leading-relaxed">
            Never forget a word again. Search for any concept, idiom, or scientific term to get AI mnemonics, visuals, and multilingual meanings.
          </p>
        </div>

        {/* Search Bar (Dark Glassmorphism) */}
        <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto z-10">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700 shadow-2xl rounded-2xl p-2 flex items-center gap-2 transition-all focus-within:border-brand/50 focus-within:shadow-[0_0_30px_rgba(59,130,246,0.1)]">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search a word (e.g., Photosynthesis, Gravity)..."
              className="w-full bg-transparent border-none px-4 py-3 text-lg text-white placeholder-slate-500 focus:outline-none focus:ring-0"
            />
            <button
              type="submit"
              disabled={loading || !searchInput.trim()}
              className="bg-brand text-white p-4 rounded-xl hover:bg-blue-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 shadow-lg shadow-brand/20"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
            </button>
          </div>
          {error && <p className="text-red-400 mt-4 text-center font-bold text-sm tracking-wide">{error}</p>}
        </form>

        {/* Results Area */}
        {result && (
          <div className="animate-in fade-in zoom-in-95 duration-500 bg-slate-900 border border-slate-800 shadow-2xl rounded-3xl overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0">
              
              {/* Left Column: Visuals */}
              <div className="relative h-64 md:h-full bg-slate-950 border-r border-slate-800">
                <img 
                  src={result.image_url} 
                  alt={result.word_english} 
                  className="absolute inset-0 w-full h-full object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent flex items-end p-6">
                  <p className="text-white text-xs font-black tracking-widest uppercase drop-shadow-md">
                    AI Visual Memory
                  </p>
                </div>
              </div>

              {/* Right Column: Content */}
              <div className="p-6 md:p-8 space-y-8 bg-slate-900">
                
                {/* Title & Pronunciation */}
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-3xl md:text-4xl font-black italic uppercase text-white tracking-tighter">
                        {result.word_english}
                      </h2>
                      <span className="inline-block mt-2 px-3 py-1 bg-slate-800 border border-slate-700 text-brand text-[10px] font-black rounded-full uppercase tracking-[0.2em]">
                        {result.part_of_speech}
                      </span>
                    </div>
                    <button 
                      onClick={() => playPronunciation(result.word_english)}
                      className="p-3 bg-slate-800 text-brand border border-slate-700 rounded-xl hover:bg-slate-700 hover:scale-105 transition-all shadow-sm"
                      title="Listen to pronunciation"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Multilingual Meanings */}
                <div className="grid grid-cols-2 gap-4 bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-inner">
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Odia</p>
                    <p className="text-lg font-bold text-white">{result.word_odia}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Hindi</p>
                    <p className="text-lg font-bold text-white">{result.word_hindi}</p>
                  </div>
                </div>

                {/* Explanation */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-5 h-5 text-brand" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-300">Explanation</h3>
                  </div>
                  <p className="text-slate-400 font-medium leading-relaxed">
                    {result.explanation}
                  </p>
                </div>

                {/* Memory Trick (Mnemonic) */}
                <div className="bg-brand/5 p-6 rounded-2xl border border-brand/20 shadow-inner relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-brand/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                  <div className="flex items-center gap-2 mb-3 relative z-10">
                    <Brain className="w-5 h-5 text-brand" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-brand">Memory Trick</h3>
                  </div>
                  <p className="text-slate-300 font-medium leading-relaxed relative z-10 italic">
                    "{result.mnemonic}"
                  </p>
                </div>

                {/* Synonyms & Antonyms */}
                {(result.synonyms?.length > 0 || result.antonyms?.length > 0) && (
                  <div className="flex flex-wrap gap-x-8 gap-y-4 pt-6 border-t border-slate-800">
                    {result.synonyms?.length > 0 && (
                      <div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2">Synonyms:</span>
                        <span className="text-slate-300 font-medium">{result.synonyms.slice(0, 3).join(', ')}</span>
                      </div>
                    )}
                    {result.antonyms?.length > 0 && (
                      <div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2">Antonyms:</span>
                        <span className="text-slate-300 font-medium">{result.antonyms.slice(0, 3).join(', ')}</span>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}