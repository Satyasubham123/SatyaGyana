
import { useState } from 'react';
import AuthModal from '../components/AuthModal';
import { motion } from 'motion/react';
import { Sparkles, Brain, BookOpen, Target, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FounderProfile } from '../components/FounderProfile';
import StatsSummary from '../components/StatsSummary';
import { useUser } from '../contexts/UserContext'; // Keep this import

export default function LandingPage() { // 🚀 INTERFACE AND PROPS REMOVED
  const { user } = useUser(); // Hook handles user state
  
  const features = [
    {
      icon: <Brain className="h-6 w-6" />,
      title: "AI Teacher Assistant",
      description: "Get personalized, step-by-step explanations in English, Hindi, or Odia whenever you're stuck."
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Smart Quiz Engine",
      description: "AI-generated quizzes adapted to your class level. Master topics with instant feedback."
    },
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: "Comprehensive Notes",
      description: "Access high-quality NCERT notes, formula sheets, and chapter summaries."
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "Learning Progress",
      description: "Track your XP, badges, and study streaks. Stay motivated with personal goal tracking."
    }
  ];
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <div className="overflow-x-hidden bg-bg-deep">
      {/* Hero Section */}
      <section className="relative pt-24 pb-44 px-4 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-brand/10 blur-[120px] rounded-full -z-10 opacity-30"></div>
        
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-[10px] uppercase font-black tracking-widest mb-10">
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI-Powered Learning for Bharat</span>
            </span>
            <h1 className="text-5xl sm:text-7xl md:text-9xl font-black mb-8 tracking-tighter uppercase italic text-slate-900 dark:text-white leading-[0.9]">
              Master Studies with <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand via-blue-500 to-indigo-400">AI Teaching</span>
            </h1>
            <p className="text-slate-700 dark:text-slate-200 text-base sm:text-lg md:text-2xl max-w-3xl mx-auto mb-14 leading-relaxed font-medium">
              Comprehensive learning for Class 6 to 10. Personalized notes, adaptive quizzes, and AI-driven insights to help you excel.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              {user ? (
                <Link
                  to="/dashboard"
                  className="w-full sm:w-auto bg-brand text-white px-12 py-6 rounded-xl font-black text-xl uppercase tracking-tighter hover:bg-brand-dark transition-all flex items-center justify-center group shadow-2xl shadow-brand/20 active:scale-95"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="h-6 w-6 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="w-full sm:w-auto bg-brand text-white px-12 py-6 rounded-xl font-black text-xl uppercase tracking-tighter hover:bg-brand-dark transition-all flex items-center justify-center shadow-2xl shadow-brand/20 active:scale-95"
                >
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="h-5 w-5 mr-3 invert brightness-0" />
                  <span>Start Learning Free</span>
                </button>
              )}
              <a
                href="#features"
                className="w-full sm:w-auto bg-bg-card text-main border border-border-strong px-12 py-6 rounded-xl font-black text-xl uppercase tracking-tighter hover:bg-bg-surface transition-all active:scale-95"
              >
                Watch Demo
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <StatsSummary />

      {/* ... Rest of your component remains exactly the same ... */}
      <section id="features" className="py-24">
        {/* ... */}
      </section>
      
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
}