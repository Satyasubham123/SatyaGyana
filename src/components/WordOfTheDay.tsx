import React, { useState, useEffect } from 'react';
import { BookA, Sparkles, Volume2, Calendar } from 'lucide-react';

interface DailyWord {
  word_english: string;
  word_odia: string;
  word_hindi: string;
  part_of_speech: string;
  explanation: string;
  mnemonic: string;
  sentence: string;
  synonyms: string[];
  antonyms: string[];
  image_url: string;
}

export default function WordOfTheDay() {
  const [word, setWord] = useState<DailyWord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWord = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || "https://gyanamitra.onrender.com";
        const res = await fetch(`${API_URL}/api/daily-word`);
        if (res.ok) {
            const data = await res.json();
            if (data) setWord(data);
        }
      } catch (err) {
        console.error("Failed to load Word of the Day", err);
      } finally {
        setLoading(false);
      }
    };
    fetchWord();
  }, []);

  const playPronunciation = () => {
    if (!word) return;
    const utterance = new SpeechSynthesisUtterance(word.word_english);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-12 shadow-2xl flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin mb-4"></div>
      </div>
    );
  }

  if (!word) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-12 shadow-2xl flex flex-col items-center justify-center min-h-[300px] text-center">
        <Calendar className="h-10 w-10 text-slate-700 mb-3" />
        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Awaiting 07:00 AM Vocabulary Sync...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-[32px] shadow-2xl overflow-hidden group">
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-brand">
          <BookA className="h-4 w-4" />
          <span className="font-black text-[10px] uppercase tracking-widest">Word of the Day</span>
        </div>
        <div className="flex gap-2">
          <span className="px-2 py-1 bg-slate-800 text-slate-400 text-[9px] font-black uppercase rounded tracking-widest">{word.word_odia}</span>
          <span className="px-2 py-1 bg-slate-800 text-slate-400 text-[9px] font-black uppercase rounded tracking-widest">{word.word_hindi}</span>
        </div>
      </div>

      <div className="relative h-48 bg-slate-950 border-b border-slate-800 overflow-hidden">
        <img src={word.image_url} alt={word.word_english} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
        <div className="absolute bottom-4 left-6 right-6 flex justify-between items-end">
          <div>
            <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white">{word.word_english}</h3>
            <p className="text-brand text-[10px] font-black uppercase tracking-widest">{word.part_of_speech}</p>
          </div>
          <button onClick={playPronunciation} className="p-3 bg-brand/20 hover:bg-brand/40 text-brand rounded-full backdrop-blur-md transition-all">
            <Volume2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-5">
        <p className="text-slate-300 text-sm font-medium leading-relaxed">{word.explanation}</p>
        
        <div className="p-4 bg-brand/5 border border-brand/20 rounded-2xl relative overflow-hidden">
          <Sparkles className="absolute -right-2 -top-2 w-12 h-12 text-brand opacity-10" />
          <p className="text-[10px] font-black uppercase text-brand tracking-widest mb-1">Mnemonic Device</p>
          <p className="text-slate-300 italic font-bold text-xs">{word.mnemonic}</p>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Example</p>
          <p className="text-slate-400 text-xs italic">"{word.sentence}"</p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
          <div>
            <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-2">Synonyms</p>
            <div className="flex flex-wrap gap-1">
              {word.synonyms?.map(s => <span key={s} className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">{s}</span>)}
            </div>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-2">Antonyms</p>
            <div className="flex flex-wrap gap-1">
              {word.antonyms?.map(s => <span key={s} className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">{s}</span>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}