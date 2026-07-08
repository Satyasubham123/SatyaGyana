import React, { useState, useEffect } from 'react';
import { BookText, Loader2, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import SecureBookReader from '../components/SecureBookReader';

const CLASSES = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];
const MEDIUMS = ['English', 'Odia', 'Hindi'];
const SUBJECTS = [
  "English", "Odia", "Hindi", "Mathematics", "Science", 
  "Social Science", "Language IT", "General Knowledge", 
  "Moral Science", "Physical Education", "Art Education"
];

export default function NoteHub() {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedMedium, setSelectedMedium] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [notes, setNotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // State to hold the URL of the note currently being read
  const [readingNoteUrl, setReadingNoteUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotes = async () => {
      if (!selectedClass || !selectedMedium || !selectedSubject) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase.from('study_notes')
          .select('*')
          .eq('class_level', selectedClass)
          .eq('medium', selectedMedium)
          .eq('subject', selectedSubject)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        setNotes(data || []);
      } catch (error) {
        console.error("Error fetching notes:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNotes();
  }, [selectedClass, selectedMedium, selectedSubject]);

  return (
    <div className="min-h-screen bg-bg-deep pt-24 px-4 pb-24">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center justify-center p-4 bg-indigo-500/10 rounded-2xl mb-2 border border-indigo-500/20">
            <BookText className="w-8 h-8 text-indigo-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black italic uppercase text-white tracking-tighter">
            Smart Notes Hub
          </h1>
          <p className="text-slate-400 font-bold tracking-widest uppercase text-[10px] sm:text-xs max-w-xl mx-auto">
            Select your class, medium, and subject to unlock secure PDF study materials.
          </p>
        </div>

        {/* Filter Selection Panel */}
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-[32px] shadow-2xl relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select 
              value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white font-bold text-sm outline-none focus:border-indigo-500 appearance-none"
            >
              <option value="">1. Choose Class...</option>
              {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select 
              value={selectedMedium} onChange={(e) => setSelectedMedium(e.target.value)} disabled={!selectedClass}
              className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white font-bold text-sm outline-none focus:border-indigo-500 disabled:opacity-50 appearance-none"
            >
              <option value="">2. Choose Medium...</option>
              {MEDIUMS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>

            <select 
              value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} disabled={!selectedMedium}
              className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white font-bold text-sm outline-none focus:border-indigo-500 disabled:opacity-50 appearance-none"
            >
              <option value="">3. Choose Subject...</option>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Notes Display Area */}
        <div className="min-h-[400px]">
          {isLoading ? (
             <div className="py-32 flex flex-col items-center justify-center gap-4">
               <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
               <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Fetching Secure Notes...</p>
             </div>
          ) : notes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {notes.map(note => (
                <div 
                  key={note.id} 
                  onClick={() => setReadingNoteUrl(note.drive_url)}
                  className="bg-slate-900 border border-slate-800 p-6 rounded-[24px] overflow-hidden shadow-lg hover:border-indigo-500/50 hover:shadow-indigo-500/10 transition-all cursor-pointer group flex flex-col"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white transition-all shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-white font-black text-lg leading-tight group-hover:text-indigo-400 transition-colors line-clamp-2">{note.title}</h4>
                      <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mt-1">Secured PDF Module</p>
                    </div>
                  </div>
                  
                  {/* Updated Hierarchy Display */}
                  <div className="mt-auto pt-4 border-t border-slate-800 mb-4">
                    <div className="grid grid-cols-1 gap-1 text-[9px] font-black uppercase tracking-widest text-slate-500">
                       <p><span className="text-indigo-500">CH:</span> {note.chapter || 'N/A'}</p>
                       <p><span className="text-indigo-500">PT:</span> {note.part || 'N/A'}</p>
                       <p className="text-indigo-400 truncate">TP: {note.topic || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-slate-800 flex items-center justify-end">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover:text-white transition-colors">
                      Tap to Read →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            selectedSubject && (
              <div className="text-center py-32 bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-[32px]">
                <FileText className="w-12 h-12 text-slate-700 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-600">No Notes Found</h3>
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
                 Select filters above to load the secure study notes.
               </p>
             </div>
          )}
        </div>
      </div>

      {/* SECURE PDF READER POPUP */}
      {readingNoteUrl && (
        <SecureBookReader 
          driveUrl={readingNoteUrl} 
          onClose={() => setReadingNoteUrl(null)} 
        />
      )}
    </div>
  );
}