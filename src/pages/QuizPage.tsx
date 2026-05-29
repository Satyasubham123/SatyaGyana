import { useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, XCircle, RotateCcw, Award, Clock, ArrowRight, Brain } from 'lucide-react';
import { cn } from '../lib/utils';
// 🚀 1. The imports are updated here
import { updateUserProfile, addActivitySignal } from '../services/userService';
import { contentService } from '../services/contentService';

// 🚀 FIXED: We now extend Vite's existing environment interface instead of overwriting it
declare global {
  interface ImportMetaEnv {
    readonly VITE_GEMINI_API_KEY?: string;
  }
}

interface Question {
  id?: string;
  type: 'mcq' | 'tf' | 'short' | 'true_false' | 'short_answer';
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export default function QuizPage({ user }: { user: FirebaseUser }) {
  const { quizId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [shortAnswer, setShortAnswer] = useState('');
  const [isGrading, setIsGrading] = useState(false);

  const urlParams = new URLSearchParams(location.search);
  const courseId = urlParams.get('courseId') || 'dynamic';
  const sectionId = urlParams.get('sectionId') || 'dynamic';
  const playlistId = urlParams.get('playlistId') || 'dynamic';

  useEffect(() => {
    const fetchQuiz = async () => {
      setIsLoading(true);
      try {
        if (courseId !== 'dynamic' && sectionId !== 'dynamic' && playlistId !== 'dynamic' && quizId) {
          const lessons = await contentService.getLessons(courseId, sectionId, playlistId);
          const lesson = lessons.find(l => l.id === quizId);
          if (lesson && lesson.content) {
            try {
              const quizData = JSON.parse(lesson.content);
              if (Array.isArray(quizData)) {
                setQuestions(quizData.map(q => ({
                  ...q,
                  type: q.type === 'true_false' ? 'tf' : (q.type === 'short_answer' ? 'short' : q.type)
                })));
                return;
              }
            } catch (e) {
              console.error("Failed to parse published quiz content", e);
            }
          }
        }

        const difficulty = urlParams.get('difficulty') || 'medium';
        const format = urlParams.get('format') || 'mcq';
        const topic = quizId?.split('-').pop() || 'General Science';
        
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
        if (!apiKey) {
          throw new Error("Secret API Key lookup missed at configuration build!");
        }

        const designPrompt = `Generate an array of exactly 5 quiz questions on the topic "${topic}".
The target difficulty structure is "${difficulty}" and options must match format rule codes of "${format}".

You must return a raw JSON array string containing exactly 5 question objects. Do not wrap the code inside markdown syntax like \`\`\`json. Return only the raw array data. 

Each object must follow this scheme exactly:
{
  "type": "${format === 'mcq' ? 'mcq' : 'true_false'}",
  "question": "The string text of the question",
  "options": ${format === 'mcq' ? '["Option A", "Option B", "Option C", "Option D"]' : '["True", "False"]'},
  "correctAnswer": "The perfect answer string matching options",
  "explanation": "A conceptual educational breakdown description of the core principle"
}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: designPrompt }] }]
          })
        });

        if (!response.ok) {
          throw new Error(`Google API gateway returned validation status code ${response.status}`);
        }

        const data = await response.json();
        let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
        rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

        const parsedQuiz = JSON.parse(rawText);
        setQuestions(parsedQuiz.map((q: any) => ({
          ...q,
          type: q.type === 'true_false' ? 'tf' : (q.type === 'short_answer' ? 'short' : q.type)
        })));
      } catch (err) {
        console.error('Quiz Error:', err);
      } finally { // 🚀 2. Fixed syntax typo here
        setIsLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId, location.search]);

  const calculateScore = (currentAnswers: string[]) => {
    return questions.reduce((acc, q, idx) => {
      return q.correctAnswer === currentAnswers[idx] ? acc + 1 : acc;
    }, 0);
  };

  // 🚀 3. Restored the perfectly balanced handleNext function
  const handleNext = async () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setSelectedAnswer(null);
      setShortAnswer('');
      setIsGrading(false);
    } else {
      const finalScore = calculateScore(answers);
      const computedPercentage = Math.round((finalScore / questions.length) * 100);

      await contentService.saveQuizAttempt({
        userId: user.uid,
        quizId: quizId || 'dynamic_eval',
        courseId,
        sectionId,
        playlistId,
        score: finalScore,
        totalQuestions: questions.length,
        percentage: computedPercentage
      });

      if (quizId && courseId !== 'dynamic') {
        await contentService.markLessonComplete(user.uid, {
          id: quizId,
          courseId,
          sectionId,
          playlistId,
          title: 'Quiz Module',
          type: 'quiz',
          order: 99
        });
      }

      try {
        await updateUserProfile(user.uid, { xpPoints: 50 });
        
        if (computedPercentage === 100) {
          await addActivitySignal(
            user.uid, 
            "Perfect Score! 🏆", 
            "You achieved 100% accuracy on your recent quiz. Masterful work!", 
            "achievement"
          );
        } else if (computedPercentage >= 60) {
          await addActivitySignal(
            user.uid, 
            "Solid Effort! 🧠", 
            `You completed a quiz with ${computedPercentage}% accuracy. Keep pushing!`, 
            "learning"
          );
        } else {
           await addActivitySignal(
            user.uid, 
            "Module Reviewed 📚", 
            `You completed a practice run. Review the neural insights to improve your score.`, 
            "system"
          );
        }

      } catch (err) {
        console.error("User XP profile trace offline:", err);
      }

      setIsFinished(true);
    } 
  };

  const handleAnswerSelect = (opt: string) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(opt);
    
    const newAnswers = [...answers];
    newAnswers[currentIdx] = opt;
    setAnswers(newAnswers);

    setTimeout(handleNext, 1500);
  };

  const handleShortSubmit = () => {
    if (!shortAnswer.trim()) return;
    setIsGrading(true);
    
    const newAnswers = [...answers];
    newAnswers[currentIdx] = shortAnswer.trim();
    setAnswers(newAnswers);
    
    setSelectedAnswer(shortAnswer.trim());
    setTimeout(handleNext, 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-bg-deep">
         <div className="w-24 h-24 relative mb-8">
            <div className="absolute inset-0 bg-brand/20 rounded-full animate-ping"></div>
            <div className="relative bg-bg-card p-6 rounded-full border border-brand/50 shadow-2xl flex items-center justify-center">
                <Brain className="h-10 w-10 text-brand" />
            </div>
         </div>
         <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2 text-main">Synthesizing Dataset</h2>
         <p className="text-muted font-black uppercase tracking-widest text-[10px]">Neural Engine: Formatting custom evaluation stream...</p>
      </div>
    );
  }

  if (isFinished) {
    const score = calculateScore(answers);
    return (
      <div className="max-w-2xl mx-auto py-10 sm:py-20 px-4 text-center">
         <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-bg-surface p-6 sm:p-10 rounded-2xl sm:rounded-3xl shadow-2xl border border-border-strong relative overflow-hidden"
         >
            <div className="absolute top-0 right-0 p-8 opacity-5">
               <Award className="h-32 w-32 sm:h-40 sm:w-40 text-brand" />
            </div>
            
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-brand rounded-sm flex items-center justify-center mx-auto mb-6 sm:mb-8 rotate-12">
                <Award className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black uppercase italic tracking-tighter mb-2 italic text-main">Operation Complete</h2>
            <p className="text-secondary font-black uppercase tracking-widest text-[10px] sm:text-xs mb-8 sm:mb-10">
                Cycle Reward: <span className="text-brand font-bold">50 XP Gain Cache</span> Added to Profile.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 sm:mb-10">
               <div className="p-6 sm:p-8 bg-bg-deep border border-border-strong rounded-xl">
                  <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted mb-2 italic">Precision</p>
                  <p className="text-3xl sm:text-4xl font-black italic">{score}/{questions.length}</p>
               </div>
               <div className="p-6 sm:p-8 bg-bg-deep border border-border-strong rounded-xl">
                  <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted mb-2 italic">Efficiency</p>
                  <p className="text-3xl sm:text-4xl font-black italic">{Math.round((score/questions.length) * 100)}%</p>
               </div>
            </div>

            {score < questions.length && (
              <div className="mb-8 sm:mb-10 text-left">
                 <h4 className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] text-brand mb-4 italic">Heuristic Analysis: Structural Weaknesses</h4>
                 <div className="flex flex-wrap gap-2">
                    {questions.map((q, i) => {
                      if (q.correctAnswer !== answers[i]) {
                        return (
                          <div key={i} className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-950/20 border border-red-900/50 rounded-sm text-[9px] sm:text-[10px] text-red-500 font-bold uppercase tracking-widest">
                            Block {(i + 1).toString().padStart(2, '0')} Data Gap
                          </div>
                        );
                      }
                      return null;
                    })}
                 </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 relative z-10">
               <button 
                onClick={() => window.location.reload()}
                className="flex-1 bg-transparent border-2 border-border-strong text-main py-4 rounded-sm font-black uppercase tracking-widest text-[10px] sm:text-xs hover:bg-bg-card transition-all"
               >
                 Re-Initialize
               </button>
               <button 
                onClick={() => navigate('/dashboard')}
                className="flex-1 bg-brand text-white py-4 rounded-sm font-black uppercase tracking-widest text-[10px] sm:text-xs hover:bg-brand-dark transition-all shadow-xl shadow-brand/10"
               >
                 System Mainframe →
               </button>
            </div>
         </motion.div>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 sm:mb-12">
         <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-bg-card border border-brand text-brand rounded-sm flex items-center justify-center font-black italic text-lg sm:text-xl shadow-xl shadow-brand/10 shrink-0">
               {currentIdx + 1}
            </div>
            <div className="flex-1 sm:w-48 h-2 sm:h-3 bg-bg-surface border border-border-strong rounded-full overflow-hidden shadow-inner">
               <motion.div 
                className="h-full bg-brand"
                initial={{ width: 0 }}
                animate={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
               />
            </div>
         </div>
         <div className="flex items-center text-muted font-black uppercase tracking-[0.2em] text-[9px] sm:text-[10px]">
            <Clock className="h-3 w-3 mr-2" />
            <span>Telemetry Active</span>
         </div>
      </div>

      <motion.div 
        key={currentIdx}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-bg-surface p-6 sm:p-8 md:p-12 rounded-2xl border border-border-strong shadow-2xl relative"
      >
        <span className="text-[9px] sm:text-[10px] font-black text-brand uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-4 sm:mb-6 block italic">Input Buffer: Block {currentIdx + 1} / {questions.length}</span>
        <h3 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight text-main mb-8 sm:mb-10 leading-tight">
          {currentQuestion.question}
        </h3>

        <div className="space-y-3">
          {currentQuestion.type === 'short' ? (
            <div className="space-y-4">
               <textarea
                value={shortAnswer}
                onChange={(e) => setShortAnswer(e.target.value)}
                disabled={selectedAnswer !== null}
                placeholder="Type your response here..."
                className="w-full h-32 p-4 sm:p-6 bg-slate-50 dark:bg-slate-800/50 border-border-strong border-2 rounded-xl text-slate-900 dark:text-white focus:border-brand outline-none transition-all uppercase tracking-widest text-[10px] sm:text-xs font-black shadow-inner"
               />
               {selectedAnswer === null && (
                 <button 
                  onClick={handleShortSubmit}
                  className="w-full py-4 bg-brand text-white font-black uppercase tracking-widest text-[10px] sm:text-xs hover:bg-brand-dark transition-all rounded-xl shadow-lg shadow-brand/20"
                 >
                   Submit Signature
                 </button>
               )}
            </div>
          ) : (
            currentQuestion.options.map((opt, idx) => {
              const isCorrect = opt === currentQuestion.correctAnswer;
              const isSelected = opt === selectedAnswer;
              
              return (
                <button
                  key={idx}
                  disabled={selectedAnswer !== null}
                  onClick={() => handleAnswerSelect(opt)}
                  className={cn(
                    "w-full p-4 sm:p-5 border-2 text-left font-black uppercase tracking-widest text-[10px] sm:text-xs transition-all flex items-center justify-between group",
                    selectedAnswer === null 
                      ? "bg-bg-deep border-border-strong hover:border-brand hover:translate-x-1 text-secondary" 
                      : isSelected 
                        ? isCorrect ? "bg-brand border-brand text-white" : "bg-red-600 border-red-600 text-white"
                        : isCorrect ? "bg-brand/20 border-brand/40 text-brand" : "bg-bg-deep border-border-strong opacity-20 text-muted"
                  )}
                >
                  <span className="pr-4">{opt}</span>
                  {selectedAnswer !== null && (
                    <span className="scale-110 sm:scale-125 shrink-0">
                      {isCorrect && <CheckCircle2 className="h-4 w-4" />}
                      {isSelected && !isCorrect && <XCircle className="h-4 w-4" />}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        <AnimatePresence>
          {selectedAnswer !== null && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mt-10 pt-10 border-t-2 border-border-strong border-dashed"
            >
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand mb-4 italic">Neural Insight</h4>
              <p className="text-sm font-medium text-secondary leading-relaxed italic">
                {currentQuestion.explanation}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}