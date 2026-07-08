import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { supabase } from '../lib/supabase';
import { Clock, ShieldAlert, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function ActiveTest() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  
  const [test, setTest] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);

  // Safely get user email
  const userEmail = (user as any)?.email || "unknown@student.com";

  useEffect(() => {
    const loadTest = async () => {
      try {
        const { data, error } = await supabase.from('active_quizzes').select('*').eq('id', testId).single();
        if (error) throw error;
        setTest(data);
        setTimeLeft(data.time_limit_minutes * 60); // Convert minutes to seconds
      } catch (err) {
        console.error(err);
        navigate('/tests');
      } finally {
        setIsLoading(false);
      }
    };
    loadTest();
  }, [testId, navigate]);

  // Timer Countdown Logic
  useEffect(() => {
    if (timeLeft === null || isSubmitted) return;
    
    if (timeLeft <= 0) {
      submitExam();
      return;
    }
    
    const timerId = setInterval(() => {
      setTimeLeft(t => (t ? t - 1 : 0));
    }, 1000);
    
    return () => clearInterval(timerId);
  }, [timeLeft, isSubmitted]);

  const handleSelectAnswer = (qIndex: number, option: string) => {
    if (isSubmitted) return;
    setAnswers(prev => ({ ...prev, [qIndex]: option }));
  };

  const submitExam = async () => {
    setIsSubmitted(true);
    let correctCount = 0;

    // Standard Assessment Verification
    test.questions.forEach((q: any, i: number) => {
      if (answers[i] === q.correctAnswer) correctCount++;
    });

    setFinalScore(correctCount);

    // Save to Database
    try {
      await supabase.from('quiz_scores').insert([{
        quiz_id: test.id,
        user_email: userEmail,
        score: correctCount,
        total_questions: test.questions.length
      }]);
    } catch (err) {
      console.error("Failed to save score", err);
    }
  };

  // Format MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-bg-deep"><Loader2 className="w-12 h-12 text-emerald-500 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-bg-deep pb-24">
      {/* Fixed Header with Timer */}
      <div className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-border-strong px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h2 className="text-white font-black italic uppercase text-lg sm:text-xl truncate max-w-[200px] sm:max-w-md">{test.title}</h2>
            <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">{test.topic}</p>
          </div>
          
          <div className={cn(
            "flex items-center gap-3 px-6 py-3 rounded-2xl border font-black tracking-widest shadow-xl",
            timeLeft! <= 60 ? "bg-red-500/10 border-red-500 text-red-500 animate-pulse" : "bg-slate-900 border-slate-700 text-white"
          )}>
            <Clock className="w-5 h-5" />
            <span className="text-xl">{formatTime(timeLeft || 0)}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-8 space-y-8">
        {isSubmitted && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-8 rounded-[32px] text-center mb-12">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-4xl font-black italic uppercase text-white tracking-tighter">Exam Concluded</h2>
            <p className="text-emerald-400 font-bold tracking-widest uppercase mt-2">
              Final Score: {finalScore} / {test.questions.length}
            </p>
            <button onClick={() => navigate('/tests')} className="mt-6 px-8 py-3 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-xs">
              Return to Hub
            </button>
          </div>
        )}

        {test.questions.map((q: any, i: number) => (
          <div key={i} className="bg-slate-900 border border-border-strong p-6 sm:p-8 rounded-[32px] shadow-lg">
            <div className="flex gap-4 mb-6">
              <span className="w-10 h-10 shrink-0 bg-emerald-500/10 text-emerald-500 font-black flex items-center justify-center rounded-xl border border-emerald-500/20">
                {i + 1}
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-white leading-relaxed">{q.question}</h3>
            </div>
            
            <div className="space-y-3">
              {q.options.map((opt: string, optIdx: number) => {
                const isSelected = answers[i] === opt;
                const isCorrect = isSubmitted && opt === q.correctAnswer;
                const isWrong = isSubmitted && isSelected && !isCorrect;

                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectAnswer(i, opt)}
                    disabled={isSubmitted}
                    className={cn(
                      "w-full text-left px-6 py-4 rounded-2xl border font-bold text-sm transition-all flex items-center gap-4",
                      isSelected && !isSubmitted ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-600",
                      isCorrect ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" : "",
                      isWrong ? "bg-red-500/10 border-red-500 text-red-400" : "",
                      isSubmitted && "cursor-default"
                    )}
                  >
                    <div className={cn("w-4 h-4 rounded-full border-2 flex shrink-0 items-center justify-center", isSelected ? "border-emerald-500" : "border-slate-600")}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                    </div>
                    {opt}
                  </button>
                );
              })}
            </div>

            {isSubmitted && (
              <div className="mt-6 p-6 bg-slate-800/50 rounded-2xl border border-slate-700">
                <span className="text-[10px] font-black uppercase text-brand tracking-widest block mb-2">Neural Insight</span>
                <p className="text-slate-400 text-sm font-medium">{q.explanation}</p>
              </div>
            )}
          </div>
        ))}

        {!isSubmitted && (
          <button 
            onClick={() => window.confirm("Are you sure you want to submit your exam?") && submitExam()}
            className="w-full h-20 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[32px] font-black uppercase tracking-[0.2em] text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <ShieldAlert className="w-5 h-5" /> Submit Assessment
          </button>
        )}
      </div>
    </div>
  );
}