import React, { useState, useEffect } from 'react';
import { BrainCircuit, Loader2, PlayCircle, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

const CLASSES = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];
const MEDIUMS = ['English', 'Odia', 'Hindi'];
const SUBJECTS = [
  "English", "Odia", "Hindi", "Mathematics", "Science", 
  "Social Science", "Language IT", "General Knowledge"
];

export default function TestHub() {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedMedium, setSelectedMedium] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [tests, setTests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchTests = async () => {
      if (!selectedClass || !selectedMedium || !selectedSubject) return;
      setIsLoading(true);
      try {
        const { data, error } = await supabase.from('active_quizzes')
          .select('*')
          .eq('class_level', selectedClass)
          .eq('medium', selectedMedium)
          .eq('subject', selectedSubject)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        setTests(data || []);
      } catch (error) {
        console.error("Error fetching tests:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTests();
  }, [selectedClass, selectedMedium, selectedSubject]);

  const filteredTests = tests.filter(test => 
    searchQuery === '' || 
    test.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    test.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-bg-deep pt-24 px-4 pb-24">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center justify-center p-4 bg-emerald-500/10 rounded-2xl mb-2 border border-emerald-500/20">
            <BrainCircuit className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black italic uppercase text-white tracking-tighter">
            Testing Arena
          </h1>
          <p className="text-slate-400 font-bold tracking-widest uppercase text-[10px] sm:text-xs max-w-xl mx-auto">
            Select your curriculum to access time-bound adaptive assessments.
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-[32px] shadow-2xl relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <select 
              value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white font-bold text-sm outline-none focus:border-emerald-500 appearance-none"
            >
              <option value="">1. Choose Class...</option>
              {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select 
              value={selectedMedium} onChange={(e) => setSelectedMedium(e.target.value)} disabled={!selectedClass}
              className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white font-bold text-sm outline-none focus:border-emerald-500 disabled:opacity-50 appearance-none"
            >
              <option value="">2. Choose Medium...</option>
              {MEDIUMS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select 
              value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} disabled={!selectedMedium}
              className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white font-bold text-sm outline-none focus:border-emerald-500 disabled:opacity-50 appearance-none"
            >
              <option value="">3. Choose Subject...</option>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-500" />
            </div>
            <input 
              type="text" placeholder="Search for a specific Topic or Chapter..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 p-4 pl-12 rounded-2xl text-white font-bold outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="min-h-[400px]">
          {isLoading ? (
             <div className="py-32 flex flex-col items-center justify-center gap-4">
               <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
             </div>
          ) : filteredTests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTests.map(test => (
                <div key={test.id} className="bg-slate-900 border border-slate-800 p-6 rounded-[24px] shadow-lg hover:border-emerald-500/50 transition-all flex flex-col group">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-black text-[9px] uppercase tracking-widest">
                      {test.time_limit_minutes} Mins
                    </span>
                    <span className="px-2 py-1 bg-slate-800 text-slate-400 border border-slate-700 rounded font-black text-[9px] uppercase tracking-widest">
                      {test.questions.length} Qs
                    </span>
                  </div>
                  <h4 className="text-white font-black text-xl leading-tight mb-2 group-hover:text-emerald-400 transition-colors">{test.title}</h4>
                  <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mb-6 truncate">{test.topic}</p>
                  
                  <Link to={`/exam/${test.id}`} className="mt-auto w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all">
                    <PlayCircle className="w-4 h-4" /> Start Exam
                  </Link>
                </div>
              ))}
            </div>
          ) : (
             <div className="text-center py-32 bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-[32px]">
               <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-600">No Assessments Available</h3>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}