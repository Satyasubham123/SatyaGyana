import { useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, XCircle, RotateCcw, Award, Clock, ArrowRight, Brain } from 'lucide-react';
import { cn } from '../lib/utils';
import { updateUserProfile, addActivitySignal } from '../services/userService';
import { contentService } from '../services/contentService';

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
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const urlParams = new URLSearchParams(location.search);
  const courseId = urlParams.get('courseId') || 'dynamic';
  const sectionId = urlParams.get('sectionId') || 'dynamic';
  const playlistId = urlParams.get('playlistId') || 'dynamic';

  useEffect(() => {
    const fetchQuiz = async () => {
      setIsLoading(true);
      try {
        // Set Timer from URL params
        const limitParam = urlParams.get('timeLimit');
        const limit = limitParam ? parseInt(limitParam) : 30;
        setTimeLeft(limit * 60);

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
                setIsLoading(false);
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
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId, location.search]);

  // Timer Countdown Logic
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || isFinished) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    if (timeLeft === 0) {
      clearInterval(timer);
      handleNext();
    }

    return () => clearInterval(timer);
  }, [timeLeft, isFinished]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateScore = (currentAnswers: string[]) => {
    return questions.reduce((acc, q, idx) => {
      return q.correctAnswer === currentAnswers[idx] ? acc + 1 : acc;
    }, 0);
  };

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
          await addActivitySignal(user.uid, "Perfect Score! 🏆", "You achieved 100% accuracy!", "achievement");
        } else if (computedPercentage >= 60) {
          await addActivitySignal(user.uid, "Solid Effort! 🧠", `You completed with ${computedPercentage}% accuracy.`, "learning");
        }
      } catch (err) { console.error("XP Error:", err); }

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
      </div>
    );
  }

  if (isFinished) {
    const score = calculateScore(answers);
    return (
      <div className="max-w-2xl mx-auto py-10 sm:py-20 px-4 text-center">
         <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-bg-surface p-6 sm:p-10 rounded-2xl sm:rounded-3xl shadow-2xl border border-border-strong relative overflow-hidden">
            <div className="w-16 h-16 bg-brand rounded-sm flex items-center justify-center mx-auto mb-8 rotate-12">
                <Award className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2 text-main">Operation Complete</h2>
            <div className="grid grid-cols-2 gap-4 mb-8">
               <div className="p-6 bg-bg-deep border border-border-strong rounded-xl">
                  <p className="text-[10px] font-black uppercase text-muted mb-2">Precision</p>
                  <p className="text-4xl font-black italic">{score}/{questions.length}</p>
               </div>
               <div className="p-6 bg-bg-deep border border-border-strong rounded-xl">
                  <p className="text-[10px] font-black uppercase text-muted mb-2">Efficiency</p>
                  <p className="text-4xl font-black italic">{Math.round((score/questions.length) * 100)}%</p>
               </div>
            </div>
            <button onClick={() => navigate('/dashboard')} className="w-full bg-brand text-white py-4 rounded-sm font-black uppercase tracking-widest text-xs hover:bg-brand-dark transition-all">
                 System Mainframe →
            </button>
         </motion.div>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
         <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="h-12 w-12 bg-bg-card border border-brand text-brand rounded-sm flex items-center justify-center font-black text-xl shadow-xl shrink-0">
               {currentIdx + 1}
            </div>
            {/* Timer UI Display */}
            {timeLeft !== null && (
              <div className={cn("px-6 py-3 rounded-full font-black tracking-widest text-sm flex items-center gap-2", 
                timeLeft < 60 ? "bg-red-500/20 text-red-500 animate-pulse" : "bg-bg-card text-brand")}>
                 <Clock className="w-4 h-4" /> {formatTime(timeLeft)}
              </div>
            )}
         </div>
      </div>

      <motion.div key={currentIdx} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-bg-surface p-8 md:p-12 rounded-2xl border border-border-strong shadow-2xl relative">
        <h3 className="text-xl md:text-3xl font-black uppercase tracking-tight text-main mb-10 leading-tight">
          {currentQuestion.question}
        </h3>

        <div className="space-y-3">
          {currentQuestion.type === 'short' ? (
            <div className="space-y-4">
               <textarea
                value={shortAnswer}
                onChange={(e) => setShortAnswer(e.target.value)}
                disabled={selectedAnswer !== null}
                className="w-full h-32 p-6 bg-slate-800/50 border-2 border-border-strong rounded-xl text-white outline-none focus:border-brand transition-all font-black"
               />
               {selectedAnswer === null && (
                 <button onClick={handleShortSubmit} className="w-full py-4 bg-brand text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg">Submit Signature</button>
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
                    "w-full p-5 border-2 text-left font-black uppercase tracking-widest text-xs transition-all flex items-center justify-between",
                    selectedAnswer === null 
                      ? "bg-bg-deep border-border-strong hover:border-brand hover:translate-x-1" 
                      : isSelected 
                        ? isCorrect ? "bg-brand border-brand text-white" : "bg-red-600 border-red-600 text-white"
                        : isCorrect ? "bg-brand/20 border-brand/40 text-brand" : "bg-bg-deep border-border-strong opacity-20"
                  )}
                >
                  <span>{opt}</span>
                  {selectedAnswer !== null && isCorrect && <CheckCircle2 className="h-4 w-4" />}
                </button>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}