import { User as FirebaseUser } from 'firebase/auth';
import { signInWithGoogle } from '../lib/firebase';
import { motion } from 'motion/react';
import { Sparkles, Brain, BookOpen, Clock, Target, Languages, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

import { FounderProfile } from '../components/FounderProfile';

interface LandingPageProps {
  user: FirebaseUser | null;
}

export default function LandingPage({ user }: LandingPageProps) {
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

  return (
    <div className="overflow-x-hidden bg-bg-deep">
      {/* Hero Section */}
      <section className="relative pt-24 pb-44 px-4 overflow-hidden">
        {/* Ambient Glow */}
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
              Comprehensive learning for Class 6 to 12. Personalized notes, adaptive quizzes, and AI-driven insights to help you excel.
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
                  onClick={signInWithGoogle}
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

      {/* Stats Summary Mockup */}
      <section className="py-24 border-y border-border-strong bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-bg-card border border-border-strong p-8 rounded-3xl shadow-xl shadow-slate-200/60 dark:shadow-none transition-transform hover:scale-[1.02]">
                <p className="text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-widest">XP Points Accumulation</p>
                <p className="text-5xl font-black italic text-slate-900 dark:text-slate-100">4,250 <span className="text-xs text-brand not-italic ml-2">+150 today</span></p>
              </div>
              <div className="bg-bg-card border border-border-strong p-8 rounded-3xl shadow-xl shadow-slate-200/60 dark:shadow-none transition-transform hover:scale-[1.02]">
                <p className="text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-widest">Next Milestone</p>
                <p className="text-5xl font-black italic text-slate-900 dark:text-slate-100">12 Days <span className="text-xs text-orange-600 not-italic ml-2">Physics Finals</span></p>
              </div>
              <div className="bg-bg-card border border-border-strong p-8 rounded-3xl shadow-xl shadow-slate-200/60 dark:shadow-none transition-transform hover:scale-[1.02]">
                <p className="text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-widest">Efficiency Percentile</p>
                <p className="text-5xl font-black italic text-slate-900 dark:text-slate-100">Top 5% <span className="text-xs text-blue-600 not-italic ml-2">Global Rank</span></p>
              </div>
           </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-left mb-16 max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mb-4 text-brand">Excellence by Design</h2>
            <p className="text-secondary text-lg">Focused on student success in India with localized support and AI that actually understands you.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -8 }}
                className="p-10 bg-bg-card border border-border-strong hover:border-brand hover:shadow-2xl hover:shadow-brand/10 transition-all rounded-3xl flex flex-col justify-between h-full group"
              >
                <div>
                  <div className="text-brand mb-8 bg-brand/10 w-12 h-12 flex items-center justify-center rounded-xl group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter mb-4 text-slate-900 dark:text-slate-100 italic">{feature.title}</h3>
                  <p className="text-slate-700 dark:text-slate-200 leading-relaxed text-base font-medium">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Languages Section */}
      <section className="py-32 bg-slate-50 dark:bg-slate-900/40 border-y border-border-strong relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="flex-1 text-center lg:text-left">
              <span className="inline-block px-4 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-[10px] font-black uppercase tracking-widest mb-8">
                Native Support
              </span>
              <h2 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter mb-8 leading-[0.9] text-slate-900 dark:text-slate-50">Study in your Primary Language</h2>
              <p className="text-slate-600 dark:text-slate-300 text-xl md:text-2xl mb-12 leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
                Language should never be a barrier to education. Our AI teacher can explain complex science and math problems in English, Hindi, or Odia.
              </p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                {['English', 'हिन्दी', 'ଓଡ଼ିଆ'].map(lang => (
                  <div key={lang} className="px-6 sm:px-10 py-4 bg-bg-card border border-border-strong text-slate-900 dark:text-slate-50 font-black uppercase tracking-tighter italic rounded-xl shadow-lg shadow-slate-200/50 dark:shadow-none min-w-[124px]">
                    {lang}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 w-full relative group max-w-lg lg:max-w-none mx-auto">
               <div className="aspect-square bg-gradient-to-br from-brand via-blue-500 to-cyan-400 rounded-3xl p-1 shadow-2xl shadow-brand/20">
                  <div className="w-full h-full bg-bg-deep rounded-[22px] flex items-center justify-center p-12 text-center overflow-hidden relative">
                     <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--color-brand)_0%,_transparent_70%)] opacity-10"></div>
                     <p className="text-3xl font-black italic tracking-tighter uppercase text-slate-900 dark:text-slate-50 opacity-40 group-hover:opacity-100 transition-opacity">Multilingual AI Teacher Engine 3.5</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="py-24 bg-bg-deep relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <FounderProfile />
        </div>
      </section>

      {/* Disclaimer Section */}
      <section className="py-20 bg-bg-deep border-t border-border-strong px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-border-strong text-slate-500 text-[10px] uppercase font-black tracking-widest mb-8">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Academic Integrity Protocol</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter mb-8 text-main">Important Disclosure</h2>
          <div className="space-y-6 text-secondary text-sm md:text-base font-medium leading-relaxed">
            <p>
              GyanMitra AI provides AI-assisted educational support for students. While we aim for maximum precision, AI-generated responses, quizzes, and explanations may occasionally contain logical anomalies.
            </p>
            <p className="p-6 bg-brand/5 border-l-2 border-brand rounded-r-xl italic">
              Students are strictly encouraged to verify critical academic information with official NCERT textbooks, authorized teachers, or official educational resources before examination submission.
            </p>
            <p>
              This platform is designed as a supplementary learning accelerator and not as an official educational authority or a replacement for classroom instruction.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border-subtle bg-bg-deep">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-muted text-[10px] font-black uppercase tracking-[0.2em]">
          <p>© 2026 GyanMitra AI • Future of Education</p>
          <div className="flex space-x-8 mt-6 md:mt-0">
            <Link to="/about" className="hover:text-brand transition-colors">About</Link>
            <Link to="/privacy" className="hover:text-brand transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-brand transition-colors">Terms</Link>
            <Link to="/contact" className="hover:text-brand transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
