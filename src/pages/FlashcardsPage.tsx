import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { User as FirebaseUser } from 'firebase/auth';
import { 
  ArrowLeft, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  Save,
  CheckCircle,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export default function FlashcardsPage({ user }: { user: FirebaseUser }) {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  const topicName = topicId?.split('-').pop()?.replace(/^\w/, (c) => c.toUpperCase()) || 'Study Material';

  useEffect(() => {
    const fetchFlashcards = async () => {
      setIsLoading(true);
      try {
        // Try to fetch existing cards for this user and topic first
        const q = query(
          collection(db, 'flashcards'), 
          where('userId', '==', user.uid),
          where('topic', '==', topicName)
        );
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const firstSet = snapshot.docs[0].data();
          setCards(firstSet.cards);
          setHasSaved(true);
          setIsLoading(false);
          return;
        }

        // Otherwise generate new ones
        const response = await fetch('/api/ai/flashcards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: topicName,
            classLevel: 'Class 10' // Should come from profile
          })
        });
        const data = await response.json();
        setCards(data.cards);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFlashcards();
  }, [topicId, user.uid, topicName]);

  const saveFlashcards = async () => {
    if (!user || cards.length === 0 || hasSaved) return;
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'flashcards'), {
        userId: user.uid,
        topic: topicName,
        moduleId: topicId,
        cards: cards,
        createdAt: serverTimestamp()
      });
      setHasSaved(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const nextCard = () => {
    if (currentIndex < cards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev + 1), 100);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev - 1), 100);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-bg-deep">
        <div className="w-20 h-20 bg-brand/10 rounded-3xl animate-bounce mb-8 border border-brand/20 flex items-center justify-center">
          <Sparkles className="h-10 w-10 text-brand" />
        </div>
        <h2 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-slate-50 mb-4">Extracting Key Concepts</h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs uppercase font-black tracking-widest">GyanMitra AI is generating neural flashcards...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 bg-bg-deep min-h-screen">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 sm:mb-12">
        <div>
          <Link to={`/class/${topicId}`} className="inline-flex items-center text-slate-500 dark:text-slate-400 hover:text-brand transition-colors mb-4 sm:mb-6 text-[10px] uppercase font-black tracking-[0.2em] w-fit">
            <ArrowLeft className="h-3 w-3 mr-2" />
            Return to Stream
          </Link>
          <div className="flex items-center gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4 text-brand" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand italic">Adaptive Synthesis</span>
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-slate-50 leading-none">
            {topicName} Insight
          </h1>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          {!hasSaved && (
            <button
              onClick={saveFlashcards}
              disabled={isSaving}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 sm:py-4 bg-brand text-white rounded-xl font-black uppercase tracking-widest text-[10px] sm:text-xs hover:bg-brand-dark transition-all disabled:opacity-50 shadow-lg shadow-brand/20 active:scale-95"
            >
              {isSaving ? (
                <div className="animate-spin h-3 w-3 border-b-2 border-white rounded-full" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isSaving ? 'Encrypting...' : 'Save to Profile'}
            </button>
          )}
          {hasSaved && (
            <div className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 sm:py-4 bg-bg-card border border-brand/20 text-brand rounded-sm font-black uppercase tracking-widest text-[10px] sm:text-xs">
              <CheckCircle className="h-4 w-4" />
              Saved to Vault
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8">
          <div className="relative h-[300px] sm:h-[400px] w-full perspective-2000 group">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 30, rotateY: 10 }}
                animate={{ opacity: 1, x: 0, rotateY: 0 }}
                exit={{ opacity: 0, x: -30, rotateY: -10 }}
                transition={{ duration: 0.4, ease: "anticipate" }}
                className="w-full h-full"
              >
                <motion.div 
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="w-full h-full relative transform-style-3d cursor-pointer"
                  style={{ transformPerspective: 1200 }}
                  initial={false}
                  animate={{ 
                    rotateY: isFlipped ? 180 : 0,
                    z: isFlipped ? 100 : 0,
                  }}
                  whileHover={{ 
                    scale: 1.02, 
                    z: isFlipped ? 120 : 20,
                    rotateX: isFlipped ? -2 : 2
                  }}
                  whileTap={{ scale: 0.98, z: 10 }}
                  transition={{ 
                    rotateY: { 
                      type: "spring", 
                      stiffness: 80, 
                      damping: 12,
                      mass: 1.4,
                      restDelta: 0.001
                    },
                    z: { duration: 0.4, ease: "easeOut" },
                    scale: { duration: 0.4, ease: "easeOut" }
                  }}
                >
                  {/* Front Side */}
                  <div className="absolute inset-0 backface-hidden bg-white dark:bg-slate-900 border-2 border-border-strong rounded-3xl sm:rounded-[40px] p-8 sm:p-12 flex flex-col items-center justify-center text-center shadow-[0_40px_80px_-15px_rgba(37,99,235,0.08)] dark:shadow-none overflow-hidden transition-colors">
                    <div className="absolute top-0 right-0 p-8 sm:p-12 opacity-[0.03] dark:opacity-[0.08] -translate-y-8 translate-x-8">
                       <Eye className="h-48 w-48 sm:h-64 sm:w-64 text-brand" />
                    </div>
                    <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
                      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] sm:tracking-[0.6em] text-brand mb-8 sm:mb-12 italic opacity-60">Neural Node: Front</span>
                      <h3 className="text-2xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tighter text-slate-900 dark:text-slate-50 leading-[1.1] italic mb-6 sm:mb-8">
                        {cards[currentIndex]?.front}
                      </h3>
                      <div className="mt-auto flex flex-col items-center gap-3 sm:gap-4">
                        <div className="flex gap-1">
                          {[1,2,3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-brand/20 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />)}
                        </div>
                        <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-slate-400 dark:text-slate-500 italic">Initiate Flip Sequence</p>
                      </div>
                    </div>
                  </div>

                  {/* Back Side */}
                  <div className="absolute inset-0 backface-hidden rotate-y-180 bg-brand border-[4px] sm:border-[6px] border-slate-900 dark:border-slate-800 rounded-3xl sm:rounded-[36px] p-8 sm:p-12 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden">
                     <div className="absolute inset-0 opacity-[0.08] pointer-events-none">
                        <div className="grid grid-cols-12 h-full">
                           {Array.from({ length: 48 }).map((_, i) => (
                             <div key={i} className="border-[0.5px] border-white"></div>
                           ))}
                        </div>
                     </div>
                    <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
                      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] sm:tracking-[0.6em] text-white/60 mb-8 sm:mb-12 italic">Neural Map: Decrypted</span>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-snug tracking-tight italic">
                        {cards[currentIndex]?.back}
                      </p>
                      <div className="mt-auto flex flex-col items-center gap-3 sm:gap-4">
                        <div className="w-6 sm:w-8 h-1 bg-white/20 rounded-full" />
                        <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-white/40 italic">Return to Source</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between mt-6 sm:mt-10">
            <button 
              onClick={prevCard}
              disabled={currentIndex === 0}
              className="p-3 sm:p-4 bg-bg-card border border-border-strong rounded-xl text-main hover:text-brand hover:border-brand transition-all disabled:opacity-20 translate-y-0 active:translate-y-1 shrink-0"
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <div className="flex flex-col items-center min-w-0 px-4">
               <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-muted mb-2 text-center">Sequence Status</span>
               <div className="flex gap-1 sm:gap-1.5 overflow-hidden">
                  {cards.map((_, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "h-1 sm:h-1.5 min-w-[12px] sm:min-w-[24px] rounded-full transition-all",
                        i === currentIndex ? "bg-brand flex-1" : i < currentIndex ? "bg-brand/30" : "bg-bg-card border border-border-strong"
                      )}
                    />
                  ))}
               </div>
               <span className="text-[11px] sm:text-[12px] font-black italic mt-3 text-main shrink-0">{currentIndex + 1} / {cards.length}</span>
            </div>
            <button 
              onClick={nextCard}
              disabled={currentIndex === cards.length - 1}
              className="p-3 sm:p-4 bg-bg-card border border-border-strong rounded-xl text-main hover:text-brand hover:border-brand transition-all disabled:opacity-20 translate-y-0 active:translate-y-1 shrink-0"
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
           <div className="bg-bg-surface border border-border-strong rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute -top-4 -right-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                 <RotateCcw className="h-16 w-16 sm:h-24 sm:w-24" />
              </div>
              <h4 className="text-base sm:text-lg font-black uppercase italic tracking-tighter mb-4 text-brand">Instructions</h4>
              <ul className="space-y-3 sm:space-y-4">
                 {[
                   "Review each card front & back",
                   "Visualize the answer before flipping",
                   "Repeat until 100% recall achieved",
                   "Save set for offline study simulation"
                 ].map((text, i) => (
                   <li key={i} className="flex gap-3 items-start">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5 shrink-0"></div>
                      <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wide text-secondary italic leading-tight">{text}</span>
                   </li>
                 ))}
              </ul>
           </div>

           <div className="p-6 sm:p-8 bg-bg-card border border-border-strong rounded-2xl text-center">
              <h5 className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted mb-6">Neural Progress</h5>
              <div className="relative inline-block mb-6">
                 <svg className="w-20 h-20 sm:w-24 sm:h-24 rotate-[-90deg]">
                    <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-bg-deep" />
                    <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-brand" strokeDasharray={213.6} strokeDashoffset={213.6 * (1 - (currentIndex + 1) / cards.length)} strokeLinecap="round" />
                 </svg>
                 <div className="absolute inset-0 flex items-center justify-center font-black text-lg sm:text-xl italic bg-clip-text">
                    {Math.round(((currentIndex + 1) / cards.length) * 100)}%
                 </div>
              </div>
              <p className="text-[9px] sm:text-[10px] font-black uppercase text-muted tracking-widest">Buffer Completion Rate</p>
           </div>
        </div>
      </div>
    </div>
  );
}
