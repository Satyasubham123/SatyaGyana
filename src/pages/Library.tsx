import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Library as LibraryIcon, Loader2, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import SecureBookReader from '../components/SecureBookReader'; // 🚀 IMPORT ADDED

const SUBJECTS = [
  "English", "Odia", "Hindi", "Mathematics", "Science", 
  "Social Science", "Language IT", "General Knowledge", 
  "Moral Science", "Physical Education", "Art Education"
];

const SOCIAL_SCIENCE_BRANCHES = [
  "History", "Geography", "Political Science/Civics", "Economics"
];

interface Book {
  id: string;
  title: string;
  class_level: string;
  subject: string;
  branch?: string;
  cover_url?: string;
  pdf_url: string;
}

export default function Library() {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // 🚀 STATE ADDED TO TRACK WHICH BOOK IS OPEN
  const [readingBookUrl, setReadingBookUrl] = useState<string | null>(null);

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSubject(e.target.value);
    setSelectedBranch('');
  };

  useEffect(() => {
    const fetchBooks = async () => {
      if (!selectedClass) {
        setBooks([]);
        return;
      }

      setIsLoading(true);

      try {
        let query = supabase.from('books').select('*');

        if (selectedClass === 'All') {
          query = query.eq('class_level', 'All');
        } else {
          query = query.or(`class_level.eq.${selectedClass},class_level.eq.All`);
        }

        if (selectedSubject) {
          query = query.eq('subject', selectedSubject);
        }
        
        if (selectedSubject === 'Social Science' && selectedBranch) {
          query = query.eq('branch', selectedBranch);
        }

        if (searchQuery) {
          query = query.ilike('title', `%${searchQuery}%`);
        }

        const { data, error } = await query;
        
        if (error) throw error;
        if (data) setBooks(data as Book[]);

      } catch (error) {
        console.error("Error fetching books:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchBooks();
    }, 300);

    return () => clearTimeout(timer);
  }, [selectedClass, selectedSubject, selectedBranch, searchQuery]);

  return (
    <div className="min-h-screen bg-bg-deep pt-24 px-4 pb-24 relative">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center justify-center p-4 bg-brand/10 rounded-2xl mb-2 border border-brand/20">
            <LibraryIcon className="w-8 h-8 text-brand" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black italic uppercase text-white tracking-tighter">
            Digital Library
          </h1>
          <p className="text-slate-400 font-medium max-w-2xl mx-auto text-sm md:text-base">
            Access your curriculum. Filter by class, subject, and branch to find your textbooks and study materials.
          </p>
        </div>

        {/* Filters & Search Section */}
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-[32px] shadow-2xl z-10 relative">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
            
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-2">1. Select Class</label>
              <select 
                value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-brand cursor-pointer"
              >
                <option value="">Choose Class...</option>
                {[6, 7, 8, 9, 10].map(c => <option key={c} value={String(c)}>Class {c}</option>)}
                <option value="All">All Classes (General)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-2">2. Select Subject</label>
              <select 
                value={selectedSubject} onChange={handleSubjectChange} disabled={!selectedClass}
                className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-brand cursor-pointer disabled:opacity-50"
              >
                <option value="">All Subjects...</option>
                {SUBJECTS.map(subject => <option key={subject} value={subject}>{subject}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-2">
                3. Branch {selectedSubject !== 'Social Science' && '(Optional)'}
              </label>
              <select 
                value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} disabled={selectedSubject !== 'Social Science'}
                className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-brand cursor-pointer disabled:opacity-30"
              >
                <option value="">All Branches...</option>
                {SOCIAL_SCIENCE_BRANCHES.map(branch => <option key={branch} value={branch}>{branch}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-2">Search Library</label>
              <div className="relative">
                <input 
                  type="text" placeholder="Search book title..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-4 pr-12 rounded-2xl text-white outline-none focus:border-brand"
                />
                <div className="absolute right-2 top-2 bottom-2 aspect-square bg-slate-800 rounded-xl flex items-center justify-center">
                  {isLoading ? <Loader2 className="w-4 h-4 text-brand animate-spin" /> : <Search className="w-4 h-4 text-slate-400" />}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOOKS DISPLAY AREA */}
        <div className="min-h-[400px]">
          {!selectedClass ? (
            <div className="py-20 text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mb-6 border border-slate-800">
                <BookOpen className="h-8 w-8 text-slate-500" />
              </div>
              <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-400 mb-2">Select a Class First</h3>
              <p className="text-slate-500 font-medium text-sm">Choose a class from the dropdown above to load the curriculum.</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                
                {books.length > 0 ? (
                  books.map((book) => (
                    <div key={book.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-brand/50 transition-all group shadow-lg flex flex-col">
                      <div className="aspect-[3/4] bg-slate-950 relative overflow-hidden flex-shrink-0">
                        {book.cover_url ? (
                          <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-800">
                            <BookOpen className="w-12 h-12 text-slate-600" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-md px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest text-brand border border-slate-700">
                          Class {book.class_level}
                        </div>
                      </div>
                      
                      <div className="p-4 flex flex-col flex-1">
                        <h4 className="text-white font-bold mb-1 line-clamp-2 leading-tight">{book.title}</h4>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">{book.branch || book.subject}</p>
                        
                        <div className="mt-auto">
                          {/* 🚀 CHANGED FROM <a> TAG TO BUTTON FOR SECURE READER */}
                          <button 
                            onClick={() => setReadingBookUrl(book.pdf_url)}
                            className="w-full py-3 bg-brand/10 text-brand rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-brand hover:text-white transition-all flex items-center justify-center gap-2"
                          >
                            <BookOpen className="w-3 h-3" /> Read in App
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : !isLoading && (
                  <div className="col-span-full py-20 text-center">
                    <p className="text-slate-500 font-bold uppercase tracking-widest">No books found for these filters.</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

      </div>

      {/* 🚀 SECURE BOOK READER OVERLAY */}
      {readingBookUrl && (
        <SecureBookReader 
          driveUrl={readingBookUrl} 
          onClose={() => setReadingBookUrl(null)} 
        />
      )}
      
    </div>
  );
}