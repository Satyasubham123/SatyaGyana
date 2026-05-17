import { useParams, Link } from 'react-router-dom';
import { User as FirebaseUser } from 'firebase/auth';
import { 
  BookOpen, 
  ChevronRight, 
  Play, 
  FileText, 
  Settings2, 
  ArrowLeft,
  Video,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Layers,
  FolderOpen,
  Circle,
  CheckCircle,
  BrainCircuit,
  Settings as HelpCircle,
  Clock,
  Send,
  Link as LinkIcon,
  Archive,
  Zap,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useEffect } from 'react';
import { contentService, Course, Section, Playlist, Lesson, UserProgress, Submission } from '../services/contentService';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';

interface PlaylistWithLessons extends Playlist {
  lessons: (Lesson & { isCompleted?: boolean })[];
  isOpen?: boolean;
}

interface SectionWithPlaylists extends Section {
  playlists: PlaylistWithLessons[];
  isOpen?: boolean;
}

export default function ClassDetails({ user }: { user: FirebaseUser }) {
  const { classId } = useParams(); // This is the courseId
  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<SectionWithPlaylists[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [existingSubmission, setExistingSubmission] = useState<Submission | null>(null);
  const [submissionContent, setSubmissionContent] = useState('');
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [difficulty, setDifficulty] = useState('medium');
  const [format, setFormat] = useState('mcq');

  useEffect(() => {
    const fetchData = async () => {
      if (!classId) return;
      try {
        const courses = await contentService.getCourses();
        const foundCourse = courses.find(c => c.id === classId);
        if (foundCourse) {
          setCourse(foundCourse);
          
          // Record history
          contentService.updateViewingHistory(user.uid, classId);

          // Fetch user progress
          const userProgress = await contentService.getUserProgress(user.uid, classId);
          setProgress(userProgress);

          const fetchedSections = await contentService.getSections(classId);
          const sectionsWithPlaylists = await Promise.all(
            fetchedSections.map(async (sec) => {
              const playlists = await contentService.getPlaylists(classId, sec.id);
              const playlistsWithLessons = await Promise.all(
                playlists.map(async (pl) => {
                  const lessons = await contentService.getLessons(classId, sec.id, pl.id);
                  return { 
                    ...pl, 
                    lessons: lessons.map(l => ({
                      ...l,
                      isCompleted: userProgress.some(p => p.lessonId === l.id && p.completed)
                    })), 
                    isOpen: false 
                  };
                })
              );
              return { ...sec, playlists: playlistsWithLessons, isOpen: true };
            })
          );
          setSections(sectionsWithPlaylists);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [classId, user.uid]);

  const handleLessonSelect = async (lesson: Lesson) => {
    setActiveLesson(lesson);
    setExistingSubmission(null);
    setSubmissionContent('');
    setSubmissionUrl('');

    if (lesson.type === 'assignment') {
      try {
        const submissions = await contentService.getSubmissions(lesson.id, user.uid);
        if (submissions.length > 0) {
          setExistingSubmission(submissions[0]);
        }
      } catch (err) {
        console.error("Error fetching submission:", err);
      }
    }
    
    try {
      // Record partial progress/view
      await contentService.markLessonComplete(user.uid, lesson);
      // Update local state to show as completed (since we treat view as progress for now)
      setSections(prev => prev.map(s => ({
        ...s,
        playlists: s.playlists.map(p => ({
          ...p,
          lessons: p.lessons.map(l => l.id === lesson.id ? { ...l, isCompleted: true } : l)
        }))
      })));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSection = (id: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, isOpen: !s.isOpen } : s));
  };

  const togglePlaylist = (sectionId: string, playlistId: string) => {
    setSections(prev => prev.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          playlists: s.playlists.map(p => p.id === playlistId ? { ...p, isOpen: !p.isOpen } : p)
        };
      }
      return s;
    }));
  };

  const getEmbedUrl = (url?: string) => {
    if (!url) return '';
    if (url.includes('youtube.com/watch?v=')) return url.replace('watch?v=', 'embed/');
    if (url.includes('youtube.com/live/')) return url.replace('live/', 'embed/');
    if (url.includes('youtu.be/')) return url.replace('youtu.be/', 'youtube.com/embed/');
    if (url.includes('drive.google.com/file/d/')) {
      return url.replace('/view', '/preview').replace('/edit', '/preview');
    }
    return url;
  };

  const handleAssignmentSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLesson || activeLesson.type !== 'assignment') return;
    
    setIsSubmitting(true);
    try {
      const subId = await contentService.submitAssignment({
        userId: user.uid,
        lessonId: activeLesson.id,
        content: submissionContent,
        submissionUrl: submissionUrl
      });
      
      const newSub: Submission = {
        id: subId,
        userId: user.uid,
        lessonId: activeLesson.id,
        content: submissionContent,
        submissionUrl: submissionUrl,
        submittedAt: new Date(),
        status: 'pending'
      };
      setExistingSubmission(newSub);
      alert("Neural Asset Deployed Successfully.");
    } catch (err) {
      console.error(err);
      alert("Deployment Failed. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (!activeLesson) return null;

    if (activeLesson.type === 'assignment') {
      return (
        <div className="w-full h-full bg-bg-deep p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <div className="p-10 bg-slate-100 dark:bg-slate-900 rounded-[40px] border border-border-strong relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Archive className="h-32 w-32 text-brand" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-brand/10 border border-brand/20 rounded-2xl flex items-center justify-center">
                    <Archive className="h-6 w-6 text-brand" />
                  </div>
                  <div>
                    <h5 className="text-3xl font-black uppercase italic tracking-tighter text-main">Neural Assignment</h5>
                    <p className="text-[10px] text-muted font-black uppercase tracking-widest leading-none mt-1">Status: {existingSubmission ? (existingSubmission.status === 'graded' ? 'COMPLETED' : 'PENDING EVALUATION') : 'STAGED'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="bg-white/50 dark:bg-black/20 p-6 rounded-3xl border border-border-strong">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
                       <Clock className="h-3 w-3" /> Expiry Protocol
                    </p>
                    <p className="text-lg font-black italic text-main">
                      {activeLesson.dueDate ? new Date(activeLesson.dueDate).toLocaleString() : 'Open Ended'}
                    </p>
                  </div>
                  <div className="bg-white/50 dark:bg-black/20 p-6 rounded-3xl border border-border-strong">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
                       <ShieldCheck className="h-3 w-3" /> Evaluation Node
                    </p>
                    <p className="text-lg font-black italic text-main">Grade Point System</p>
                  </div>
                </div>

                <div className="bg-white/50 dark:bg-black/20 p-8 rounded-3xl border border-border-strong">
                   <h6 className="text-[10px] font-black uppercase tracking-widest text-brand mb-4">Brief & Instructions</h6>
                   <div className="prose prose-slate dark:prose-invert max-w-none text-secondary font-medium leading-relaxed">
                     <ReactMarkdown>{activeLesson.submissionInstructions || ''}</ReactMarkdown>
                   </div>
                </div>
              </div>
            </div>

            {existingSubmission ? (
               <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                  <div className="bg-emerald-500/10 border-2 border-emerald-500/20 p-10 rounded-[40px] relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-8 opacity-10">
                        <CheckCircle className="h-32 w-32 text-emerald-500" />
                     </div>
                     <div className="relative z-10">
                        <h4 className="text-2xl font-black uppercase italic tracking-tighter text-emerald-500 mb-2">Transmission Received</h4>
                        <p className="text-slate-500 text-xs font-bold mb-8">Asset deployed on {new Date(existingSubmission.submittedAt?.toDate?.() || existingSubmission.submittedAt).toLocaleString()}</p>
                        
                        <div className="space-y-6">
                           <div className="bg-white/50 dark:bg-black/20 p-6 rounded-2xl border border-border-strong">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Payload Summary</p>
                              <p className="text-sm font-medium text-main">{existingSubmission.content}</p>
                           </div>
                           {existingSubmission.submissionUrl && (
                             <a 
                               href={existingSubmission.submissionUrl} target="_blank" rel="noreferrer"
                               className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand hover:underline"
                             >
                               <LinkIcon className="h-3 w-3" /> View Submitted Asset
                             </a>
                           )}
                        </div>
                     </div>
                  </div>

                  {existingSubmission.status === 'graded' && (
                     <div className="bg-brand/5 border-2 border-brand/20 p-10 rounded-[40px] relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                           <Sparkles className="h-32 w-32 text-brand" />
                        </div>
                        <div className="relative z-10">
                           <div className="flex items-center justify-between mb-8">
                             <h4 className="text-2xl font-black uppercase italic tracking-tighter text-brand">Evaluator Feedback</h4>
                             <div className="px-6 py-3 bg-brand text-white rounded-2xl font-black text-xl italic shadow-xl">
                                {existingSubmission.score}/100
                             </div>
                           </div>
                           <p className="text-main font-medium leading-relaxed italic border-l-4 border-brand pl-6">
                              "{existingSubmission.feedback}"
                           </p>
                        </div>
                     </div>
                  )}
               </div>
            ) : (
              <div className="bg-bg-surface p-10 rounded-[40px] border border-border-strong shadow-xl">
                <h4 className="text-2xl font-black uppercase italic tracking-tighter text-main mb-8">Neural Deployment Portal</h4>
                <form onSubmit={handleAssignmentSubmission} className="space-y-8">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">Payload Summary / Answer</label>
                      <textarea 
                        value={submissionContent} onChange={e => setSubmissionContent(e.target.value)}
                        className="w-full bg-bg-deep border border-border-strong p-8 rounded-[32px] text-main font-medium h-48 outline-none focus:border-brand transition-all resize-none"
                        placeholder="Synthesize your conclusions and findings here..."
                        required
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">External Asset Link (Optional)</label>
                      <div className="relative">
                         <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                            <LinkIcon className="h-4 w-4 text-slate-500" />
                         </div>
                         <input 
                           type="url" value={submissionUrl} onChange={e => setSubmissionUrl(e.target.value)}
                           className="w-full bg-bg-deep border border-border-strong p-5 pl-14 rounded-2xl text-main font-bold outline-none focus:border-brand"
                           placeholder="Cloud storage or portfolio link..."
                         />
                      </div>
                   </div>

                   <div className="p-6 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl flex items-start gap-4">
                      <ShieldCheck className="h-5 w-5 text-yellow-500 shrink-0 mt-1" />
                      <p className="text-[10px] font-bold text-yellow-600/80 uppercase tracking-widest leading-relaxed">
                        Deployment Finalization: Once transmitted, the payload will be locked for evaluation. Ensure high integrity data before execution.
                      </p>
                   </div>

                   <button 
                     type="submit" disabled={isSubmitting || !submissionContent}
                     className="w-full py-6 bg-brand text-white rounded-[32px] font-black uppercase tracking-widest text-xs shadow-xl shadow-brand/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                   >
                     {isSubmitting ? <Zap className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                     Execute Deployment
                   </button>
                </form>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (activeLesson.type === 'video') {
      return (
        <iframe 
          src={getEmbedUrl(activeLesson.videoUrl)} 
          className="w-full h-full border-none"
          allowFullScreen
          allow="autoplay"
        />
      );
    }

    if (activeLesson.type === 'note') {
      return (
        <div className="w-full h-full bg-slate-100 dark:bg-slate-900 flex flex-col p-4 sm:p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto w-full space-y-4 sm:space-y-6">
             <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6 bg-brand/5 border border-brand/20 rounded-2xl sm:rounded-3xl">
                <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-brand" />
                <div>
                   <h5 className="text-lg sm:text-xl font-black uppercase italic tracking-tighter text-main">Study Node Access</h5>
                   <p className="text-[9px] sm:text-[10px] text-muted font-bold uppercase tracking-widest">Document synchronization active</p>
                </div>
             </div>
             {activeLesson.pdfUrl ? (
               <iframe src={activeLesson.pdfUrl} className="w-full h-[400px] sm:h-[600px] border-none rounded-2xl sm:rounded-3xl shadow-2xl" />
             ) : (
               <div className="p-12 sm:p-20 bg-bg-card border border-border-strong rounded-2xl sm:rounded-3xl text-center">
                  <p className="text-secondary text-sm italic">No visual asset linked for this note.</p>
               </div>
             )}
          </div>
        </div>
      );
    }

    if (activeLesson.type === 'quiz') {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-bg-deep p-12 text-center overflow-y-auto">
          <div className="max-w-md w-full bg-bg-surface p-10 rounded-[40px] border border-border-strong shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12">
               <BrainCircuit className="h-32 w-32 text-brand" />
            </div>
            <div className="relative z-10">
               <div className="w-20 h-20 bg-brand/10 rounded-[32px] flex items-center justify-center mx-auto mb-8 border border-brand/20">
                  <BrainCircuit className="h-10 w-10 text-brand" />
               </div>
               <h4 className="text-3xl font-black uppercase italic tracking-tighter text-main mb-4">Neural Assessment</h4>
               <p className="text-secondary text-sm font-medium mb-10 leading-relaxed">
                 {activeLesson.content ? 
                   "This logic node contains a pre-synthesized assessment specifically for this curriculum stream." : 
                   "Initiate a real-time intelligence test generated by the AI neural engine for this module."}
               </p>
               
               <Link 
                 to={`/quiz/${activeLesson.id}?courseId=${activeLesson.courseId}&sectionId=${activeLesson.sectionId}&playlistId=${activeLesson.playlistId}`}
                 className="block w-full py-5 bg-brand text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-brand/20 hover:scale-[1.02] active:scale-95 transition-all"
               >
                 Execute Intelligence Sync
               </Link>

               <div className="mt-8 flex items-center justify-center gap-6 opacity-30">
                  <div className="flex items-center gap-1">
                     <Zap className="h-3 w-3" />
                     <span className="text-[8px] font-black uppercase tracking-widest">Low Latency</span>
                  </div>
                  <div className="flex items-center gap-1">
                     <ShieldCheck className="h-3 w-3" />
                     <span className="text-[8px] font-black uppercase tracking-widest">Verified Logic</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      );
    }
  };

  if (loading) {
     return (
       <div className="min-h-screen flex flex-col items-center justify-center bg-bg-deep">
          <div className="w-16 h-16 border-4 border-brand/20 border-t-brand rounded-full animate-spin mb-4"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand">Accessing Learning Node...</p>
       </div>
     );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg-deep p-4">
         <h2 className="text-3xl font-black uppercase italic tracking-tighter text-main mb-4">Data Cluster Not Found</h2>
         <Link to="/dashboard" className="text-brand font-black uppercase tracking-widest text-[10px] hover:underline">Return to Neural Base</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12 bg-bg-deep min-h-screen">
      <Link to="/dashboard" className="inline-flex items-center text-muted hover:text-brand transition-colors mb-6 sm:mb-8 text-[10px] uppercase font-black tracking-widest leading-none">
         <ArrowLeft className="h-3 w-3 mr-2" />
         Return to Base
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        <div className="order-2 lg:order-1 lg:col-span-8 space-y-8 lg:space-y-12">
          <div className="mb-8 lg:mb-12">
             <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-brand/10 border border-brand/20 rounded-lg text-brand text-[8px] font-black uppercase tracking-widest leading-none shrink-0">{course.classLevel}</span>
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 text-[8px] font-black uppercase tracking-widest leading-none shrink-0">{course.subject.toUpperCase()}</span>
             </div>
             <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black uppercase italic tracking-tighter text-main leading-[1] sm:leading-[0.9]">{course.title}</h1>
             <p className="text-secondary mt-6 font-medium text-base sm:text-lg leading-relaxed max-w-2xl">{course.description}</p>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl sm:text-2xl font-black uppercase italic tracking-tighter text-brand flex items-center gap-4">
              <Layers className="h-5 w-5 sm:h-6 sm:w-6" />
              Course Curriculum
            </h3>

            <div className="space-y-4 sm:space-y-6">
              {sections.length > 0 ? sections.map((section, sIdx) => (
                <div key={section.id} className="space-y-3 sm:space-y-4">
                  <button 
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between p-4 sm:p-6 bg-bg-surface border border-border-strong rounded-xl sm:rounded-2xl group transition-all text-left"
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-brand/10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
                        <span className="text-brand font-black text-xs sm:text-sm italic">{(sIdx + 1).toString().padStart(2, '0')}</span>
                      </div>
                      <h4 className="text-lg sm:text-xl font-black uppercase tracking-tight text-main italic truncate">{section.title}</h4>
                    </div>
                    <ChevronDown className={cn("h-4 w-4 sm:h-5 sm:w-5 text-slate-400 transition-transform shrink-0", section.isOpen && "rotate-180")} />
                  </button>

                  <AnimatePresence>
                    {section.isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden space-y-3 sm:space-y-4 pl-4 sm:pl-6"
                      >
                        {section.playlists.map(playlist => (
                          <div key={playlist.id} className="bg-bg-card border border-border-strong rounded-xl sm:rounded-[24px] overflow-hidden shadow-sm">
                            <button 
                              onClick={() => togglePlaylist(section.id, playlist.id)}
                              className="w-full p-4 sm:p-6 flex items-center justify-between group text-left"
                            >
                              <div className="flex items-center gap-3 sm:gap-4">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-bg-deep rounded-lg sm:rounded-xl flex items-center justify-center text-brand shrink-0">
                                  <FolderOpen className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                  <h5 className="text-base sm:text-lg font-black uppercase tracking-tight text-main italic leading-none truncate">{playlist.title}</h5>
                                  <p className="text-[8px] sm:text-[9px] text-muted font-bold uppercase tracking-widest mt-2">{playlist.lessons.length} Lessons Available</p>
                                </div>
                              </div>
                              <ChevronDown className={cn("h-3 w-3 sm:h-4 sm:w-4 text-slate-400 transition-transform shrink-0", playlist.isOpen && "rotate-180")} />
                            </button>

                            <AnimatePresence>
                              {playlist.isOpen && (
                                <motion.div
                                  initial={{ height: 0 }}
                                  animate={{ height: 'auto' }}
                                  exit={{ height: 0 }}
                                  className="overflow-hidden bg-bg-deep/20 border-t border-border-strong/50"
                                >
                                  <div className="p-2 sm:p-3 space-y-1.5 sm:space-y-2">
                                    {playlist.lessons.map(lesson => (
                                      <button
                                        key={lesson.id}
                                        onClick={() => handleLessonSelect(lesson)}
                                        className={cn(
                                          "w-full flex items-center justify-between p-3 sm:p-4 rounded-xl transition-all group text-left",
                                          activeLesson?.id === lesson.id 
                                            ? "bg-brand text-white shadow-lg shadow-brand/20" 
                                            : "bg-bg-card hover:bg-bg-surface border border-transparent hover:border-brand/10"
                                        )}
                                      >
                                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                          <div className={cn(
                                            "w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-colors shadow-inner shrink-0",
                                            activeLesson?.id === lesson.id 
                                              ? "bg-white/20" 
                                              : lesson.isCompleted ? "bg-emerald-500/10 text-emerald-500" : "bg-bg-deep text-brand"
                                          )}>
                                            {lesson.isCompleted ? <CheckCircle className="h-3 w-3" /> : lesson.type === 'video' ? <Video className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                                          </div>
                                          <span className={cn(
                                            "font-bold uppercase tracking-tighter text-[11px] sm:text-xs italic truncate",
                                            activeLesson?.id !== lesson.id && lesson.isCompleted && "text-slate-400 line-through decoration-slate-500/50"
                                          )}>{lesson.title}</span>
                                        </div>
                                        <Play className={cn("h-3 w-3 opacity-0 group-hover:opacity-100 shrink-0", activeLesson?.id === lesson.id && "opacity-100")} />
                                      </button>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )) : (
                <div className="py-16 sm:py-20 text-center bg-bg-card border-2 border-dashed border-border-strong rounded-[32px] sm:rounded-[40px]">
                   <Sparkles className="h-10 w-10 sm:h-12 sm:w-12 text-brand mx-auto mb-6 opacity-20" />
                   <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted">Awaiting Content Synchronization</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="order-1 lg:order-2 lg:col-span-4 space-y-6 sm:space-y-8">
           {activeLesson ? (
              <div className="lg:sticky lg:top-24 space-y-6 sm:space-y-8">
                 <div className="bg-bg-card border border-border-strong rounded-3xl sm:rounded-[40px] overflow-hidden shadow-2xl">
                    <div className="aspect-video bg-black flex items-center justify-center relative group">
                       {renderContent()}
                    </div>
                    <div className="p-6 sm:p-10">
                       <h4 className="text-xl sm:text-2xl font-black uppercase italic tracking-tighter text-main mb-4">{activeLesson.title}</h4>
                       <div className="flex flex-wrap gap-2 sm:gap-3">
                          <span className="px-3 py-1.5 sm:px-4 sm:py-2 bg-bg-deep border border-border-strong rounded-lg sm:rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-brand">Secure Link Verified</span>
                       </div>
                    </div>
                 </div>

                  <div className="bg-brand p-6 sm:p-10 rounded-[28px] sm:rounded-[32px] text-center shadow-2xl shadow-brand/20 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Zap className="h-16 w-16 sm:h-20 sm:w-20 text-white" />
                     </div>
                     <h5 className="text-white font-black uppercase italic tracking-tighter text-xl sm:text-2xl mb-3 sm:mb-4 relative z-10">Neural Pulse Test</h5>
                     <p className="text-white/70 text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-6 sm:mb-8 leading-none relative z-10">Instant intelligence verification module.</p>
                     <Link 
                       to={`/quiz/${activeLesson.id}?difficulty=${difficulty}&format=${format}`}
                       className="block w-full py-4 sm:py-5 bg-white text-brand rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs shadow-xl active:scale-[1.02] transition-all relative z-10"
                     >
                       Begin Analysis Stream
                     </Link>
                  </div>
              </div>
           ) : (
              <div className="lg:sticky lg:top-24 bg-bg-card border-2 border-dashed border-border-strong rounded-3xl sm:rounded-[40px] p-12 sm:p-20 text-center">
                 <div className="w-16 h-16 sm:w-20 sm:h-20 bg-brand/5 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 border border-brand/10">
                    <Play className="h-6 w-6 sm:h-8 sm:w-8 text-brand/40" />
                 </div>
                 <h4 className="text-base sm:text-lg font-black uppercase italic tracking-tighter text-muted">Awaiting Selection</h4>
                 <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-muted/60 mt-4 leading-relaxed">Select a lesson from the syllabus index to begin synchronization.</p>
              </div>
           )}

           <div className="bg-bg-surface p-6 sm:p-10 rounded-3xl sm:rounded-[32px] border border-border-strong space-y-8 sm:space-y-10">
              <div>
                <h5 className="text-[11px] sm:text-xs font-black uppercase italic tracking-tighter text-main mb-5 sm:mb-6 flex items-center gap-3">
                  <Settings2 className="h-4 w-4 text-brand" /> Neural Sensitivity
                </h5>
                <div className="space-y-5 sm:space-y-6">
                  <div>
                    <label className="text-[9px] sm:text-[10px] font-black text-muted uppercase tracking-widest mb-3 block">Complexity Protocol</label>
                    <div className="flex gap-1.5 sm:gap-2 p-1 bg-bg-deep rounded-xl border border-border-strong">
                      {['easy', 'medium', 'hard'].map(d => (
                        <button
                          key={d} onClick={() => setDifficulty(d)}
                          className={cn(
                            "flex-1 py-2 sm:py-3 rounded-lg text-[9px] sm:text-[10px] font-black uppercase transition-all shadow-sm",
                            difficulty === d ? "bg-brand text-white" : "text-muted hover:text-main"
                          )}
                        >{d}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] sm:text-[10px] font-black text-muted uppercase tracking-widest mb-3 block">Data Stream Format</label>
                    <div className="flex flex-wrap gap-2">
                       {[
                         { id: 'mcq', label: 'MCQ' },
                         { id: 'tf', label: 'T/F' },
                         { id: 'short', label: 'Short' }
                       ].map(f => (
                         <button
                           key={f.id} onClick={() => setFormat(f.id)}
                           className={cn(
                             "px-3 sm:px-4 py-2 text-[9px] sm:text-[10px] font-black uppercase rounded-lg border transition-all",
                             format === f.id ? "bg-brand border-brand text-white" : "border-border-strong text-muted hover:border-brand/40"
                           )}
                         >{f.label}</button>
                       ))}
                    </div>
                  </div>
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
