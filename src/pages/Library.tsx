// src/pages/Library.tsx
import React, { useState } from 'react';
import { Search, BookOpen, ChevronRight, Library as LibraryIcon, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const SUBJECTS = [
  "English", "Odia", "Hindi", "Mathematics", "Science", 
  "Social Science", "Language IT", "General Knowledge", 
  "Moral Science", "Physical Education", "Art Education"
];

const SOCIAL_SCIENCE_BRANCHES = [
  "History", "Geography", "Political Science/Civics", "Economics"
];

export default function Library() {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Reset branch if subject changes away from Social Science
  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSubject(e.target.value);
    setSelectedBranch('');
  };

  return (
    <div className="min-h-screen bg-bg-deep pt-24 px-4 pb-24">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center justify-center p-4 bg-brand/10 rounded-2xl mb-2 border border-brand/20">
            <LibraryIcon className="w-8 h-8 text-brand" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black italic uppercase text-white tracking-tighter">
            Digital Library
          </h1>
          <p className="text-slate-400 font-medium max-w-2xl mx-auto">
            Access your curriculum. Filter by class, subject, and branch to find your textbooks and study materials.
          </p>
        </div>

        {/* Filters & Search Section */}
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-[32px] shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            
            {/* 1. Class Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-2">1. Select Class</label>
              <select 
                value={selectedClass} 
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-brand cursor-pointer"
              >
                <option value="">Choose Class...</option>
                {[6, 7, 8, 9, 10].map(c => (
                  <option key={c} value={c}>Class {c}</option>
                ))}
              </select>
            </div>

            {/* 2. Subject Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-2">2. Select Subject</label>
              <select 
                value={selectedSubject} 
                onChange={handleSubjectChange}
                disabled={!selectedClass}
                className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-brand cursor-pointer disabled:opacity-50"
              >
                <option value="">Choose Subject...</option>
                {SUBJECTS.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            {/* 3. Branch Selector (Only shows if Social Science is selected) */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-2">
                3. Branch {selectedSubject !== 'Social Science' && '(Optional)'}
              </label>
              <select 
                value={selectedBranch} 
                onChange={(e) => setSelectedBranch(e.target.value)}
                disabled={selectedSubject !== 'Social Science'}
                className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-brand cursor-pointer disabled:opacity-30"
              >
                <option value="">Choose Branch...</option>
                {SOCIAL_SCIENCE_BRANCHES.map(branch => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
            </div>

            {/* 4. Search Bar */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-2">Search Library</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search book title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-4 pr-12 rounded-2xl text-white outline-none focus:border-brand"
                />
                <button className="absolute right-2 top-2 bottom-2 aspect-square bg-brand rounded-xl flex items-center justify-center hover:bg-blue-600 transition-colors">
                  <Search className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Books Display Area (Placeholder until Database is connected) */}
        <div className="py-20 text-center flex flex-col items-center bg-slate-900/30 border border-slate-800/50 rounded-[32px]">
          <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mb-6 shadow-xl border border-slate-800">
            <BookOpen className="h-8 w-8 text-brand opacity-50" />
          </div>
          <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-300 mb-2">
            {selectedClass && selectedSubject 
              ? `Loading ${selectedBranch || selectedSubject} books for Class ${selectedClass}...` 
              : "Select filters to browse books"}
          </h3>
          <p className="text-slate-500 font-medium text-sm">
            Database connection pending. Books will appear here shortly.
          </p>
        </div>

      </div>
    </div>
  );
}