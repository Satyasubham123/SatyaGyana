import React, { useState } from 'react';
import { imageService } from '../services/imageService';
import { MapPin, FlaskConical, Palette, BookOpenText, Loader2, Download, Image as ImageIcon } from 'lucide-react';

const SUBJECTS = [
  { id: 'map', name: 'Geography', icon: MapPin },
  { id: 'science diagram', name: 'Science', icon: FlaskConical },
  { id: 'historical artifact', name: 'History', icon: BookOpenText },
  { id: 'artistic concept', name: 'Art', icon: Palette }
];

export const AIVisualizer: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [subject, setSubject] = useState(SUBJECTS[1].id);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsLoading(true);
    setImageUrl(null);
    
    try {
      const url = await imageService.generateImage(prompt, subject);
      setImageUrl(url);
    } catch (error) {
      alert("Oops! The AI failed to draw that. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto min-h-screen pt-24 text-slate-100">
      {/* Header */}
      <div className="mb-10 pb-6 border-b border-slate-800">
        <h1 className="text-3xl sm:text-5xl font-black uppercase italic tracking-tighter text-white flex items-center gap-4">
          <div className="w-12 h-12 bg-brand rounded-2xl flex items-center justify-center shadow-lg shadow-brand/20">
             <ImageIcon className="text-white w-6 h-6" />
          </div>
          AI Study Visuals
        </h1>
        <p className="text-slate-400 font-medium mt-3 text-sm sm:text-base uppercase tracking-widest">
          Generate custom maps, diagrams, and historical art instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Controls */}
        <div className="space-y-6 lg:col-span-1">
          
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl shadow-xl backdrop-blur-sm">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
               <span className="w-5 h-5 rounded-full bg-brand/20 text-brand flex items-center justify-center text-[10px]">1</span>
               Choose Subject
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {SUBJECTS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSubject(s.id)}
                  className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-3 text-xs font-black uppercase tracking-wider ${
                    subject === s.id 
                    ? 'bg-brand/10 border-brand text-brand shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
                    : 'bg-slate-800/50 border-slate-700 hover:border-slate-500 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <s.icon className={`w-6 h-6 ${subject === s.id ? 'text-brand' : 'text-slate-500'}`} />
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl shadow-xl backdrop-blur-sm">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
               <span className="w-5 h-5 rounded-full bg-brand/20 text-brand flex items-center justify-center text-[10px]">2</span>
               Describe It
            </h2>
            
            {/* 🚀 THE FIXED TEXTAREA: White Box, Black Text, Visible Placeholder! */}
            <textarea
              className="w-full h-32 p-4 rounded-xl border border-gray-300 bg-white text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand resize-none transition-all"
              placeholder="e.g., A highly detailed cross-section of a plant cell..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            
            <button
              onClick={handleGenerate}
              disabled={isLoading || !prompt}
              className="w-full mt-6 bg-brand text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-3"
            >
              {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <FlaskConical className="w-4 h-4" />}
              {isLoading ? 'Processing Neural Image...' : 'Generate Visual'}
            </button>
          </div>
        </div>

        {/* Right Side: Image Display */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-3xl shadow-xl p-8 flex flex-col items-center justify-center min-h-[500px] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full blur-3xl pointer-events-none -mr-32 -mt-32"></div>

          {isLoading ? (
            <div className="text-center text-slate-400 relative z-10">
              <div className="relative w-20 h-20 mx-auto mb-6">
                 <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
                 <div className="absolute inset-0 border-4 border-brand rounded-full border-t-transparent animate-spin"></div>
                 <ImageIcon className="absolute inset-0 m-auto w-6 h-6 text-brand animate-pulse" />
              </div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-300">Synthesizing Visual Data...</p>
              <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-widest">Estimated time: 10 seconds</p>
            </div>
          ) : imageUrl ? (
            <div className="w-full flex flex-col items-center relative z-10 animate-in fade-in zoom-in duration-500">
              <img 
                src={imageUrl} 
                alt="Generated Study Visual" 
                className="rounded-2xl shadow-[0_0_40px_rgba(59,130,246,0.15)] max-h-[600px] w-auto object-contain border border-slate-700 bg-slate-950" 
              />
              <a 
                href={imageUrl} 
                download="gyanmitra-visual.png" 
                className="mt-8 flex items-center gap-3 text-brand font-black uppercase tracking-widest text-xs hover:text-white bg-brand/10 hover:bg-brand border border-brand/30 px-6 py-3 rounded-xl transition-all shadow-lg active:scale-95"
              >
                <Download className="w-4 h-4" /> Download Node Data
              </a>
            </div>
          ) : (
            <div className="text-center text-slate-500 relative z-10">
              <div className="w-24 h-24 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-700/50 shadow-inner">
                 <ImageIcon className="w-10 h-10 opacity-40 text-slate-400" />
              </div>
              <p className="text-xs font-black uppercase tracking-widest">Awaiting prompt parameters</p>
              <p className="text-[10px] mt-2 font-bold tracking-wider opacity-60">Visuals will render in this terminal</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};