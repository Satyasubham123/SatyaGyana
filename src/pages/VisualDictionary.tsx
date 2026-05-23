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
      // Connects to your FastAPI backend
// Change this to your REAL Render URL
const response = await axios.post('https://gyanamitra.onrender.com/api/dictionary/search', {        targetLanguage: 'Odia'
      });
      
      setResult(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to find word. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const playPronunciation = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9; // Slightly slower for clear educational hearing
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50/50 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="text-center space-y-4 animate-in slide-in-from-top-4 duration-500">
          <div className="inline-flex items-center justify-center p-3 bg-purple-100 rounded-2xl mb-2">
            <Sparkles className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-indigo-600 tracking-tight">
            AI Visual Dictionary
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Never forget a word again. Search for any concept, idiom, or scientific term to get AI mnemonics, visuals, and multilingual meanings.
          </p>
        </div>

        {/* Search Bar (Glassmorphism) */}
        <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto z-10">
          <div className="bg-white/70 backdrop-blur-md border border-white/40 shadow-xl rounded-2xl p-2 flex items-center gap-2 transition-all focus-within:ring-4 focus-within:ring-purple-500/20">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search a word (e.g., Photosynthesis, Gravity, Eruption)..."
              className="w-full bg-transparent border-none px-4 py-3 text-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-0"
            />
            <button
              type="submit"
              disabled={loading || !searchInput.trim()}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-xl hover:shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
            </button>
          </div>
          {error && <p className="text-red-500 mt-3 text-center font-medium">{error}</p>}
        </form>

        {/* Results Area */}
        {result && (
          <div className="animate-in fade-in zoom-in-95 duration-500 bg-white/80 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0">
              
              {/* Left Column: Visuals */}
              <div className="relative h-64 md:h-full bg-gray-100 border-r border-gray-100">
                <img 
                  src={result.image_url} 
                  alt={result.word_english} 
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                  <p className="text-white/90 text-sm font-medium tracking-wide uppercase drop-shadow-md">
                    AI Generated Visual Memory
                  </p>
                </div>
              </div>

              {/* Right Column: Content */}
              <div className="p-6 md:p-8 space-y-8">
                
                {/* Title & Pronunciation */}
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-4xl font-black text-gray-900 capitalize drop-shadow-sm">
                        {result.word_english}
                      </h2>
                      <span className="inline-block mt-2 px-3 py-1 bg-gray-100 text-gray-600 text-sm font-semibold rounded-full uppercase tracking-wider">
                        {result.part_of_speech}
                      </span>
                    </div>
                    <button 
                      onClick={() => playPronunciation(result.word_english)}
                      className="p-3 bg-purple-50 text-purple-600 rounded-full hover:bg-purple-100 hover:scale-110 transition-all shadow-sm"
                      title="Listen to pronunciation"
                    >
                      <Volume2 className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Multilingual Meanings */}
                <div className="grid grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Odia</p>
                    <p className="text-lg font-bold text-purple-700">{result.word_odia}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Hindi</p>
                    <p className="text-lg font-bold text-indigo-700">{result.word_hindi}</p>
                  </div>
                </div>

                {/* Explanation */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-5 h-5 text-blue-500" />
                    <h3 className="text-lg font-bold text-gray-800">Explanation</h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed text-lg">
                    {result.explanation}
                  </p>
                </div>

                {/* Memory Trick (Mnemonic) */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-2xl border border-amber-100 shadow-inner">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-5 h-5 text-amber-600" />
                    <h3 className="text-lg font-bold text-amber-900">Memory Trick</h3>
                  </div>
                  <p className="text-amber-800 font-medium leading-relaxed">
                    {result.mnemonic}
                  </p>
                </div>

                {/* Synonyms & Antonyms */}
                {(result.synonyms?.length > 0 || result.antonyms?.length > 0) && (
                  <div className="flex flex-wrap gap-x-8 gap-y-4 pt-4 border-t border-gray-100">
                    {result.synonyms?.length > 0 && (
                      <div>
                        <span className="text-xs font-bold text-gray-400 uppercase mr-2">Synonyms:</span>
                        <span className="text-gray-700">{result.synonyms.slice(0, 3).join(', ')}</span>
                      </div>
                    )}
                    {result.antonyms?.length > 0 && (
                      <div>
                        <span className="text-xs font-bold text-gray-400 uppercase mr-2">Antonyms:</span>
                        <span className="text-gray-700">{result.antonyms.slice(0, 3).join(', ')}</span>
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