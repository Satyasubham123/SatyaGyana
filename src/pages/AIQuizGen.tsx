import React, { useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BrainCircuit, 
  Sparkles, 
  ChevronRight, 
  Zap, 
  CheckCircle2, 
  XCircle, 
  Trophy, 
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { updateUserProfile, UserProfile } from '../services/userService';
import { cn } from '../lib/utils';

declare global {
  interface ImportMeta {
    readonly env: {
      readonly VITE_GEMINI_API_KEY?: string;
    };
  }
}

interface AIQuizGenProps {
  user: FirebaseUser;
  profile: UserProfile | null;
}

interface Question {
  type: 'mcq' | 'true_false' | 'short_answer';
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export default function AIQuizGen({ user, profile }: AIQuizGenProps) {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [format, setFormat] = useState<'mcq' | 'true_false'>('mcq');
  
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const handleGenerateQuiz = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    setQuestions(null);
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setScore(0);
    setQuizFinished(false);

    try {
      const looseMeta = import.meta as unknown as any;
      const apiKey = looseMeta.env?.VITE_GEMINI_API_KEY?.trim();
      
      if (!apiKey) {
        throw new Error("API Key setup missing from construction servers!");
      }

      const prompt = `Generate an array of exactly 5 quiz questions on the topic "${topic}" suited for a student in "${profile?.classLevel || 'Class 10'}".
The target difficulty is "${difficulty}" and the format must be "${format}".

You must return a raw JSON array string containing exactly 5 question objects. Do not wrap the code inside markdown syntax like \`\`\`json. Return only the raw array data.

Each object must follow this scheme exactly:
{
  "type": "${format}",
  "question": "The string text of the question",
  "options": ${format === 'mcq' ? '["Option A", "Option B", "Option C", "Option D"]' : '["True", "False"]'},
  "correctAnswer": "The exact answer string matching one of the options",
  "explanation": "A complete clear educational description of the core target solution principle"
}`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!response.ok) {
        throw new Error(`Google API responded with status code ${response.status}`);
      }

      const streamPayload = await response.json();
      let rawText = streamPayload.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
      rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const parsedQuestions = JSON.parse(rawText);
      if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
        setQuestions(parsedQuestions);
      } else {
        throw new Error("Invalid response structural signature returned from node matrix.");
      }
    } catch (err: any) {
      console.error(err);
      alert(`Quiz Synthesis Failed: ${err.message || "Connection timed out."}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOptionClick = (option: string) => {
    if (isAnswered) return;
    setSelectedAnswer(option);
    setIsAnswered(true);
    
    if (option === questions![currentIdx].correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = async () => {
    setSelectedAnswer(null);
    setIsAnswered(false);
    
    if (currentIdx + 1 < questions!.length) {
      setCurrentIdx(prev => prev + 1);
    } else {
      setQuizFinished(true);
      if (profile) {
        const earnedXP = score * 20;
        try {
          await updateUserProfile(user.uid, { xpPoints: (profile.xpPoints || 0) + earnedXP });
        } catch (e) {
          console.error("XP updates sync block offline:", e);
        }
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-16 min-h-[calc(100vh-5rem)] flex flex-col justify-center">
      <Link to="/dashboard" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors mb-8 w-fit">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <AnimatePresence mode="wait">
        {!questions && !quizFinished && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="bg-slate-900 p-6 sm:p-10 rounded-3xl border border-border-strong shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 sm:p-12 opacity-10">
              <BrainCircuit className="w-32 h-32 text-brand" />
            </div>

            <div className="relative z-10 space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand/10 rounded-2xl flex items-center justify-center border border-brand/20">
                  <Sparkles className="h-6 w-6 text-brand" />
                </div>
                <div>
                  <h3 className="text-2xl sm:text-4xl font-black uppercase italic tracking-tighter text-white">AI Custom Practice</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-brand">Adaptive Synthesis Node</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">What topic do you want to practice?</label>
                  <input 
                    type="text" placeholder="e.g., Photosynthesis, Quadratic Equations, French Revolution..." 
                    value={topic} onChange={e => setTopic(e.target.value)}
                    className="w-full bg-slate-800 border border-border-strong p-5 rounded-2xl text-white font-bold outline-none focus:border-brand transition-all shadow-inner"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">Cognitive Difficulty</label>
                    <select 
                      value={difficulty} onChange={e => setDifficulty(e.target.value as any)}
                      className="w-full bg-slate-800 border border-border-strong p-5 rounded-2xl text-white font-black uppercase tracking-widest text-xs outline-none focus:border-brand appearance-none"
                    >
                      <option value="easy">Foundation Basics</option>
                      <option value="medium">Standard Assessment</option>
                      <option value="hard">Advanced Application</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">Question Architecture</label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-800 rounded-2xl border border-border-strong h-[66px] items-center">
                      <button
                        type="button" onClick={() => setFormat('mcq')}
                        className={cn("h-full rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", format === 'mcq' ? "bg-brand text-white shadow-lg" : "text-slate-500 hover:text-slate-300")}
                      >MCQ Matrix</button>
                      <button
                        type="button" onClick={() => setFormat('true_false')}
                        className={cn("h-full rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", format === 'true_false' ? "bg-brand text-white shadow-lg" : "text-slate-500 hover:text-slate-300")}
                      >True / False</button>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleGenerateQuiz} disabled={isGenerating || !topic.trim()}
                className="w-full h-16 sm:h-20 bg-brand text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-40"
              >
                {isGenerating ? <Zap className="h-5 w-5 animate-spin" /> : <BrainCircuit className="h-5 w-5" />}
                {isGenerating ? "Synthesizing Interactive Assessment..." : "Trigger Practice Generation"}
              </button>
            </div>
          </motion.div>
        )}

        {questions && !quizFinished && (
          <motion.div 
            key={currentIdx} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            className="space-y-6 sm:space-y-8"
          >
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Question {(currentIdx + 1).toString().padStart(2, '0')} / 05</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-brand italic">Topic: {topic}</span>
            </div>
            <div className="h-2 bg-slate-900 border border-border-strong rounded-full overflow-hidden">
              <div className="h-full bg-brand transition-all duration-300" style={{ width: `${((currentIdx + 1) / 5) * 100}%` }}></div>
            </div>

            <div className="bg-slate-900 p-6 sm:p-10 rounded-3xl border border-border-strong shadow-2xl space-y-8">
              <h4 className="text-xl sm:text-2xl font-black uppercase italic tracking-tighter text-white leading-tight">
                "{questions[currentIdx].question}"
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {questions[currentIdx].options.map((option, i) => {
                  const isCurrentOption = selectedAnswer === option;
                  const isCorrect = option === questions[currentIdx].correctAnswer;
                  
                  return (
                    <button
                      key={i} onClick={() => handleOptionClick(option)} disabled={isAnswered}
                      className={cn(
                        "p-5 rounded-2xl border text-left text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-between gap-4 shadow-sm",
                        !isAnswered && "bg-slate-800/40 border-border-strong text-slate-300 hover:border-brand hover:bg-slate-800",
                        isAnswered && isCorrect && "bg-emerald-500/10 border-emerald-500 text-emerald-400 font-black",
                        isAnswered && isCurrentOption && !isCorrect && "bg-red-500/10 border-red-500 text-red-400 font-black",
                        isAnswered && !isCurrentOption && !isCorrect && "bg-slate-800/20 border-border-strong/40 text-slate-600"
                      )}
                    >
                      <span>{option}</span>
                      {isAnswered && isCorrect && <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />}
                      {isAnswered && isCurrentOption && !isCorrect && <XCircle className="h-5 w-5 text-red-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {isAnswered && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="p-6 bg-slate-800/50 rounded-2xl border border-border-strong"
                >
                  <span className="text-[10px] font-black uppercase text-brand tracking-widest block mb-2 italic">Neural Insight Breakdown</span>
                  <p className="text-slate-400 text-sm font-medium leading-relaxed italic">"{questions[currentIdx].explanation}"</p>
                  
                  <button
                    onClick={handleNextQuestion}
                    className="mt-6 flex items-center justify-center gap-2 px-8 py-4 bg-brand text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all ml-auto"
                  >
                    {currentIdx + 1 === questions.length ? "Finish Assessment" : "Next Question"} <ChevronRight className="h-4 w-4" />
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {quizFinished && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="bg-slate-900 p-8 sm:p-12 rounded-[40px] border border-border-strong shadow-2xl text-center max-w-md mx-auto space-y-8"
          >
            <div className="w-20 h-20 bg-brand/10 border border-brand/20 rounded-full flex items-center justify-center mx-auto shadow-inner shadow-brand/10">
              <Trophy className="h-10 w-10 text-brand animate-bounce" />
            </div>

            <div>
              <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">Assessment Complete</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">Cognitive Matrix Updated</p>
            </div>

            <div className="p-6 bg-slate-800/40 border border-border-strong rounded-3xl grid grid-cols-2 gap-4">
              <div className="text-center border-r border-border-strong/50">
                <p className="text-[9px] font-black uppercase text-slate-500 tracking-wider mb-1">Final Score</p>
                <p className="text-3xl font-black italic text-white">{score} / 5</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] font-black uppercase text-slate-500 tracking-wider mb-1">XP Points Added</p>
                <p className="text-3xl font-black italic text-emerald-400">+{score * 20}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => { setQuestions(null); setQuizFinished(false); setTopic(''); }}
                className="flex-1 py-4 bg-slate-800 text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-slate-700 transition-all border border-border-strong flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Another Topic
              </button>
              <Link
                to="/dashboard"
                className="flex-1 py-4 bg-brand text-white font-black uppercase tracking-widest text-[10px] rounded-xl flex items-center justify-center shadow-lg shadow-brand/10 hover:scale-105 active:scale-95 transition-all"
              >
                Return Home
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}