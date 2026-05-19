import { User as FirebaseUser } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { syncUserProfile, UserProfile, updateUserProfile } from '../services/userService';
import { contentService } from '../services/contentService';
import { motion } from 'motion/react';
import { 
  BookMarked, Trophy, Flame, MessageSquare, ArrowRight, Calculator, 
  Atom, BookText, History, Cpu, GraduationCap, Sparkles, Calendar, 
  Play, CheckCircle, ChevronRight, Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { BadgeIcon } from '../components/BadgeIcon';
import { FounderProfile } from '../components/FounderProfile';
import StatsSummary from '../components/StatsSummary';

declare global {
  interface ImportMeta {
    readonly env: {
      readonly VITE_GEMINI_API_KEY?: string;
    };
  }
}

interface DashboardProps {
  user: FirebaseUser;
  profile: UserProfile | null;
}

const CLASSES = ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"];

const SUBJECTS = [
  { id: 'math', name: 'Mathematics', icon: <Calculator />, color: 'bg-blue-500', textColor: 'text-blue-500' },
  { id: 'science', name: 'Science', icon: <Atom />, color: 'bg-emerald-500', textColor: 'text-emerald-500' },
  { id: 'english', name: 'English', icon: <BookText />, color: 'bg-violet-500', textColor: 'text-violet-500' },
  { id: 'social', name: 'Social Science', icon: <History />, color: 'bg-amber-500', textColor: 'text-amber-500' },
  { id: 'cs', name: 'Computer Science', icon: <Cpu />, color: 'bg-slate-700', textColor: 'text-slate-700' },
];

export default function Dashboard({ user, profile }: DashboardProps) {
  const [loading, setLoading] = useState(false);
  const [studyPlan, setStudyPlan] = useState<any>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [dbCourses, setDbCourses] = useState<any[]>([]);
  const [userHistory, setUserHistory] = useState<any[]>([]);
  const [userProgress, setUserProgress] = useState<any[]>([]);

  useEffect(() => {
    if (profile?.classLevel) {
      fetchCourses();
      fetchUserData();
    }
  }, [profile?.classLevel, user.uid]);

  const fetchCourses = async () => {
    if (!profile?.classLevel) return;
    try {
      const courses = await contentService.getCoursesByClass(profile.classLevel);
      setDbCourses(courses);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUserData = async () => {
    try {
      const history = await contentService.getUserHistory(user.uid);
      const progress = await contentService.getUserProgress(user.uid);
      setUserHistory(history);
      setUserProgress(progress);
    } catch (err) {
      console.error(err);
    }
  };

  const getCourseProgress = (courseId: string) => {
    const courseProgress = userProgress.filter(p => p.courseId === courseId && p.completed);
    return courseProgress.length;
  };

  const lastViewedCourse = userHistory[0] ? dbCourses.find(c => c.id === userHistory[0].courseId) : null;
  const recentHistory = userHistory.slice(1, 4).map(h => dbCourses.find(c => c.id === h.courseId)).filter(Boolean);
  
  const generateStudyPlan = async () => {
    if (!profile) return;
    setIsGeneratingPlan(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
      if (!apiKey) throw new Error("API Key missing!");

      const prompt = `Generate a weekly study plan for a student in ${profile.classLevel}.
      They have ${profile.xpPoints || 0} XP. Their weak topics are: ${profile.weakTopics?.join(', ') || 'None specified'}.
      Return ONLY a raw JSON object with this exact structure. Do not wrap in markdown (like \`\`\`json):
      {
        "objective": "Main weekly goal",
        "motivation": "A short encouraging quote",
        "weeklySchedule": [
          { "day": "Monday", "tasks": [{ "subject": "Math", "topic": "Algebra", "action": "Review notes" }] }
        ]
      }`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      if (!response.ok) throw new Error("Failed to connect to AI");
      const data = await response.json();
      let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      
      setStudyPlan(JSON.parse(rawText));
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleClassSelect = async (className: string) => {
    if (!profile) return;
    setLoading(true);
    try {
      await updateUserProfile(user.uid, { classLevel: className });
      window.location.reload(); 
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!profile || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-deep">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-16 w-16 bg-brand/20 rounded-full mb-4 border border-brand/50"></div>
          <p className="text-brand font-black uppercase tracking-widest text-[10px]">Accessing Neural Link...</p>
        </div>
      </div>
    );
  }

  if (profile && !profile.classLevel) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter mb-4 text-main">Welcome, {user.displayName}! 窓</h2>
        <p className="text-secondary font-medium mb-12 uppercase tracking-widest text-sm">Select your current sector to initialize data stream.</p>
        <div className="flex flex-wrap justify-center gap-4">
          {CLASSES.map((cls) => (
            <button
              key={cls}
              onClick={() => handleClassSelect(cls)}
              className="w-[140px] p-6 bg-bg-card border border-border-strong rounded-sm hover:border-brand transition-all flex flex-col items-center group relative overflow-hidden"
            >
              <div className="bg-bg-deep border border-border-strong w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-all group-hover:bg-brand group-hover:text-black">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="font-black uppercase tracking-tighter text-base text-main">{cls}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-16 bg-bg-deep min-h-screen">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 sm:gap-8 mb-10 text-center sm:text-left">
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black uppercase italic tracking-tighter mb-4 text-main leading-tight">
            Namaste, {user.displayName?.split(' ')[0]}! 窓
          </h1>
          <p className="text-secondary text-sm sm:text-base md:text-lg font-medium">
            You are at <span className="text-brand font-black underline decoration-brand/30 underline-offset-8 tracking-widest text-[10px] sm:text-xs uppercase">{profile?.classLevel || 'Unspecified'}</span>. Initializing adaptive session.
          </p>
        </div>
        <div className="flex items-center justify-center sm:justify-start gap-4">
          <Link
            to="/ai-teacher"
            className="w-full sm:w-auto bg-brand text-white px-6 sm:px-8 py-4 rounded-xl font-black text-xs sm:text-sm uppercase tracking-widest hover:bg-brand-dark transition-all flex items-center justify-center gap-3 shadow-xl shadow-brand/20 active:scale-95"
          >
            <Cpu className="h-5 w-5" />
            AI Mentor
          </Link>
        </div>
      </div>

      {/* 🚀 FIXED: Added (profile.role === 'admin') so you can physically see the banner while developing */}
      {((profile as any)?.subscriptionPlan === 'trial' || (profile as any)?.role === 'admin') && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 bg-gradient-to-r from-brand/10 via-blue-900/20 to-slate-900 border border-brand/30 rounded-[24px] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-2xl"
        >
          {/* Decorative Background Glow */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand/20 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 text-center md:text-left">
             <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full mb-3">
                <Zap className="h-3 w-3 text-yellow-500" />
                <span className="text-[9px] font-black uppercase tracking-widest text-yellow-500">Early Bird Offer</span>
             </div>
             <h3 className="text-2xl sm:text-3xl font-black italic uppercase text-white tracking-tighter">
                Lock in your <span className="text-brand">₹19/mo</span> price.
             </h3>
             <p className="text-slate-400 text-sm font-medium mt-2 max-w-xl">
               Your 1-month free trial is currently active. Upgrade your account today to secure our lowest pricing tier before the official launch rates increase!
             </p>
          </div>
          
          <Link 
            to="/subscription" 
            className="relative z-10 w-full md:w-auto px-8 py-4 bg-brand hover:bg-blue-600 text-white font-black uppercase tracking-widest text-xs sm:text-sm rounded-xl transition-all shadow-xl shadow-brand/20 active:scale-95 flex items-center justify-center shrink-0"
          >
             Upgrade Now →
          </Link>
        </motion.div>
      )}

      <div className="mb-12 -mx-4 sm:mx-0">
         <StatsSummary user={user} />
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-12">
            {lastViewedCourse && (
              <div className="space-y-6">
                 <h3 className="text-xl font-black uppercase italic tracking-tighter text-brand flex items-center gap-2 px-2 sm:px-0">
                    <Play className="h-5 w-5 fill-brand" /> Continue Learning
                 </h3>
                 <Link 
                   to={`/class/${lastViewedCourse.id}`} 
                   className="block bg-slate-900 border border-border-strong rounded-3xl sm:rounded-[32px] p-6 sm:p-8 hover:border-brand transition-all group overflow-hidden relative"
                 >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                    <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8 relative z-10">
                       {lastViewedCourse.thumbnail ? (
                         <img src={lastViewedCourse.thumbnail} alt="" className="w-full md:w-48 h-32 object-cover rounded-2xl border border-border-strong" />
                       ) : (
                         <div className="w-full md:w-48 h-32 bg-slate-800 rounded-2xl flex items-center justify-center text-brand">
                            <BookMarked className="h-10 w-10 opacity-20" />
                         </div>
                       )}
                       <div className="flex-1 text-center md:text-left">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand bg-brand/10 px-3 py-1 rounded-full mb-3 inline-block">Active Session</span>
                          <h4 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tighter text-white mb-2">{lastViewedCourse.title}</h4>
                          <p className="text-slate-400 text-xs sm:text-sm font-medium mb-4 line-clamp-2 md:line-clamp-none">{lastViewedCourse.description?.slice(0, 80)}...</p>
                          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                             <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
                                <CheckCircle className="h-4 w-4 text-emerald-500" /> {getCourseProgress(lastViewedCourse.id)} Lessons Mastered
                             </div>
                          </div>
                       </div>
                       <div className="w-12 h-12 sm:w-16 sm:h-16 bg-brand rounded-full items-center justify-center hidden md:flex group-hover:scale-110 transition-transform shadow-xl shadow-brand/20">
                          <ChevronRight className="h-8 w-8 text-white" />
                       </div>
                    </div>
                 </Link>
              </div>
            )}

            {recentHistory.length > 0 && (
              <div className="space-y-4 px-2 sm:px-0">
                 <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-500">Recently Accessed Nodes</h3>
                 <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-4">
                    {recentHistory.map((course: any) => (
                       <Link 
                         key={course.id} to={`/class/${course.id}`}
                         className="bg-bg-card border border-border-strong p-3 sm:p-4 rounded-xl sm:rounded-2xl hover:border-brand/50 transition-all flex items-center gap-3 sm:gap-4 group"
                       >
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-bg-deep rounded-lg sm:rounded-xl flex items-center justify-center text-brand group-hover:bg-brand group-hover:text-white transition-all shrink-0">
                             <History className="h-3 w-3 sm:h-4 sm:w-4" />
                          </div>
                          <div className="min-w-0">
                             <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-tighter text-main italic truncate">{course.title}</p>
                             <p className="text-[7px] sm:text-[8px] font-bold uppercase tracking-widest text-muted truncate">{course.subject}</p>
                          </div>
                       </Link>
                    ))}
                 </div>
              </div>
            )}

            <div className="flex items-center justify-between px-2 sm:px-0">
               <h3 className="text-lg sm:text-xl font-black uppercase italic tracking-tighter text-brand">Core Curriculum</h3>
               <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-muted">2026-27 Version</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-2 sm:px-0">
               {dbCourses.length > 0 ? dbCourses.map((course, idx) => {
                 const subjectInfo = SUBJECTS.find(s => s.id === course.subject) || SUBJECTS[0];
                 return (
                   <motion.div
                     key={course.id}
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: idx * 0.05 }}
                   >
                       <Link
                         to={`/class/${course.id}`}
                         className="bg-bg-card border border-border-strong p-6 sm:p-8 rounded-2xl sm:rounded-3xl flex flex-col justify-between hover:border-brand transition-all group min-h-[180px] sm:min-h-[220px] shadow-sm hover:shadow-2xl hover:shadow-brand/5 relative overflow-hidden"
                       >
                         <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                         <div className="flex justify-between items-start mb-6 sm:mb-8 relative z-10">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-bg-deep border border-border-strong rounded-xl sm:rounded-2xl flex items-center justify-center text-brand text-xl sm:text-2xl font-black group-hover:bg-brand group-hover:text-white transition-all shadow-inner shrink-0 text-center">
                               <div className="scale-75 sm:scale-90 flex items-center justify-center">{subjectInfo.icon}</div>
                            </div>
                            <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6 text-slate-400 group-hover:text-brand group-hover:translate-x-2 transition-all" />
                         </div>
                         <div className="relative z-10">
                            <h4 className="text-xl sm:text-2xl font-black uppercase italic tracking-tighter mb-2 text-slate-900 dark:text-slate-50">{course.title}</h4>
                            <div className="flex items-center justify-between">
                               <p className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-500 tracking-widest leading-none">Modules Organized for {course.board || 'NCERT'}</p>
                               {getCourseProgress(course.id) > 0 && (
                                 <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-black text-emerald-500 uppercase italic">
                                   <CheckCircle className="h-3 w-3" /> {getCourseProgress(course.id)}
                                 </span>
                               )}
                            </div>
                         </div>
                       </Link>
                   </motion.div>
                 );
               }) : (
                 <div className="sm:col-span-2 py-12 sm:py-20 text-center bg-bg-card border-2 border-dashed border-border-strong rounded-3xl mx-2 sm:mx-0 px-4">
                    <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-brand mx-auto mb-4 opacity-20" />
                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted">No Curriculum Clusters Detected for {profile.classLevel}</p>
                 </div>
               )}
            </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
           <div className="bg-bg-surface border border-border-strong rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-4 bg-bg-card border-b border-border-subtle flex items-center justify-between">
                 <span className="font-black text-xs uppercase tracking-widest text-brand">Telemetry</span>
                 <History className="h-4 w-4 text-muted" />
              </div>
              <div className="p-6 space-y-6">
                 <div>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted mb-2">
                       <span>Link Level</span>
                       <span>Tier {profile?.level || 1}</span>
                    </div>
                    <div className="h-2 bg-border-subtle rounded-sm overflow-hidden">
                       {/* @ts-ignore */}
                       <div className="h-full bg-brand" style={{ width: `${(profile?.totalXP || profile?.xpPoints || 0) % 100}%` }}></div>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-bg-deep p-4 border border-border-subtle rounded-xl">
                       <p className="text-[10px] font-black text-muted uppercase mb-1">XP Gain</p>
                       {/* @ts-ignore */}
                       <p className="text-2xl font-black italic text-main">{profile?.totalXP || profile?.xpPoints || 0}</p>
                    </div>
                    <div className="bg-bg-deep p-4 border border-border-subtle rounded-xl">
                       <p className="text-[10px] font-black text-muted uppercase mb-1">Streak</p>
                       <p className="text-2xl font-black italic text-main">{profile?.streakCount || 0}d</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}