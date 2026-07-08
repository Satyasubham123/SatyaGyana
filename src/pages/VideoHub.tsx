import React, { useState, useEffect } from 'react';
import { Video, Loader2, PlayCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

const CLASSES = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];
const MEDIUMS = ['English', 'Odia', 'Hindi'];
const SUBJECTS = [
  "English", "Odia", "Hindi", "Mathematics", "Science", 
  "Social Science", "Language IT", "General Knowledge", 
  "Moral Science", "Physical Education", "Art Education"
];

// Automatically converts normal YouTube or Shorts links into iFrame embed links
const getEmbedUrl = (url: string) => {
  if (url.includes('/shorts/')) return url.replace('/shorts/', '/embed/');
  if (url.includes('watch?v=')) return url.replace('watch?v=', 'embed/').split('&')[0];
  if (url.includes('youtu.be/')) return url.replace('youtu.be/', 'youtube.com/embed/');
  return url;
};

export default function VideoHub() {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedMedium, setSelectedMedium] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [videos, setVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchVideos = async () => {
      if (!selectedClass || !selectedMedium || !selectedSubject) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase.from('video_lessons')
          .select('*')
          .eq('class_level', selectedClass)
          .eq('medium', selectedMedium)
          .eq('subject', selectedSubject)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        setVideos(data || []);
      } catch (error) {
        console.error("Error fetching videos:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchVideos();
  }, [selectedClass, selectedMedium, selectedSubject]);

  return (
    <div className="min-h-screen bg-bg-deep pt-24 px-4 pb-24">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center justify-center p-4 bg-red-500/10 rounded-2xl mb-2 border border-red-500/20">
            <Video className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black italic uppercase text-white tracking-tighter">
            Smart Video Hub
          </h1>
          <p className="text-slate-400 font-bold tracking-widest uppercase text-[10px] sm:text-xs max-w-xl mx-auto">
            Select your class, medium, and subject to unlock your personalized video study materials.
          </p>
        </div>

        {/* Filter Selection Panel */}
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-[32px] shadow-2xl relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select 
              value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white font-bold text-sm outline-none focus:border-red-500 appearance-none"
            >
              <option value="">1. Choose Class...</option>
              {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select 
              value={selectedMedium} onChange={(e) => setSelectedMedium(e.target.value)} disabled={!selectedClass}
              className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white font-bold text-sm outline-none focus:border-red-500 disabled:opacity-50 appearance-none"
            >
              <option value="">2. Choose Medium...</option>
              {MEDIUMS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>

            <select 
              value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} disabled={!selectedMedium}
              className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white font-bold text-sm outline-none focus:border-red-500 disabled:opacity-50 appearance-none"
            >
              <option value="">3. Choose Subject...</option>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Video Display Area */}
        <div className="min-h-[400px]">
          {isLoading ? (
             <div className="py-32 flex flex-col items-center justify-center gap-4">
               <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
               <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Fetching Assets...</p>
             </div>
          ) : videos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map(v => (
                <div key={v.id} className="bg-slate-900 border border-slate-800 rounded-[24px] overflow-hidden shadow-lg hover:border-red-500/30 transition-colors group flex flex-col">
                  {/* YouTube iFrame container */}
                  <div className="aspect-video w-full bg-black relative">
                    <iframe 
                      width="100%" height="100%" 
                      src={getEmbedUrl(v.video_url)} 
                      title={v.title} 
                      frameBorder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                      className="absolute inset-0"
                    />
                  </div>
                  
                  {/* Video Metadata */}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="space-y-1 mb-4">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                        <span className="text-red-500">CH:</span> {v.chapter || 'N/A'}
                      </p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                        <span className="text-red-500">PT:</span> {v.part || 'N/A'}
                      </p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-red-400">
                        <span className="text-red-500">TP:</span> {v.topic || 'N/A'}
                      </p>
                    </div>

                    <h4 className="text-white font-black text-lg leading-tight mb-2 group-hover:text-red-400 transition-colors">{v.title}</h4>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-auto pt-4 flex items-center gap-1">
                      <PlayCircle className="w-3 h-3" /> Video Lesson
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            selectedSubject && (
              <div className="text-center py-32 bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-[32px]">
                <Video className="w-12 h-12 text-slate-700 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-600">No Videos Found</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-2">
                  Check back later or try a different subject.
                </p>
              </div>
            )
          )}
          
          {!selectedClass && !selectedMedium && !selectedSubject && (
             <div className="text-center py-32 bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-[32px]">
               <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-600">Awaiting Input</h3>
               <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-2">
                 Select filters above to load the video hub.
               </p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}