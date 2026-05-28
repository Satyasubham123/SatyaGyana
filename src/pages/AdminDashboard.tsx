import React, { useState, useEffect } from 'react';
import.meta.env.VITE_API_URL
import { User as FirebaseUser } from 'firebase/auth';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { supabase } from '../lib/supabase'; // 🚀 ADDED SUPABASE IMPORT
import { UserProfile } from '../services/userService';
import * as contentService from '../services/contentServiceSupabase';
import { Course, Section, Playlist, Lesson, Submission } from '../services/contentService';import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Video, 
  Trash2, 
  Bell,
  Search,
  Shield,
  Sparkles,
  Trophy,
  ChevronRight,
  FolderOpen,
  Layers,
  BrainCircuit,
  Eye,
  PlusCircle,
  Zap,
  MoreVertical,
  Copy,
  Archive,
  Globe,
  Lock,
  ChevronDown,
  GripVertical,
  CheckCircle,
  FileText,
  Edit2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { founderService, FounderProfileData } from '../services/founderService';
import { FounderProfile } from '../components/FounderProfile';
import { BookUploader } from '../components/BookUploader';

interface AdminDashboardProps {
  user: FirebaseUser;
  profile: UserProfile | null;
}

type Tab = 'overview' | 'course-creation' | 'courses' | 'sections' | 'playlists' | 'lessons' | 'students' | 'notifications' | 'ai-quiz' | 'submissions' | 'quizzes' | 'founder' | 'books';

// 🚀 ADDED: Subjects and Branches for the Library Form

const CLASSES = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];

const SUBJECTS = [
  "English", "Odia", "Hindi", "Mathematics", "Science", 
  "Social Science", "Language IT", "General Knowledge", 
  "Moral Science", "Physical Education", "Art Education"
];

const SOCIAL_SCIENCE_BRANCHES = [
  "History", "Geography", "Political Science/Civics", "Economics"
];


export default function AdminDashboard({ profile }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isLoading, setIsLoading] = useState(true);
  
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>('');
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [editLessonId, setEditLessonId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'course'|'section'|'playlist'|'lesson', id: string, name: string, parentData?: any } | null>(null);
  const [isMovingLesson, setIsMovingLesson] = useState<Lesson | null>(null);
  const [moveTarget, setMoveTarget] = useState({ courseId: '', sectionId: '', playlistId: '' });
  
  // 🚀 UPDATED BOOKS STATE FOR SUPABASE
  const [books, setBooks] = useState<any[]>([]);
  const [bookForm, setBookForm] = useState({
    title: '',
    classLevel: '',
    subject: '',
    branch: '',
    coverUrl: '',
    pdfUrl: ''
  });
  
  const [founderForm, setFounderForm] = useState<FounderProfileData>({
    name: 'Satyasubham Biswal',
    title: 'Founder & Creator of SatyaGyana AI',
    mission: 'Empowering students with AI-driven personalized learning paths to achieve academic excellence.',
    bio: 'A visionary educator and developer dedicated to bridging the gap between artificial intelligence and classroom learning.',
    photoURL: 'https://example.com/new_founder_photo.jpg',
    socialLinks: {
      linkedin: 'https://www.linkedin.com/in/satyasubham-biswal',
      twitter: 'https://twitter.com'
    }
  });

  const [courseForm, setCourseForm] = useState({
    title: '',
    classLevel: 'Class 10',
    subject: 'Mathematics', // Updated to match your SUBJECTS array
    branch: '',             // 🚀 ADDED: Branch tracking
    description: '',
    thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd482755c?auto=format&fit=crop&q=80&w=400',
    board: 'CBSE',
    isPublished: false
  });

  const [sectionForm, setSectionForm] = useState({
    title: '',
    description: '',
    icon: 'book',
    order: 1
  });

  const [playlistForm, setPlaylistForm] = useState({
    title: '',
    description: '',
    thumbnail: '',
    order: 1
  });

  const [lessonForm, setLessonForm] = useState({
    title: '',
    type: 'video' as 'video' | 'note' | 'quiz' | 'assignment',
    videoUrl: '',
    pdfUrl: '',
    content: '',
    dueDate: '',
    submissionInstructions: '',
    order: 1
  });

  const [quizGenForm, setQuizGenForm] = useState({
    topic: '',
    classLevel: 'Class 10',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    format: 'mcq' as 'mcq' | 'true_false' | 'short_answer',
    targetCourseId: '',
    targetSectionId: '',
    targetPlaylistId: ''
  });
  const [generatedQuiz, setGeneratedQuiz] = useState<any[] | null>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

  const [targetSections, setTargetSections] = useState<Section[]>([]);
  const [targetPlaylists, setTargetPlaylists] = useState<Playlist[]>([]);

  useEffect(() => {
    if (quizGenForm.targetCourseId || moveTarget.courseId) {
      contentService.getSections(quizGenForm.targetCourseId || moveTarget.courseId).then(setTargetSections);
      if (quizGenForm.targetCourseId) setQuizGenForm(prev => ({ ...prev, targetSectionId: '', targetPlaylistId: '' }));
      if (moveTarget.courseId) setMoveTarget(prev => ({ ...prev, sectionId: '', playlistId: '' }));
    } else {
      setTargetSections([]);
    }
  }, [quizGenForm.targetCourseId, moveTarget.courseId]);

  useEffect(() => {
    const courseId = quizGenForm.targetCourseId || moveTarget.courseId;
    const sectionId = quizGenForm.targetSectionId || moveTarget.sectionId;
    if (courseId && sectionId) {
      contentService.getPlaylists(courseId, sectionId).then(setTargetPlaylists);
      if (quizGenForm.targetSectionId) setQuizGenForm(prev => ({ ...prev, targetPlaylistId: '' }));
      if (moveTarget.sectionId) setMoveTarget(prev => ({ ...prev, playlistId: '' }));
    } else {
      setTargetPlaylists([]);
    }
  }, [quizGenForm.targetSectionId, moveTarget.sectionId]);

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchInitialData();
    }
  }, [profile, activeTab]);

  useEffect(() => {
    if (selectedCourseId) {
      fetchSections(selectedCourseId);
    } else {
      setSections([]);
      setSelectedSectionId('');
    }
  }, [selectedCourseId]);

  useEffect(() => {
    if (selectedCourseId && selectedSectionId) {
      fetchPlaylists(selectedCourseId, selectedSectionId);
    } else {
      setPlaylists([]);
      setSelectedPlaylistId('');
    }
  }, [selectedSectionId]);

  useEffect(() => {
    if (selectedCourseId && selectedSectionId && selectedPlaylistId) {
      fetchLessons(selectedCourseId, selectedSectionId, selectedPlaylistId);
    } else {
      setLessons([]);
    }
  }, [selectedPlaylistId]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch from your Python Backend
      const token = localStorage.getItem('gyanamitra_token');
      const usersResponse = await fetch('http://localhost:8000/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const allUsers = usersResponse.ok ? await usersResponse.json() : [];
      const studentList = allUsers.filter((u: any) => u.role !== 'admin');

      // 2. Fetch the rest of your Firebase/Supabase stuff as normal
      const [_courses, _founder] = await Promise.all([
        contentService.getCourses(true), 
        founderService.getProfile()
      ]);

      setStudents(studentList);
      setCourses(_courses);
      if (_founder) setFounderForm(_founder);
    } catch (err) {
      console.error("Fetch Data Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSections = async (courseId: string) => {
    const data = await contentService.getSections(courseId);
    setSections(data);
  };

  const fetchPlaylists = async (courseId: string, sectionId: string) => {
    const data = await contentService.getPlaylists(courseId, sectionId);
    setPlaylists(data);
  };

  const fetchLessons = async (courseId: string, sectionId: string, playlistId: string) => {
    const data = await contentService.getLessons(courseId, sectionId, playlistId);
    setLessons(data);
  };

  const fetchSubmissions = async (lessonId?: string) => {
    setIsLoading(true);
    try {
      const data = await contentService.getSubmissions(lessonId);
      setSubmissions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGradeSubmission = async (e: React.FormEvent, submissionId: string) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const score = parseInt((form.elements.namedItem('score') as HTMLInputElement).value);
    const feedback = (form.elements.namedItem('feedback') as HTMLTextAreaElement).value;

    setIsProcessing(true);
    try {
      await contentService.gradeSubmission(submissionId, { score, feedback });
      await fetchSubmissions(selectedSubmission?.lessonId);
      setSelectedSubmission(null);
      alert("Evaluation Logged.");
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // 🚀 UPDATED: Fetch Books from SUPABASE
  const fetchSupabaseBooks = async () => {
  try {
    const { data, error } = await supabase.from('books').select('*');
    if (error) throw error;
    setBooks(data || []);
  } catch (err) {
    console.error("Error fetching books:", err);
  }
};

  // Run this once when the component loads to get existing books
  useEffect(() => {
    if (profile?.role === 'admin' && activeTab === 'books') {
      fetchSupabaseBooks();
    }
  }, [profile, activeTab]);

  // 🚀 UPDATED: Add Book to SUPABASE
  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      // Mapping the state (bookForm) to the Database columns
      const { error } = await supabase.from('books').insert([{
        title: bookForm.title,
        // If it's 'All', save 'All', otherwise clean the string
        class_level: bookForm.classLevel === 'All' ? 'All' : bookForm.classLevel.replace('Class ', ''),
        subject: bookForm.subject,
        branch: bookForm.branch || null, // Optional branch
        pdf_url: bookForm.pdfUrl,        // Mapped from state.pdfUrl
        cover_url: bookForm.coverUrl || ''
      }]);

      if (error) throw error;
      
      alert("Book successfully deployed to Supabase Library!");
      
      // Reset the state with the exact keys defined in your useState
      setBookForm({ 
        title: '', 
        classLevel: 'All', 
        subject: 'General', 
        branch: '', 
        coverUrl: '', 
        pdfUrl: '' 
      });
      
      fetchSupabaseBooks(); // Refresh the list
    } catch (err: any) {
      console.error(err); 
      alert("Error saving book: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };
  

  // 🚀 BULLETPROOF: Delete Book from SUPABASE (Storage & Database)
  const handleDeleteBook = async (book: any) => {
    if(!window.confirm("Are you sure you want to delete this book completely?")) return;
    setIsProcessing(true);
    try {
      // 1. Only try to delete from Storage if it's actually a Supabase file
      if (book.pdf_url && book.pdf_url.includes('supabase.co')) {
        const fileName = book.pdf_url.split('/').pop(); 
        if (fileName) {
          await supabase.storage.from('books').remove([fileName]);
        }
      }

      // 2. ALWAYS delete the record from the database, no matter what
      const { error } = await supabase.from('books').delete().eq('id', book.id);
      if (error) throw error;

      // 3. Refresh UI
      fetchSupabaseBooks();
    } catch (err: any) {
      console.error(err);
      alert("Error deleting book: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };
  

  const handleUpdateFounderProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      await founderService.updateProfile(founderForm);
      alert("Founder profile synchronized.");
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      if (editCourse) {
        await contentService.updateCourse(editCourse.id, courseForm);
        setEditCourse(null);
      } else {
        await contentService.addCourse(courseForm);
      }
      await fetchInitialData();
      setCourseForm({
        title: '',
        classLevel: 'Class 10',
        subject: 'Mathematics',
        branch: '',
        description: '',
        thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd482755c?auto=format&fit=crop&q=80&w=400',
        board: 'CBSE',
        isPublished: false
      });
      alert(editCourse ? "Course updated." : "Course registered.");
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditSection = (section: Section) => {
    setSectionForm({
      title: section.title,
      description: section.description || '',
      icon: section.icon || 'book',
      order: section.order
    });
    setEditingSectionId(section.id);
  };

  const handleUpdateSectionOrder = async (section: Section, direction: 'up' | 'down') => {
    const newOrder = direction === 'up' ? section.order - 1.5 : section.order + 1.5;
    await contentService.updateSection(selectedCourseId, section.id, { order: newOrder });
    await fetchSections(selectedCourseId);
  };

  const handleUpdatePlaylistOrder = async (playlist: Playlist, direction: 'up' | 'down') => {
    const newOrder = direction === 'up' ? playlist.order - 1.5 : playlist.order + 1.5;
    await contentService.updatePlaylist(selectedCourseId, selectedSectionId, playlist.id, { order: newOrder });
    await fetchPlaylists(selectedCourseId, selectedSectionId);
  };

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) return;
    setIsProcessing(true);
    try {
      if (editingSectionId) {
        await contentService.updateSection(selectedCourseId, editingSectionId, sectionForm);
        setEditingSectionId(null);
      } else {
        await contentService.addSection(selectedCourseId, sectionForm);
      }
      await fetchSections(selectedCourseId);
      setSectionForm({ title: '', description: '', icon: 'book', order: sections.length + 1 });
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddPlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !selectedSectionId) return;
    setIsProcessing(true);
    try {
      if (editingPlaylistId) {
        await contentService.updatePlaylist(selectedCourseId, selectedSectionId, editingPlaylistId, playlistForm);
        setEditingPlaylistId(null);
      } else {
        await contentService.addPlaylist(selectedCourseId, selectedSectionId, playlistForm);
      }
      await fetchPlaylists(selectedCourseId, selectedSectionId);
      setPlaylistForm({ title: '', description: '', thumbnail: '', order: playlists.length + 1 });
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateLessonOrder = async (lesson: Lesson, direction: 'up' | 'down') => {
    const newOrder = direction === 'up' ? lesson.order - 1.5 : lesson.order + 1.5;
    await contentService.updateLesson(selectedCourseId, selectedSectionId, selectedPlaylistId, lesson.id, { order: newOrder });
    await fetchLessons(selectedCourseId, selectedSectionId, selectedPlaylistId);
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !selectedSectionId || !selectedPlaylistId) return;
    setIsProcessing(true);
    try {
      if (editLessonId) {
        await contentService.updateLesson(selectedCourseId, selectedSectionId, selectedPlaylistId, editLessonId, lessonForm);
        setEditLessonId(null);
      } else {
        await contentService.addLesson(selectedCourseId, selectedSectionId, selectedPlaylistId, lessonForm);
      }
      await fetchLessons(selectedCourseId, selectedSectionId, selectedPlaylistId);
      setLessonForm({ ...lessonForm, title: '', videoUrl: '', pdfUrl: '', content: '', dueDate: '', submissionInstructions: '', order: lessons.length + 1 });
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditLesson = (lesson: Lesson) => {
    setEditLessonId(lesson.id);
    setLessonForm({
      title: lesson.title,
      type: lesson.type,
      videoUrl: lesson.videoUrl || '',
      pdfUrl: lesson.pdfUrl || '',
      content: lesson.content || '',
      dueDate: lesson.dueDate || '',
      submissionInstructions: lesson.submissionInstructions || '',
      order: lesson.order
    });
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleMoveLesson = async () => {
    if (!isMovingLesson || !moveTarget.playlistId) return;
    setIsProcessing(true);
    try {
      await contentService.moveLesson(
        isMovingLesson.courseId, isMovingLesson.sectionId, isMovingLesson.playlistId, isMovingLesson.id,
        moveTarget.courseId, moveTarget.sectionId, moveTarget.playlistId
      );
      await fetchLessons(selectedCourseId, selectedSectionId, selectedPlaylistId);
      setIsMovingLesson(null);
      alert("Asset redeployed to new thermal node.");
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;
    setIsProcessing(true);
    try {
      const { type, id } = confirmDelete;
      switch (type) {
        case 'course':
          await contentService.deleteCourse(id);
          setCourses(courses.filter(c => c.id !== id));
          if (selectedCourseId === id) setSelectedCourseId('');
          break;
        case 'section':
          await contentService.deleteSection(selectedCourseId, id);
          await fetchSections(selectedCourseId);
          break;
        case 'playlist':
          await contentService.deletePlaylist(selectedCourseId, selectedSectionId, id);
          await fetchPlaylists(selectedCourseId, selectedSectionId);
          break;
        case 'lesson':
          await contentService.deleteLesson(selectedCourseId, selectedSectionId, selectedPlaylistId, id);
          await fetchLessons(selectedCourseId, selectedSectionId, selectedPlaylistId);
          break;
      }
      setConfirmDelete(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteCourse = async (id: string, name: string) => {
    setConfirmDelete({ type: 'course', id, name });
  };

  const handleDuplicateCourse = async (id: string) => {
    setIsProcessing(true);
    try {
      await contentService.duplicateCourse(id);
      await fetchInitialData();
    } catch (err) { 
      console.error(err); 
    } finally { 
      setIsProcessing(false); 
    }
  };

  const handleGenerateAIQuiz = async () => {
    if (!quizGenForm.topic) return;
    setIsGeneratingQuiz(true);
    setGeneratedQuiz(null);
    try {
      const designPrompt = `Generate an array of exactly 20 quiz questions on the topic "${quizGenForm.topic}" suited for "${quizGenForm.classLevel}".
The target difficulty structure is "${quizGenForm.difficulty}" and the items should be built in the formatting code of "${quizGenForm.format}".

You must return a raw JSON array string containing exactly 20 question objects. Do not wrap the code inside markdown syntax like \`\`\`json. Return only the raw array data. 

Each object must follow this scheme exactly:
{
  "type": "${quizGenForm.format}",
  "question": "The string text of the question",
  "options": ${quizGenForm.format === 'mcq' ? '["Option A", "Option B", "Option C", "Option D"]' : '[]'},
  "correctAnswer": "The perfect answer string matching options or binary text True/False",
  "explanation": "A conceptual educational breakdown description of the core principle"
}`;

      // 🚀 1. Call Custom Python Backend instead of Google!
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: designPrompt,
          targetLanguage: "English",
          history: []
        })
      });

      if (!response.ok) {
        throw new Error(`Python Server returned code ${response.status}`);
      }

      // 🚀 2. Parse the response from Python
      const data = await response.json();
      let rawText = data.text || "[]";
      
      rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const parsedQuiz = JSON.parse(rawText);
      setGeneratedQuiz(Array.isArray(parsedQuiz) ? parsedQuiz : []);
      alert("Neural synthesis complete. Review active content array below.");
    } catch (err: any) {
      console.error("AI Quiz Gen Error:", err);
      alert(`Synthesis Failure: ${err.message || "Failed to establish AI payload connection."}`);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handlePublishGeneratedQuiz = async () => {
    if (!quizGenForm.targetCourseId || !quizGenForm.targetSectionId || !quizGenForm.targetPlaylistId || !generatedQuiz) {
      alert("Please select a target destination before publishing.");
      return;
    }

    setIsProcessing(true);
    try {
      await contentService.addLesson(
        quizGenForm.targetCourseId,
        quizGenForm.targetSectionId,
        quizGenForm.targetPlaylistId,
        {
          title: `AI Quiz: ${quizGenForm.topic}`,
          type: 'quiz',
          content: JSON.stringify(generatedQuiz),
          order: 99
        }
      );
      alert("Quiz successfully integrated into the student stream!");
      setGeneratedQuiz(null);
      setQuizGenForm(prev => ({ ...prev, topic: '' }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleArchiveCourse = async (id: string, isArchived: boolean) => {
    try {
      await contentService.updateCourse(id, { isArchived: !isArchived });
      await fetchInitialData();
    } catch (err) { console.error(err); }
  };

  const handleTogglePublish = async (id: string, isPublished: boolean) => {
    try {
      await contentService.updateCourse(id, { isPublished: !isPublished });
      await fetchInitialData();
    } catch (err) { console.error(err); }
  };

  const handleEditCourse = (course: Course) => {
    setEditCourse(course);
    setCourseForm({
      title: course.title,
      classLevel: course.classLevel,
      subject: course.subject,
      branch: (course as any).branch || '', // 🚀 ADDED: Load existing branch if it has one
      description: course.description,
      thumbnail: course.thumbnail,
      board: course.board || 'CBSE',
      isPublished: course.isPublished || false
    });
    setActiveTab('course-creation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-bg-deep">
        <div className="text-center p-12 bg-slate-900 border border-border-strong rounded-[40px] shadow-2xl">
          <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-500/20">
             <Shield className="h-12 w-12 text-red-500" />
          </div>
          <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white mb-4">Security Breach</h2>
          <p className="text-slate-400 font-medium uppercase tracking-[0.2em] text-xs">Administrative level clearances required.</p>
        </div>
      </div>
    );
  }

  // 🚀 REBUILT: Supabase Render Books View
  const renderBooks = () => (
  <div className="space-y-8">
    <div className="bg-slate-900 p-8 rounded-[32px] border border-border-strong shadow-2xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 border border-indigo-500/20">
          <BookOpen className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Digital Library Hub</h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Supabase Sync Active</p>
        </div>
      </div>

      <form onSubmit={handleAddBook} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 🚀 RESTORED BOOK TITLE FIELD */}
          <div className="space-y-2 lg:col-span-3">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">Book Title *</label>
            <input 
              type="text" placeholder="e.g. High School English Grammar" 
              value={bookForm.title} onChange={e => setBookForm({...bookForm, title: e.target.value})}
              className="w-full bg-slate-800 border border-border-strong p-4 rounded-xl text-white font-bold outline-none focus:border-brand"
              required
            />
          </div>
          
          {/* Target Class */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">Target Class *</label>
            <select 
              value={bookForm.classLevel} 
              onChange={e => setBookForm({...bookForm, classLevel: e.target.value})}
              className="w-full bg-slate-800 border border-border-strong p-4 rounded-xl text-white font-bold text-sm outline-none focus:border-indigo-500 appearance-none"
              required
            >
              <option value="">Select Class...</option>
              {['All Classes', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">Subject *</label>
            <select 
              value={bookForm.subject} 
              onChange={e => setBookForm({...bookForm, subject: e.target.value, branch: ''})}
              className="w-full bg-slate-800 border border-border-strong p-4 rounded-xl text-white font-bold text-sm outline-none focus:border-indigo-500 appearance-none"
              required
            >
              <option value="">Select Subject...</option>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Branch (Conditional) */}
          {bookForm.subject === 'Social Science' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">Branch *</label>
              <select 
                value={bookForm.branch} 
                onChange={e => setBookForm({...bookForm, branch: e.target.value})}
                className="w-full bg-slate-800 border border-border-strong p-4 rounded-xl text-white font-bold text-sm outline-none focus:border-indigo-500 appearance-none"
                required
              >
                <option value="">Select Branch...</option>
                {SOCIAL_SCIENCE_BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          )}

          <div className="space-y-2 lg:col-span-3">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">Cover Image URL</label>
            <input 
              type="url" placeholder="Optional image link..." 
              value={bookForm.coverUrl} onChange={e => setBookForm({...bookForm, coverUrl: e.target.value})}
              className="w-full bg-slate-800 border border-border-strong p-4 rounded-xl text-white font-bold outline-none focus:border-indigo-500 text-xs"
            />
          </div>

          <div className="space-y-2 lg:col-span-3">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">Upload PDF File *</label>
            <BookUploader onUploadSuccess={(url) => setBookForm({...bookForm, pdfUrl: url})} />
            <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-2 ml-4">
              {bookForm.pdfUrl ? "✅ File Ready for Deployment" : "Select a PDF to upload"}
            </p>
          </div>
        </div>

        <button 
          type="submit" disabled={isProcessing || !bookForm.pdfUrl}
          className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isProcessing ? <Zap className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
          Publish to Supabase Library
        </button>
      </form>
    </div>

    {/* Book List remains unchanged */}
  </div>
);

  const renderOverview = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          { label: 'Total Students', value: students.length, color: 'text-brand', icon: <Users /> },
          { label: 'System Courses', value: courses.length, color: 'text-emerald-500', icon: <Layers /> },
          { label: 'Neural Lessons', value: '1,204', color: 'text-violet-500', icon: <Video /> },
          { label: 'Uptime', value: '99.9%', color: 'text-orange-500', icon: <Zap className="h-4 w-4" /> },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-900 p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-border-strong group hover:border-brand/40 transition-all">
             <div className={cn("w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center mb-6", stat.color)}>
                {stat.icon}
             </div>
             <p className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest leading-none">{stat.label}</p>
             <p className="text-3xl sm:text-4xl font-black italic tracking-tighter text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-brand p-8 sm:p-10 rounded-[32px] sm:rounded-[40px] shadow-2xl shadow-brand/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-40 -mt-40 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
               <h3 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tighter text-white mb-4">Synchronize New Content</h3>
               <p className="text-white/80 font-medium text-sm mb-8 max-w-sm leading-loose">Initialize deployment of video lectures, PDF modules, and AI adaptive quizzes into the student stream.</p>
               <button 
                onClick={() => setActiveTab('courses')}
                className="w-full sm:w-auto bg-white text-brand px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:scale-105 active:scale-95 transition-all"
               >
                Open Payload Bays
               </button>
            </div>
         </div>

         <div className="bg-slate-900 p-8 sm:p-10 rounded-[32px] sm:rounded-[40px] border border-border-strong relative overflow-hidden group">
            <div className="relative z-10">
               <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-brand/10 rounded-2xl flex items-center justify-center">
                     <BrainCircuit className="h-6 w-6 text-brand" />
                  </div>
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">AI Health Status</h3>
               </div>
               <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-border-strong/50">
                     <span className="text-[10px] font-black uppercase text-slate-400">Teacher Engine</span>
                     <span className="flex items-center gap-2 text-emerald-500 font-black text-[10px]"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> OPTIMAL</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-border-strong/50">
                     <span className="text-[10px] font-black uppercase text-slate-400">Quiz Generator</span>
                     <span className="flex items-center gap-2 text-emerald-500 font-black text-[10px]"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> STABLE</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-border-strong/50">
                     <span className="text-[10px] font-black uppercase text-slate-400">Language Processor</span>
                     <span className="flex items-center gap-2 text-emerald-500 font-black text-[10px]"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> BILINGUAL SYNC</span>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );

  const renderCourseCreation = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900 p-10 rounded-[40px] border border-border-strong shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Sparkles className="w-32 h-32 text-brand" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand/10 rounded-2xl flex items-center justify-center">
                  <PlusCircle className="h-6 w-6 text-brand" />
                </div>
                <div>
                  <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">Course Creator</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Neural Content Synthesis</p>
                </div>
              </div>
              {editCourse && (
                <button 
                  onClick={() => {
                    setEditCourse(null);
                    setCourseForm({
                      title: '',
                      classLevel: 'Class 10',
                      subject: 'Mathematics', // 🚀 Capital 'M' to match your list
                      branch: '',             // 🚀 ADDED: Required to prevent the TypeScript error!
                      description: '',
                      thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd482755c?auto=format&fit=crop&q=80&w=400',
                      board: 'CBSE',
                      isPublished: false
               });
                    setActiveTab('courses');
                  }}
                  className="bg-slate-800 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all"
                >
                  Exit Edit Mode
                </button>
              )}
            </div>

            <form onSubmit={handleAddCourse} className="space-y-12">
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-border-strong pb-4">
                  <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Core Identity</h4>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">Deployment Name</label>
                    <input 
                      type="text" placeholder="e.g. Master Class: Calculus" 
                      value={courseForm.title} onChange={e => setCourseForm({...courseForm, title: e.target.value})}
                      className="w-full bg-slate-800 border border-border-strong p-6 rounded-[24px] text-white font-bold placeholder:text-slate-600 outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all" 
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">Curriculum Abstract</label>
                    <textarea 
                      placeholder="Describe the learning objectives and neural outcomes..."
                      value={courseForm.description} onChange={e => setCourseForm({...courseForm, description: e.target.value})}
                      className="w-full bg-slate-800 border border-border-strong p-6 rounded-[24px] text-white font-bold h-40 placeholder:text-slate-600 outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all resize-none"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-border-strong pb-4">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-500">
                    <Layers className="h-4 w-4" />
                  </div>
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Grid Classification</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">Target Tier</label>
                    <select 
                      value={courseForm.classLevel} onChange={e => setCourseForm({...courseForm, classLevel: e.target.value})}
                      className="w-full bg-slate-800 border border-border-strong p-5 rounded-2xl text-white font-black uppercase tracking-widest text-[11px] outline-none focus:border-brand transition-all appearance-none"
                    >
                      {['All',"Class 6", "Class 7", "Class 8", "Class 9", "Class 10"].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">Subject Node</label>
                    <select 
                      value={courseForm.subject} onChange={e => setCourseForm({...courseForm, subject: e.target.value, branch: ''})}
                      className="w-full bg-slate-800 border border-border-strong p-5 rounded-2xl text-white font-black uppercase tracking-widest text-[11px] outline-none focus:border-brand transition-all appearance-none"
                    >
                      {SUBJECTS.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">Branch Sub-Node</label>
                    <select 
                      value={courseForm.branch} onChange={e => setCourseForm({...courseForm, branch: e.target.value})}
                      className="w-full bg-slate-800 border border-border-strong p-5 rounded-2xl text-white font-black uppercase tracking-widest text-[11px] outline-none focus:border-brand transition-all appearance-none disabled:opacity-30 disabled:cursor-not-allowed"
                      disabled={courseForm.subject !== 'Social Science'}
                    >
                      <option value="">N/A</option>
                      {SOCIAL_SCIENCE_BRANCHES.map(b => <option key={b} value={b}>{b.toUpperCase()}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">Board Authority</label>
                  <select 
                    value={courseForm.board} onChange={e => setCourseForm({...courseForm, board: e.target.value})}
                    className="w-full bg-slate-800 border border-border-strong p-5 rounded-2xl text-white font-black uppercase tracking-widest text-[11px] outline-none focus:border-brand transition-all appearance-none"
                  >
                    {["CBSE", "ICSE", "Odisha Board", "State Board"].map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-border-strong pb-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <Globe className="h-4 w-4" />
                  </div>
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Assets & Launch</h4>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">Visual Asset URL</label>
                  <input 
                    type="url" placeholder="https://image-source.com/..." 
                    value={courseForm.thumbnail} onChange={e => setCourseForm({...courseForm, thumbnail: e.target.value})}
                    className="w-full bg-slate-800 border border-border-strong p-5 rounded-2xl text-white font-bold placeholder:text-slate-600 outline-none focus:border-brand"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">Deployment Status</label>
                  <div className="bg-slate-800/40 p-1 rounded-3xl border border-border-strong flex items-center h-[72px]">
                    <button 
                      type="button"
                      onClick={() => setCourseForm({...courseForm, isPublished: false})}
                      className={cn(
                        "flex-1 h-full rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                        !courseForm.isPublished ? "bg-white text-slate-900 shadow-xl" : "text-slate-500 hover:text-slate-300"
                      )}
                    >
                      <Lock className="h-3.5 w-3.5" />
                      Staging / Draft
                    </button>
                    <button 
                      type="button"
                      onClick={() => setCourseForm({...courseForm, isPublished: true})}
                      className={cn(
                        "flex-1 h-full rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                        courseForm.isPublished ? "bg-emerald-500 text-white shadow-xl shadow-emerald-500/20" : "text-slate-500 hover:text-slate-300"
                      )}
                    >
                      <Globe className="h-3.5 w-3.5" />
                      Live Broadcast
                    </button>
                  </div>
                </div>
              </div>

              <button 
                type="submit" disabled={isProcessing}
                className="w-full bg-brand text-white py-6 rounded-[32px] font-black uppercase tracking-widest text-sm shadow-xl shadow-brand/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 mt-8"
              >
                {isProcessing ? (
                  <Zap className="h-5 w-5 animate-spin" />
                ) : (
                  <CheckCircle className="h-5 w-5" />
                )}
                {editCourse ? 'Commit Neural Updates' : 'Finalize Module Entry'}
              </button>
            </form>
          </div>
        </div>

        {/* Live Preview Pane */}
        <div className="space-y-8">
          <div className="bg-slate-900/50 p-10 rounded-[40px] border border-border-strong border-dashed relative overflow-hidden h-full min-h-[600px]">
             <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                   <Eye className="h-4 w-4 text-slate-500" />
                   <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Neural Preview Engine</h4>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[10px] font-black uppercase text-emerald-500">Live Preview</span>
                </div>
             </div>

             <div className="max-w-sm mx-auto">
                <div className="bg-slate-900 rounded-[40px] border border-border-strong overflow-hidden shadow-2xl shadow-black/50 group">
                   <div className="relative h-60">
                      <img 
                        src={courseForm.thumbnail || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=800'} 
                        className="w-full h-full object-cover" 
                        alt="Preview" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />
                      <div className="absolute top-6 left-6">
                         <span className="px-4 py-2 bg-brand/90 backdrop-blur-md rounded-xl text-white text-[10px] font-black uppercase tracking-widest shadow-xl">
                           {courseForm.classLevel}
                         </span>
                      </div>
                   </div>
                   
                   <div className="p-8">
                      <div className="flex items-center gap-2 mb-4">
                         <span className="px-3 py-1 bg-slate-800 rounded-lg text-slate-400 text-[9px] font-black uppercase tracking-widest border border-border-strong">
                           {courseForm.subject}
                         </span>
                         <span className="px-3 py-1 bg-slate-800 rounded-lg text-slate-400 text-[9px] font-black uppercase tracking-widest border border-border-strong">
                           {courseForm.board}
                         </span>
                      </div>
                      
                      <h5 className="text-3xl font-black uppercase italic tracking-tighter text-white mb-4 line-clamp-2">
                        {courseForm.title || "Untethered Module"}
                      </h5>
                      
                      <p className="text-slate-500 text-xs font-medium leading-relaxed line-clamp-3 mb-8 h-18">
                        {courseForm.description || "Synthesize the course objectives and neural learning paths here..."}
                      </p>

                      <div className="pt-8 border-t border-border-strong flex items-center justify-between">
                         <div className="flex -space-x-2">
                            {[1,2,3].map(i => (
                              <div key={i} className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-900" />
                            ))}
                         </div>
                         <button className="text-[10px] font-black uppercase tracking-widest text-brand hover:text-white transition-colors flex items-center gap-2">
                           Initialize Link <ChevronRight className="h-3 w-3" />
                         </button>
                      </div>
                   </div>
                </div>

                <div className="mt-12 space-y-6">
                   <div className="bg-slate-800/30 p-6 rounded-3xl border border-border-strong flex items-start gap-4">
                      <div className="w-10 h-10 bg-brand/10 rounded-2xl flex items-center justify-center shrink-0">
                         <Shield className="h-5 w-5 text-brand" />
                      </div>
                      <div>
                         <h6 className="text-[10px] font-black uppercase tracking-widest text-white mb-1">Global Permissions</h6>
                         <p className="text-slate-500 text-[10px] leading-normal font-medium">This course will be visible to all students in the <span className="text-brand">{courseForm.classLevel}</span> tier upon deployment.</p>
                      </div>
                   </div>
                   
                   <div className="bg-slate-800/30 p-6 rounded-3xl border border-border-strong flex items-start gap-4">
                      <div className="w-10 h-10 bg-emerald-500/10 rounded-2xl flex items-center justify-center shrink-0">
                         <Globe className="h-5 w-5 text-emerald-500" />
                      </div>
                      <div>
                         <h6 className="text-[10px] font-black uppercase tracking-widest text-white mb-1">Status Report</h6>
                         <p className="text-slate-500 text-[10px] leading-normal font-medium">Deployment Status: <span className={courseForm.isPublished ? "text-emerald-500" : "text-brand"}>{courseForm.isPublished ? "LIVE / BROADCASTING" : "STAGED / DRAFT"}</span></p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCourses = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
        {courses.map(course => (
          <div key={course.id} className={cn(
            "bg-slate-900 rounded-[24px] sm:rounded-[32px] border transition-all overflow-hidden relative group",
            course.isArchived ? "border-slate-800 grayscale" : "border-border-strong hover:border-brand/40"
          )}>
             <img src={course.thumbnail} className="w-full h-40 sm:h-48 object-cover opacity-40 group-hover:opacity-70 transition-opacity" alt={course.title} />
             
             <div className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                   <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-brand/10 border border-brand/20 rounded-full text-brand text-[9px] sm:text-[10px] font-black uppercase tracking-widest">{course.classLevel}</span>
                        {course.isPublished ? (
                          <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-500 text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><Globe className="h-2.5 w-2.5" /> Published</span>
                        ) : (
                          <span className="px-3 py-1 bg-slate-500/10 border border-slate-500/20 rounded-full text-slate-500 text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><Lock className="h-2.5 w-2.5" /> Draft</span>
                        )}
                      </div>
                      {(course as any).lastUpdated && (
                        <span className="text-[9px] font-bold uppercase text-slate-600 tracking-widest ml-1">
                           Last Updated: {new Date((course as any).lastUpdated.toDate ? (course as any).lastUpdated.toDate() : (course as any).lastUpdated).toLocaleDateString()}
                        </span>
                      )}
                   </div>
                   <div className="flex gap-2 w-full sm:w-auto justify-end">
                      <button 
                        onClick={() => handleEditCourse(course)}
                        className="p-2 sm:p-2.5 bg-slate-800 text-slate-400 hover:text-brand transition-all rounded-xl"
                        title="Edit Course"
                      ><Edit2 className="h-4 w-4" /></button>
                      <button 
                        onClick={() => handleDuplicateCourse(course.id)}
                        className="p-2 sm:p-2.5 bg-slate-800 text-slate-400 hover:text-violet-500 transition-all rounded-xl"
                        title="Duplicate"
                      ><Copy className="h-4 w-4" /></button>
                      <button 
                        onClick={() => handleArchiveCourse(course.id, course.isArchived || false)}
                        className="p-2 sm:p-2.5 bg-slate-800 text-slate-400 hover:text-orange-500 transition-all rounded-xl"
                        title={course.isArchived ? "Unarchive" : "Archive"}
                      ><Archive className="h-4 w-4" /></button>
                       <button 
                         onClick={() => handleDeleteCourse(course.id, course.title)}
                         className="p-2 sm:p-2.5 bg-slate-800 text-slate-400 hover:text-red-500 transition-all rounded-xl"
                         title="Delete"
                       ><Trash2 className="h-4 w-4" /></button>
                   </div>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 bg-slate-800 rounded-xl flex items-center justify-center text-brand shrink-0">
                    <BookOpen className="h-5 sm:h-6 w-5 sm:w-6" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xl sm:text-2xl font-black uppercase italic tracking-tighter text-white truncate">{course.title}</h4>
                    <p className="text-slate-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">{course.subject} | {course.board}</p>
                  </div>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                   <button 
                      onClick={() => { setSelectedCourseId(course.id); setActiveTab('sections'); }}
                      className="flex-1 bg-slate-800 hover:bg-brand text-white py-4 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] transition-all flex items-center justify-center gap-2"
                   >
                     <FolderOpen className="h-3.5 sm:h-4 w-3.5 sm:w-4" /> Structure
                   </button>
                   <button 
                      onClick={() => handleTogglePublish(course.id, course.isPublished || false)}
                      className={cn(
                        "px-6 py-4 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] transition-all border",
                        course.isPublished ? "border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10" : "border-brand/20 text-brand hover:bg-brand/10"
                      )}
                   >
                     {course.isPublished ? 'Unpublish' : 'Publish'}
                   </button>
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSections = () => (
    <div className="space-y-8">
       <button onClick={() => setActiveTab('courses')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">
          <ChevronRight className="h-4 w-4 rotate-180" /> Back to Courses
       </button>

       <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-10 bg-slate-900 rounded-[32px] border border-border-strong">
          <div>
             <span className="text-[10px] font-black uppercase tracking-widest text-brand mb-2 block">Active Course Context</span>
             <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">
               {courses.find(c => c.id === selectedCourseId)?.title || "Select a Course First"}
             </h3>
          </div>
       </div>

       {selectedCourseId && (
         <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-5 bg-slate-900 p-8 rounded-3xl border border-border-strong h-fit">
               <h4 className="text-xl font-black uppercase italic tracking-tighter text-white mb-8">Create Section</h4>
               <form onSubmit={handleAddSection} className="space-y-6">
                  <input 
                    type="text" placeholder="Section Title (e.g. Physics)" 
                    value={sectionForm.title} onChange={e => setSectionForm({...sectionForm, title: e.target.value})}
                    className="w-full bg-slate-800 border border-border-strong p-4 rounded-xl text-white font-bold outline-none focus:border-brand"
                    required
                  />
                  <textarea 
                    placeholder="Brief description..." 
                    value={sectionForm.description} onChange={e => setSectionForm({...sectionForm, description: e.target.value})}
                    className="w-full bg-slate-800 border border-border-strong p-4 rounded-xl text-white font-bold h-24 outline-none focus:border-brand"
                  />
                  <div className="flex items-center gap-4">
                     <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Order</label>
                     <input 
                      type="number" value={sectionForm.order} onChange={e => setSectionForm({...sectionForm, order: parseInt(e.target.value)})}
                      className="w-20 bg-slate-800 border border-border-strong p-4 rounded-xl text-white font-black"
                     />
                  </div>
                  <button type="submit" className="w-full bg-brand text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">
                    {editingSectionId ? 'Synchronize Updates' : 'Authorize Section'}
                  </button>
               </form>
            </div>

            <div className="md:col-span-7 space-y-4">
               {sections.map((s, idx) => (
                 <div key={s.id} className="p-6 bg-slate-900 border border-border-strong rounded-2xl flex items-center justify-between group hover:border-brand/30 transition-all">
                    <div className="flex items-center gap-6">
                       <span className="text-4xl font-black italic text-slate-800 group-hover:text-brand/20 transition-colors">{(idx + 1).toString().padStart(2, '0')}</span>
                       <div>
                          <h5 className="text-lg font-black uppercase tracking-tighter text-white italic">{s.title}</h5>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{s.description?.slice(0, 50)}...</p>
                       </div>
                    </div>
                    <div className="flex gap-2">
                       <div className="flex flex-col gap-1 mr-4">
                          <button onClick={() => handleUpdateSectionOrder(s, 'up')} className="p-1 text-slate-500 hover:text-brand transition-colors"><ChevronDown className="h-4 w-4 rotate-180" /></button>
                          <button onClick={() => handleUpdateSectionOrder(s, 'down')} className="p-1 text-slate-500 hover:text-brand transition-colors"><ChevronDown className="h-4 w-4" /></button>
                       </div>
                       <button 
                        onClick={() => handleEditSection(s)}
                        className="p-3 bg-slate-800 text-slate-400 rounded-xl hover:text-brand transition-all"
                       ><Edit2 className="h-4 w-4" /></button>
                       <button 
                        onClick={() => { setSelectedSectionId(s.id); setActiveTab('playlists'); }}
                        className="p-3 bg-slate-800 text-brand rounded-xl hover:bg-brand hover:text-white transition-all shadow-lg"
                       ><ChevronRight className="h-5 w-5" /></button>
                       <button onClick={() => setConfirmDelete({ type: 'section', id: s.id, name: s.title })} className="p-3 bg-slate-800 text-slate-500 rounded-xl hover:text-red-500 transition-colors">
                          <Trash2 className="h-5 w-5" />
                       </button>
                    </div>
                 </div>
               ))}
               {sections.length === 0 && <div className="text-center py-20 bg-slate-800/10 border-2 border-dashed border-border-strong rounded-3xl text-slate-600 font-black uppercase tracking-widest text-xs">No Sections Detected</div>}
            </div>
         </div>
       )}
    </div>
  );

  const renderPlaylists = () => (
    <div className="space-y-8">
       <button onClick={() => setActiveTab('sections')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">
          <ChevronRight className="h-4 w-4 rotate-180" /> Back to Sections
       </button>

       <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-10 bg-slate-900 rounded-[32px] border border-border-strong">
          <div>
             <span className="text-[10px] font-black uppercase tracking-widest text-brand mb-2 block">Active Section Segment</span>
             <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">
               {sections.find(s => s.id === selectedSectionId)?.title || "Select a Section First"}
             </h3>
          </div>
       </div>

       {selectedSectionId && (
         <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-5 bg-slate-900 p-8 rounded-3xl border border-border-strong h-fit">
               <h4 className="text-xl font-black uppercase italic tracking-tighter text-white mb-8">Create Playlist</h4>
               <form onSubmit={handleAddPlaylist} className="space-y-6">
                  <input 
                    type="text" placeholder="Playlist Title (e.g. Newton's Laws)" 
                    value={playlistForm.title} onChange={e => setPlaylistForm({...playlistForm, title: e.target.value})}
                    className="w-full bg-slate-800 border border-border-strong p-4 rounded-xl text-white font-bold outline-none focus:border-brand"
                    required
                  />
                  <textarea 
                    placeholder="Brief description..." 
                    value={playlistForm.description} onChange={e => setPlaylistForm({...playlistForm, description: e.target.value})}
                    className="w-full bg-slate-800 border border-border-strong p-4 rounded-xl text-white font-bold h-24 outline-none focus:border-brand"
                  />
                  <input 
                    type="url" placeholder="Optional Thumbnail URL" 
                    value={playlistForm.thumbnail} onChange={e => setPlaylistForm({...playlistForm, thumbnail: e.target.value})}
                    className="w-full bg-slate-800 border border-border-strong p-4 rounded-xl text-white font-bold outline-none focus:border-brand"
                  />
                  <div className="flex items-center gap-4">
                     <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Order</label>
                     <input 
                      type="number" value={playlistForm.order} onChange={e => setPlaylistForm({...playlistForm, order: parseInt(e.target.value)})}
                      className="w-20 bg-slate-800 border border-border-strong p-4 rounded-xl text-white font-black"
                     />
                  </div>
                  <button type="submit" className="w-full bg-brand text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">
                    {editingPlaylistId ? 'Update Playlist' : 'Register Playlist'}
                  </button>
               </form>
            </div>

            <div className="md:col-span-7 space-y-4">
               {playlists.map((p, idx) => (
                 <div key={p.id} className="p-6 bg-slate-900 border border-border-strong rounded-2xl flex items-center justify-between group hover:border-brand/30 transition-all">
                    <div className="flex items-center gap-6">
                       {p.thumbnail ? (
                         <img src={p.thumbnail} alt={p.title} className="w-16 h-12 object-cover rounded-lg border border-border-strong" />
                       ) : (
                         <div className="w-16 h-12 bg-slate-800 rounded-lg flex items-center justify-center text-brand">
                            <FolderOpen className="h-5 w-5" />
                         </div>
                       )}
                       <div>
                          <h5 className="text-lg font-black uppercase tracking-tighter text-white italic">{p.title}</h5>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{p.description?.slice(0, 50)}...</p>
                       </div>
                    </div>
                    <div className="flex gap-2">
                       <div className="flex flex-col gap-1 mr-4">
                          <button onClick={() => handleUpdatePlaylistOrder(p, 'up')} className="p-1 text-slate-500 hover:text-brand transition-colors"><ChevronDown className="h-4 w-4 rotate-180" /></button>
                          <button onClick={() => handleUpdatePlaylistOrder(p, 'down')} className="p-1 text-slate-500 hover:text-brand transition-colors"><ChevronDown className="h-4 w-4" /></button>
                       </div>
                        <button 
                          onClick={() => {
                            setPlaylistForm({ title: p.title, description: p.description || '', thumbnail: p.thumbnail || '', order: p.order });
                            setEditingPlaylistId(p.id);
                          }}
                          className="p-3 bg-slate-800 text-slate-400 rounded-xl hover:text-brand transition-all"
                        ><Edit2 className="h-4 w-4" /></button>
                       <button 
                        onClick={() => { setSelectedPlaylistId(p.id); setActiveTab('lessons'); }}
                        className="p-3 bg-slate-800 text-brand rounded-xl hover:bg-brand hover:text-white transition-all shadow-lg"
                       ><ChevronRight className="h-5 w-5" /></button>
                       <button onClick={() => setConfirmDelete({ type: 'playlist', id: p.id, name: p.title })} className="p-3 bg-slate-800 text-slate-500 rounded-xl hover:text-red-500 transition-colors">
                          <Trash2 className="h-5 w-5" />
                       </button>
                    </div>
                 </div>
               ))}
               {playlists.length === 0 && <div className="text-center py-20 bg-slate-800/10 border-2 border-dashed border-border-strong rounded-3xl text-slate-600 font-black uppercase tracking-widest text-xs">No Playlists Detected</div>}
            </div>
         </div>
       )}
    </div>
  );

  const renderLessons = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <button onClick={() => setActiveTab('playlists')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">
            <ChevronRight className="h-4 w-4 rotate-180" /> Back to Playlists
        </button>
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-brand animate-ping" />
           <span className="text-[10px] font-black uppercase tracking-widest text-brand">Asset Deployment Mode</span>
        </div>
      </div>

       <div className="p-10 bg-slate-900 rounded-[40px] border border-border-strong relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <Video className="w-40 h-40 text-brand" />
          </div>
          <div className="relative z-10">
            <span className="text-[10px] font-black uppercase tracking-widest text-brand mb-2 block">Active Playlist Segment</span>
            <h3 className="text-4xl font-black uppercase italic tracking-tighter text-white">
              {playlists.find(p => p.id === selectedPlaylistId)?.title || "Unknown Playlist"}
            </h3>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">{lessons.length} Integrated Assets</p>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-12 xl:col-span-5 space-y-6">
               <div className="bg-slate-900 p-8 rounded-[40px] border border-border-strong shadow-xl">
                  <div className="flex items-center justify-between mb-8">
                    <h4 className="text-xl font-black uppercase italic tracking-tighter text-white">
                      {editLessonId ? 'Modify Strategy' : 'Deploy Lesson Asset'}
                    </h4>
                    {editLessonId && (
                      <button 
                        onClick={() => {
                          setEditLessonId(null);
                          setLessonForm({ ...lessonForm, title: '', videoUrl: '', pdfUrl: '', content: '' });
                        }}
                        className="text-[10px] font-black uppercase tracking-widest text-brand"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleAddLesson} className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">Asset Label</label>
                        <input 
                          type="text" placeholder="e.g. Master Class: Calculus" 
                          value={lessonForm.title} onChange={e => setLessonForm({...lessonForm, title: e.target.value})}
                          className="w-full bg-slate-800 border border-border-strong p-4 rounded-2xl text-white font-bold outline-none focus:border-brand"
                          required
                        />
                     </div>

                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">Deployment Vector</label>
                        <div className="flex gap-2 p-1 bg-slate-800 rounded-2xl border border-border-strong">
                           {(['video', 'note', 'quiz', 'assignment'] as const).map(type => (
                             <button
                               key={type} type="button" onClick={() => setLessonForm({...lessonForm, type})}
                               className={cn(
                                 "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                 lessonForm.type === type ? "bg-brand text-white shadow-lg shadow-brand/20" : "text-slate-500 hover:text-slate-300"
                               )}
                             >{type}</button>
                           ))}
                        </div>
                     </div>

                     {lessonForm.type === 'video' && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-4">
                           <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">Video Stream URL</label>
                           <input 
                             type="url" placeholder="YouTube or G-Drive Link" 
                             value={lessonForm.videoUrl} onChange={e => setLessonForm({...lessonForm, videoUrl: e.target.value})}
                             className="w-full bg-slate-800 border border-border-strong p-4 rounded-2xl text-white font-bold outline-none focus:border-brand"
                             required
                        />
                        </div>
                     )}

                     {(lessonForm.type === 'note' || lessonForm.type === 'quiz' || lessonForm.type === 'assignment') && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-4">
                           <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">External Asset Link</label>
                           <input 
                             type="url" placeholder="PDF or External Resource URL" 
                             value={lessonForm.pdfUrl} onChange={e => setLessonForm({...lessonForm, pdfUrl: e.target.value})}
                             className="w-full bg-slate-800 border border-border-strong p-4 rounded-2xl text-white font-bold outline-none focus:border-brand"
                           />
                        </div>
                     )}

                     {(lessonForm.type === 'note' || lessonForm.type === 'quiz' || lessonForm.type === 'assignment') && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-4">
                           <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">Integrated Content (Markdown)</label>
                           <textarea 
                             placeholder="Neural data input..." 
                             value={lessonForm.content} onChange={e => setLessonForm({...lessonForm, content: e.target.value})}
                             className="w-full bg-slate-800 border border-border-strong p-4 rounded-2xl text-white font-medium h-48 outline-none focus:border-brand resize-none"
                           />
                        </div>
                     )}

                     {lessonForm.type === 'assignment' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">Due Date & Time</label>
                              <input 
                                type="datetime-local" 
                                value={lessonForm.dueDate} onChange={e => setLessonForm({...lessonForm, dueDate: e.target.value})}
                                className="w-full bg-slate-800 border border-border-strong p-4 rounded-2xl text-white font-bold outline-none focus:border-brand"
                                required
                              />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">Submission Instructions</label>
                              <textarea 
                                placeholder="Detail the submission requirements, format, and grading rubric..." 
                                value={lessonForm.submissionInstructions} onChange={e => setLessonForm({...lessonForm, submissionInstructions: e.target.value})}
                                className="w-full bg-slate-800 border border-border-strong p-4 rounded-2xl text-white font-medium h-32 outline-none focus:border-brand resize-none"
                                required
                              />
                           </div>
                        </div>
                     )}

                     <div className="flex items-center gap-4 bg-slate-800/50 p-4 rounded-2xl border border-border-strong">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Sequence ID</label>
                        <input 
                         type="number" value={lessonForm.order} onChange={e => setLessonForm({...lessonForm, order: parseInt(e.target.value)})}
                         className="w-20 bg-slate-800 border border-border-strong p-4 rounded-xl text-white font-black outline-none focus:border-brand"
                        />
                     </div>

                     <button 
                       type="submit" disabled={isProcessing}
                       className="w-full bg-brand text-white py-5 rounded-[24px] font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                     >
                        {isProcessing ? <Zap className="h-4 w-4 animate-spin" /> : (editLessonId ? <Archive className="h-4 w-4" /> : <Zap className="h-4 w-4" />)}
                        {editLessonId ? 'Synchronize Updates' : 'Launch Asset Payload'}
                     </button>
                  </form>
               </div>
          </div>

          <div className="lg:col-span-12 xl:col-span-7 space-y-4">
             {lessons.map((lesson, idx) => (
                <div key={lesson.id} className="p-8 bg-slate-900 rounded-[32px] border border-border-strong flex flex-col sm:flex-row items-center justify-between group hover:border-brand/40 transition-all shadow-lg">
                   <div className="flex items-center gap-6 w-full sm:w-auto mb-4 sm:mb-0">
                      <div className="text-4xl font-black italic text-slate-800 pointer-events-none group-hover:text-brand/10 transition-colors">
                        {(idx + 1).toString().padStart(2, '0')}
                      </div>
                      <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-brand border border-border-strong group-hover:bg-brand group-hover:text-white transition-all">
                         {lesson.type === 'video' ? <Video className="h-6 w-6" /> : (lesson.type === 'quiz' ? <BrainCircuit className="h-6 w-6" /> : <FileText className="h-6 w-6" />)}
                      </div>
                      <div>
                         <h5 className="text-xl font-black text-white uppercase tracking-tighter italic leading-none mb-2">{lesson.title}</h5>
                         <div className="flex items-center gap-3">
                            <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest bg-slate-800 px-2 py-0.5 rounded border border-border-strong">{lesson.type}</span>
                            <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">SEQ: {lesson.order}</span>
                         </div>
                      </div>
                   </div>
                   <div className="flex gap-2 w-full sm:w-auto">
                        <div className="flex flex-col gap-1 mr-4">
                           <button onClick={() => handleUpdateLessonOrder(lesson, 'up')} className="p-1 text-slate-500 hover:text-brand transition-colors"><ChevronDown className="h-4 w-4 rotate-180" /></button>
                           <button onClick={() => handleUpdateLessonOrder(lesson, 'down')} className="p-1 text-slate-500 hover:text-brand transition-colors"><ChevronDown className="h-4 w-4" /></button>
                        </div>
                        <button 
                          onClick={() => handleEditLesson(lesson)}
                          className="p-4 bg-slate-800 text-slate-400 hover:text-brand transition-all rounded-[18px] border border-border-strong"
                          title="Edit Blueprint"
                        ><Edit2 className="h-5 w-5" /></button>
                        {lesson.type === 'assignment' && (
                          <button 
                            onClick={() => { fetchSubmissions(lesson.id); setActiveTab('submissions'); }}
                            className="p-4 bg-brand/10 text-brand hover:bg-brand hover:text-white transition-all rounded-[18px] border border-brand/20"
                            title="View Submissions"
                          ><Users className="h-5 w-5" /></button>
                        )}
                        <button 
                          onClick={() => setIsMovingLesson(lesson)}
                          className="p-4 bg-slate-800 text-slate-400 hover:text-violet-500 transition-all rounded-[18px] border border-border-strong"
                          title="Redeploy Asset (Move)"
                        ><GripVertical className="h-5 w-5" /></button>
                        {(lesson.videoUrl || lesson.pdfUrl) && (
                          <a 
                            href={lesson.videoUrl || lesson.pdfUrl} target="_blank" rel="noreferrer" 
                            className="p-4 bg-slate-800 text-slate-400 hover:text-brand transition-all rounded-[18px] border border-border-strong"
                            title="Preview Asset"
                          ><Eye className="h-5 w-5" /></a>
                        )}
                        <button 
                          onClick={() => setConfirmDelete({ type: 'lesson', id: lesson.id, name: lesson.title })} 
                          className="p-4 bg-slate-800 text-slate-500 hover:text-red-500 transition-all rounded-[18px] border border-border-strong"
                          title="Terminate Asset"
                        ><Trash2 className="h-5 w-5" /></button>
                   </div>
                </div>
             ))}
             {lessons.length === 0 && (
               <div className="py-32 text-center bg-slate-800/10 border-2 border-dashed border-border-strong rounded-[40px]">
                  <Archive className="h-12 w-12 text-slate-800 mx-auto mb-6" />
                  <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-700">Payload Bay Empty</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-800 mt-2">Awaiting Neural Asset Deployment...</p>
               </div>
             )}
          </div>
       </div>
    </div>
  );

  const renderSubmissions = () => (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button onClick={() => setActiveTab('lessons')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors w-fit">
            <ChevronRight className="h-4 w-4 rotate-180" /> Back to Lessons
        </button>
        <h3 className="text-xl sm:text-2xl font-black uppercase italic tracking-tighter text-white">Evaluation Portal</h3>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 sm:gap-8">
        <div className="lg:col-span-12 xl:col-span-8 space-y-4">
           {submissions.map((sub) => (
             <div key={sub.id} className="p-6 sm:p-8 bg-slate-900 rounded-3xl sm:rounded-[32px] border border-border-strong flex flex-col sm:flex-row items-center justify-between gap-6 group hover:border-brand/40 transition-all shadow-lg">
                <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
                   <div className={cn(
                     "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-white shrink-0",
                     sub.status === 'graded' ? "bg-emerald-500 shadow-lg shadow-emerald-500/20" : "bg-brand animate-pulse shadow-lg shadow-brand/20"
                   )}>
                      <Users className="h-5 w-5 sm:h-6 sm:w-6" />
                   </div>
                   <div className="min-w-0">
                      <h5 className="font-black text-white uppercase tracking-tighter italic leading-none mb-2 truncate">Student ID: {sub.userId.substring(0, 8)}...</h5>
                      <div className="flex items-center gap-3">
                         <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest bg-slate-800 px-2 py-0.5 rounded border border-border-strong">{sub.status}</span>
                         <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">
                           {sub.submittedAt?.toDate ? new Date(sub.submittedAt.toDate()).toLocaleDateString() : new Date(sub.submittedAt).toLocaleDateString()}
                         </span>
                      </div>
                   </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                   <button 
                     onClick={() => setSelectedSubmission(sub)}
                     className="w-full sm:w-auto px-6 py-3 bg-slate-800 text-brand text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-brand hover:text-white transition-all shadow-xl whitespace-nowrap"
                   >Review Payload</button>
                </div>
             </div>
           ))}
           {submissions.length === 0 && (
             <div className="py-20 sm:py-32 text-center bg-slate-800/10 border-2 border-dashed border-border-strong rounded-3xl sm:rounded-[40px]">
                <Archive className="h-10 w-10 sm:h-12 sm:w-12 text-slate-800 mx-auto mb-6" />
                <h3 className="text-lg sm:text-xl font-black uppercase italic tracking-tighter text-slate-700">No Submissions Found</h3>
             </div>
           )}
        </div>

        <div className="lg:col-span-12 xl:col-span-4">
           <AnimatePresence mode="wait">
             {selectedSubmission ? (
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                 className="bg-slate-900 p-6 sm:p-8 rounded-3xl sm:rounded-[40px] border border-border-strong shadow-2xl space-y-6 sm:space-y-8"
               >
                  <div>
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand mb-4 block">Submission Data</span>
                     <div className="bg-slate-800/50 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-border-strong mb-6">
                        <p className="text-sm text-slate-300 font-medium leading-relaxed italic">"{selectedSubmission.content}"</p>
                     </div>
                     {selectedSubmission.submissionUrl && (
                        <a 
                          href={selectedSubmission.submissionUrl} target="_blank" rel="noreferrer"
                          className="flex items-center justify-center gap-2 w-full py-4 bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all border border-border-strong"
                        >
                           <Globe className="h-4 w-4" /> View Remote Asset
                        </a>
                     )}
                  </div>

                  <div>
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand mb-4 sm:mb-6 block">Evaluation Suite</span>
                     <form onSubmit={(e) => handleGradeSubmission(e, selectedSubmission.id)} className="space-y-4 sm:space-y-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">Neural Score (0-100)</label>
                           <input 
                             name="score" type="number" min="0" max="100" defaultValue={selectedSubmission.score || 0}
                             className="w-full bg-slate-800 border border-border-strong p-4 rounded-xl text-white font-black text-sm"
                             required
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">Evaluator Feedback</label>
                           <textarea 
                             name="feedback" defaultValue={selectedSubmission.feedback || ''}
                             className="w-full bg-slate-800 border border-border-strong p-4 rounded-xl text-white font-medium text-sm h-32 outline-none focus:border-brand resize-none"
                             required
                           ></textarea>
                        </div>
                        <button type="submit" disabled={isProcessing} className="w-full bg-brand text-white py-4 sm:py-5 rounded-2xl sm:rounded-[24px] font-black uppercase tracking-widest text-[10px] sm:text-xs shadow-xl active:scale-95 transition-all">
                           {isProcessing ? 'Synchronizing Grade...' : 'Finalize Review'}
                        </button>
                     </form>
                  </div>
               </motion.div>
             ) : (
               <div className="bg-slate-800/20 border-2 border-dashed border-border-strong p-12 sm:p-20 rounded-3xl sm:rounded-[40px] text-center">
                  <Eye className="h-8 w-8 sm:h-10 sm:w-10 text-slate-700 mx-auto mb-6 opacity-20" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">Select a payload for review</p>
               </div>
             )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );

  const renderFounderSettings = () => (
    <div className="space-y-8">
      <div className="bg-slate-900 p-6 sm:p-10 rounded-3xl sm:rounded-[40px] border border-border-strong shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Shield className="w-24 h-24 sm:w-32 sm:h-32 text-brand" />
        </div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-8 sm:mb-10">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand/10 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-brand" />
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tighter text-white">Founder Identity</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Public Authority Profile</p>
            </div>
          </div>

          <form onSubmit={handleUpdateFounderProfile} className="space-y-6 sm:space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                <div className="space-y-4 sm:space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">Legal Name</label>
                      <input 
                        type="text" value={founderForm.name} onChange={e => setFounderForm({...founderForm, name: e.target.value})}
                        className="w-full bg-slate-800 border border-border-strong p-4 sm:p-5 rounded-xl sm:rounded-2xl text-white font-bold text-sm sm:text-base outline-none focus:border-brand"
                        required
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">Professional Title</label>
                      <input 
                        type="text" value={founderForm.title} onChange={e => setFounderForm({...founderForm, title: e.target.value})}
                        className="w-full bg-slate-800 border border-border-strong p-4 sm:p-5 rounded-xl sm:rounded-2xl text-white font-bold text-sm sm:text-base outline-none focus:border-brand"
                        required
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">Identity Asset (Photo URL)</label>
                      <input 
                        type="url" value={founderForm.photoURL} onChange={e => setFounderForm({...founderForm, photoURL: e.target.value})}
                        className="w-full bg-slate-800 border border-border-strong p-4 sm:p-5 rounded-xl sm:rounded-2xl text-white font-bold text-sm sm:text-base outline-none focus:border-brand"
                        required
                      />
                   </div>
                </div>

                <div className="space-y-4 sm:space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">Mission Statement</label>
                      <textarea 
                        value={founderForm.mission} onChange={e => setFounderForm({...founderForm, mission: e.target.value})}
                        className="w-full bg-slate-800 border border-border-strong p-4 sm:p-5 rounded-xl sm:rounded-2xl text-white font-medium text-sm h-32 resize-none outline-none focus:border-brand"
                        required
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">Founder Biography</label>
                      <textarea 
                        value={founderForm.bio} onChange={e => setFounderForm({...founderForm, bio: e.target.value})}
                        className="w-full bg-slate-800 border border-border-strong p-4 sm:p-5 rounded-xl sm:rounded-2xl text-white font-medium text-sm h-32 resize-none outline-none focus:border-brand"
                        required
                      />
                   </div>
                </div>
             </div>

             <div className="bg-slate-800/50 p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-border-strong">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 block">Neural Social Nodes</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">LinkedIn</label>
                      <input 
                        type="url" value={founderForm.socialLinks.linkedin} onChange={e => setFounderForm({...founderForm, socialLinks: {...founderForm.socialLinks, linkedin: e.target.value}})}
                        className="w-full bg-slate-800 border border-border-strong p-4 rounded-xl text-white text-[10px] sm:text-xs font-bold outline-none focus:border-brand"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Twitter</label>
                      <input 
                        type="url" value={founderForm.socialLinks.twitter} onChange={e => setFounderForm({...founderForm, socialLinks: {...founderForm.socialLinks, twitter: e.target.value}})}
                        className="w-full bg-slate-800 border border-border-strong p-4 rounded-xl text-white text-[10px] sm:text-xs font-bold outline-none focus:border-brand"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">GitHub</label>
                      <input 
                        type="url" value={founderForm.socialLinks.github} onChange={e => setFounderForm({...founderForm, socialLinks: {...founderForm.socialLinks, github: e.target.value}})}
                        className="w-full bg-slate-800 border border-border-strong p-4 rounded-xl text-white text-[10px] sm:text-xs font-bold outline-none focus:border-brand"
                      />
                   </div>
                </div>
             </div>

             <button 
                type="submit" disabled={isProcessing}
                className="w-full sm:w-fit bg-brand text-white px-8 sm:px-16 py-4 sm:py-6 rounded-2xl sm:rounded-[32px] font-black uppercase tracking-widest text-[10px] sm:text-xs shadow-xl shadow-brand/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4"
             >
                {isProcessing ? <Zap className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                Synchronize Identity Matrix
             </button>
          </form>
        </div>
      </div>
    </div>
  );

  const renderAIQuizGenerator = () => (
    <div className="space-y-12">
      <div className="bg-slate-900 p-6 sm:p-10 rounded-3xl sm:rounded-[40px] border border-border-strong shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 sm:p-12 opacity-10">
          <BrainCircuit className="w-32 h-32 sm:w-48 sm:h-48 text-brand" />
        </div>
        
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-8 sm:mb-12">
             <div className="w-12 h-12 sm:w-16 sm:h-16 bg-brand/10 rounded-2xl sm:rounded-3xl flex items-center justify-center border border-brand/20 shrink-0">
                <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-brand" />
             </div>
             <div>
                <h3 className="text-2xl sm:text-4xl font-black uppercase italic tracking-tighter text-white">Neural Quiz Synthesis</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] text-brand">Adaptive Assessment Engine: High-Thinking v2.5</p>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="md:col-span-2 space-y-6 sm:space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">Knowledge Topic</label>
                <input 
                  type="text" placeholder="e.g. Master Class: Calculus Foundations" 
                  value={quizGenForm.topic} onChange={e => setQuizGenForm({...quizGenForm, topic: e.target.value})}
                  className="w-full bg-slate-800 border border-border-strong p-5 sm:p-6 rounded-2xl text-white font-bold text-sm sm:text-base outline-none focus:border-brand transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">Target Sector</label>
                  <select 
                    value={quizGenForm.classLevel} onChange={e => setQuizGenForm({...quizGenForm, classLevel: e.target.value})}
                    className="w-full bg-slate-800 border border-border-strong p-5 rounded-2xl text-white font-bold text-xs sm:text-sm outline-none focus:border-brand appearance-none"
                  >
                    {['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">Difficulty Vector</label>
                  <select 
                    value={quizGenForm.difficulty} onChange={e => setQuizGenForm({...quizGenForm, difficulty: e.target.value as any})}
                    className="w-full bg-slate-800 border border-border-strong p-5 sm:p-6 rounded-2xl text-white font-bold text-xs sm:text-sm outline-none focus:border-brand appearance-none"
                  >
                    <option value="easy">Core Basics</option>
                    <option value="medium">Standard Analysis</option>
                    <option value="hard">Advanced Mastery</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 space-y-6 sm:space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">Deployment Format</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 p-2 bg-slate-800 rounded-2xl border border-border-strong">
                  {([
                    { id: 'mcq', label: 'MCQ (Multi)' },
                    { id: 'true_false', label: 'TF (Binary)' },
                    { id: 'short_answer', label: 'SHORT (Text)' }
                  ] as const).map(f => (
                    <button
                      key={f.id} type="button" onClick={() => setQuizGenForm({...quizGenForm, format: f.id})}
                      className={cn(
                        "py-3 sm:py-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                        quizGenForm.format === f.id ? "bg-brand text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                      )}
                    >{f.label}</button>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleGenerateAIQuiz} disabled={isGeneratingQuiz || !quizGenForm.topic}
                className="w-full h-16 sm:h-20 bg-brand text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] sm:text-xs shadow-2xl shadow-brand/20 active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50 mt-auto"
              >
                {isGeneratingQuiz ? (
                  <Zap className="h-5 w-5 animate-spin" />
                ) : (
                  <BrainCircuit className="h-5 w-5" />
                )}
                {isGeneratingQuiz ? 'Synthesizing Neural Map...' : 'Trigger Synaptic Synthesis'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {generatedQuiz && (
          <motion.div 
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
            className="space-y-8 sm:space-y-12"
          >
            <div className="bg-slate-900 border border-border-strong p-6 sm:p-10 rounded-3xl sm:rounded-[40px] shadow-2xl relative overflow-hidden">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 sm:gap-8 mb-8 sm:mb-12">
                  <div>
                    <h4 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tighter text-white mb-2">Review & Deployment</h4>
                    <p className="text-slate-500 text-[9px] sm:text-[10px] font-black uppercase tracking-widest italic">Review the synthesized dataset before target integration.</p>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setGeneratedQuiz(null)}
                      className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-slate-800 text-slate-400 rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all border border-border-strong"
                    >Discard Bundle</button>
                  </div>
               </div>

               <div className="bg-slate-800/40 p-6 sm:p-10 rounded-[28px] sm:rounded-[32px] border-2 border-dashed border-border-strong mb-8 sm:mb-12">
                  <div className="flex items-center gap-3 mb-6 sm:mb-8">
                    <Archive className="h-4 w-4 text-brand" />
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">Target Integration Protocol</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                    <div className="space-y-3 sm:space-y-4">
                       <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">Destination Course</label>
                       <select 
                         value={quizGenForm.targetCourseId} onChange={e => setQuizGenForm({...quizGenForm, targetCourseId: e.target.value})}
                         className="w-full bg-slate-900 border border-border-strong p-4 sm:p-5 rounded-2xl text-white font-bold text-[10px] sm:text-xs outline-none focus:border-brand appearance-none"
                       >
                         <option value="">Select Target...</option>
                         {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                       </select>
                    </div>
                    <div className="space-y-3 sm:space-y-4">
                       <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">Destination Section</label>
                       <select 
                         value={quizGenForm.targetSectionId} onChange={e => setQuizGenForm({...quizGenForm, targetSectionId: e.target.value})}
                         className="w-full bg-slate-900 border border-border-strong p-4 sm:p-5 rounded-2xl text-white font-bold text-[10px] sm:text-xs outline-none focus:border-brand appearance-none"
                         disabled={!quizGenForm.targetCourseId}
                       >
                         <option value="">Select Section...</option>
                         {targetSections.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                       </select>
                    </div>
                    <div className="space-y-3 sm:space-y-4">
                       <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">Destination Playlist</label>
                       <select 
                         value={quizGenForm.targetPlaylistId} onChange={e => setQuizGenForm({...quizGenForm, targetPlaylistId: e.target.value})}
                         className="w-full bg-slate-900 border border-border-strong p-4 sm:p-5 rounded-2xl text-white font-bold text-[10px] sm:text-xs outline-none focus:border-brand appearance-none"
                         disabled={!quizGenForm.targetSectionId}
                       >
                         <option value="">Select Playlist...</option>
                         {targetPlaylists.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                       </select>
                    </div>
                  </div>

                  <button 
                    onClick={handlePublishGeneratedQuiz} disabled={isProcessing || !quizGenForm.targetPlaylistId}
                    className="w-full mt-8 sm:mt-10 bg-brand text-white py-5 sm:py-6 rounded-2xl sm:rounded-[24px] font-black uppercase tracking-widest text-[10px] sm:text-xs shadow-xl shadow-brand/20 active:scale-[1.01] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isProcessing ? <Zap className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                    Authorize Lesson Integration
                  </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                  {generatedQuiz.map((q, i) => (
                    <div key={i} className="bg-bg-deep border border-border-strong p-6 sm:p-10 rounded-3xl sm:rounded-[40px] hover:border-brand/30 transition-all group relative overflow-hidden shadow-xl">
                       <div className="absolute top-0 right-0 p-8 opacity-5 scale-125">
                         <Sparkles className="h-24 w-24 text-brand" />
                       </div>
                       
                       <div className="relative z-10">
                          <div className="flex items-center gap-4 mb-6 sm:mb-8">
                            <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center font-black text-brand italic text-xs sm:text-sm shadow-inner shadow-brand/5">{(i+1).toString().padStart(2, '0')}</span>
                            <span className="px-3 py-1 sm:px-4 sm:py-1.5 bg-slate-800 rounded-lg text-xs sm:text-[9px] font-black uppercase tracking-widest text-slate-500 border border-border-strong">{q.type}</span>
                          </div>
                          
                          <h5 className="text-lg sm:text-xl font-black uppercase italic tracking-tighter text-white mb-6 sm:mb-10 leading-tight">"{q.question}"</h5>
                          
                          {q.options && q.options.length > 0 && (
                            <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-10">
                               {q.options.map((opt: string, oi: number) => (
                                 <div key={oi} className={cn(
                                   "px-6 py-4 rounded-2xl border text-[10px] font-bold uppercase tracking-widest flex items-center gap-4 transition-all",
                                   opt === q.correctAnswer ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400" : "bg-slate-800/40 border-border-strong text-slate-500"
                                 )}>
                                   <div className={cn("w-2 h-2 rounded-full", opt === q.correctAnswer ? "bg-emerald-500 shadow-xl shadow-emerald-500/40 animate-pulse" : "bg-slate-700")} />
                                   {opt}
                                 </div>
                               ))}
                            </div>
                          )}

                          {(!q.options || q.options.length === 0) && (
                            <div className="p-8 bg-emerald-500/5 border border-emerald-500/20 rounded-[32px] mb-10">
                               <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest block mb-3">Model Accuracy Threshold</span>
                               <p className="text-white font-bold italic">"{q.correctAnswer}"</p>
                            </div>
                          )}

                          <div className="p-8 bg-slate-900 rounded-[32px] border border-border-strong/50">
                             <span className="text-[10px] font-black uppercase text-brand tracking-widest block mb-4 italic">Neural Insight Generator</span>
                             <p className="text-slate-400 text-sm italic font-medium leading-relaxed">"{q.explanation}"</p>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const renderStudents = () => (
    <div className="bg-slate-900 rounded-3xl sm:rounded-[40px] border border-border-strong overflow-hidden">
       <div className="p-6 sm:p-10 border-b border-border-strong flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
          <div>
             <h3 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tighter text-white">Student Registry</h3>
             <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">{students.length} Authorized Nodes detected</p>
          </div>
       </div>
       <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
             <thead className="bg-slate-800/50">
                <tr>
                   <th className="px-6 sm:px-10 py-4 sm:py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Student Identity</th>
                   <th className="px-6 sm:px-10 py-4 sm:py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Grade Level</th>
                   <th className="px-6 sm:px-10 py-4 sm:py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">State / UT</th>
                   <th className="px-6 sm:px-10 py-4 sm:py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Verification</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-border-subtle/20 text-white">
                {students.map((s: any) => (
                  <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                     <td className="px-6 sm:px-10 py-4 sm:py-6">
                        <div className="flex items-center gap-3 sm:gap-4">
                           <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-800 rounded-xl sm:rounded-2xl border border-border-strong flex items-center justify-center text-brand shrink-0">
                             <Users className="h-5 w-5" />
                           </div>
                           <div className="min-w-0">
                              <p className="font-black uppercase tracking-tighter italic text-base sm:text-lg truncate">{s.firstName} {s.lastName}</p>
                              <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold truncate">{s.email}</p>
                           </div>
                        </div>
                     </td>
                     <td className="px-6 sm:px-10 py-4 sm:py-6 whitespace-nowrap">
                        <span className="px-3 sm:px-4 py-1 sm:py-1.5 bg-slate-800 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest border border-border-strong">{s.classLevel || 'Sector Unset'}</span>
                     </td>
                     <td className="px-6 sm:px-10 py-4 sm:py-6 whitespace-nowrap">
                        <span className="px-3 py-1 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                           {s.state || 'Unknown'}
                        </span>
                     </td>
                     <td className="px-6 sm:px-10 py-4 sm:py-6 whitespace-nowrap">
                        {s.is_verified ? (
                          <span className="text-emerald-500 flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest"><CheckCircle className="h-4 w-4" /> Verified</span>
                        ) : (
                          <span className="text-slate-500 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Pending Email</span>
                        )}
                     </td>
                  </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );

  const renderModals = () => (
    <AnimatePresence>
      {confirmDelete && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-6"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            className="bg-slate-900 border border-border-strong p-10 rounded-[40px] max-w-md w-full shadow-2xl relative overflow-hidden"
          >
             <div className="absolute top-0 right-0 p-8 opacity-5">
                <Trash2 className="w-24 h-24 text-red-500" />
             </div>
             <div className="relative z-10 text-center">
                <div className="w-20 h-20 bg-red-500/10 rounded-[30px] flex items-center justify-center mx-auto mb-8 border border-red-500/20">
                   <Shield className="h-10 w-10 text-red-500" />
                </div>
                <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white mb-4">Confirm Termination</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed mb-10">
                  You are about to permanently delete <span className="text-white font-black">"{confirmDelete.name}"</span>. 
                  This action will orphan or delete all child nodes in the neural grid. Proceed with caution.
                </p>
                <div className="flex gap-4">
                   <button 
                    onClick={() => setConfirmDelete(null)}
                    className="flex-1 px-8 py-5 rounded-2xl bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all"
                   >Abort Action</button>
                   <button 
                    onClick={executeDelete}
                    disabled={isProcessing}
                    className="flex-1 px-8 py-5 rounded-2xl bg-red-500 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                   >
                     {isProcessing ? <Zap className="h-4 w-4 animate-spin" /> : 'Finalize Wipe'}
                   </button>
                </div>
             </div>
          </motion.div>
        </motion.div>
      )}

      {isMovingLesson && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-6"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-slate-900 border border-border-strong p-10 rounded-[40px] max-w-2xl w-full shadow-2xl relative overflow-hidden"
          >
             <div className="absolute top-0 right-0 p-8 opacity-5">
                <GripVertical className="w-32 h-32 text-brand" />
             </div>
             <div className="relative z-10">
                <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white mb-2">Redeploy Neural Asset</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-brand mb-8">Asset: {isMovingLesson.title}</p>
                
                <div className="space-y-6 mb-10">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">Target Course</label>
                         <select 
                            value={moveTarget.courseId} onChange={e => setMoveTarget({...moveTarget, courseId: e.target.value})}
                            className="w-full bg-slate-800 border border-border-strong p-5 rounded-2xl text-white font-bold text-xs outline-none focus:border-brand appearance-none"
                         >
                            <option value="">Select Vector...</option>
                            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                         </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">Target Section</label>
                         <select 
                            value={moveTarget.sectionId} onChange={e => setMoveTarget({...moveTarget, sectionId: e.target.value})}
                            className="w-full bg-slate-800 border border-border-strong p-5 rounded-2xl text-white font-bold text-xs outline-none focus:border-brand appearance-none"
                            disabled={!moveTarget.courseId}
                         >
                            <option value="">Select Segment...</option>
                            {targetSections.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                         </select>
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-4">Target Playlist Node</label>
                      <select 
                         value={moveTarget.playlistId} onChange={e => setMoveTarget({...moveTarget, playlistId: e.target.value})}
                         className="w-full bg-slate-800 border border-border-strong p-5 rounded-2xl text-white font-bold text-xs outline-none focus:border-brand appearance-none"
                         disabled={!moveTarget.sectionId}
                      >
                         <option value="">Select Terminal...</option>
                         {targetPlaylists.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                      </select>
                   </div>
                </div>

                <div className="flex gap-4">
                   <button 
                    onClick={() => setIsMovingLesson(null)}
                    className="flex-1 px-8 py-5 rounded-2xl bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all"
                   >Abort Redeployment</button>
                   <button 
                    onClick={handleMoveLesson}
                    disabled={isProcessing || !moveTarget.playlistId}
                    className="flex-1 px-8 py-5 rounded-2xl bg-brand text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                   >
                     {isProcessing ? <Zap className="h-4 w-4 animate-spin" /> : 'Authorize Transfer'}
                   </button>
                </div>
             </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen bg-bg-deep py-12 md:py-20 px-4">
      {renderModals()}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12 md:mb-16">
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
               <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center shadow-2xl shadow-brand/40">
                  <Shield className="h-4 w-4 text-white" />
               </div>
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand whitespace-nowrap">Admin Intelligence Hub</span>
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-black uppercase italic tracking-tighter text-white">Management</h1>
          </div>
          
          <div className="w-full lg:w-auto p-2 bg-slate-900 border border-border-strong rounded-[24px] sm:rounded-3xl flex gap-1 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth">
            {[
              { id: 'overview', icon: <LayoutDashboard className="h-4 w-4" />, label: 'Neural Web' },
              { id: 'course-creation', icon: <PlusCircle className="h-4 w-4" />, label: 'Creator' },
              { id: 'courses', icon: <Layers className="h-4 w-4" />, label: 'Vault' },
              { id: 'students', icon: <Users className="h-4 w-4" />, label: 'Students' },
              { id: 'books', icon: <BookOpen className="h-4 w-4" />, label: 'Library' },
              { id: 'ai-quiz', icon: <Sparkles className="h-4 w-4" />, label: 'AI Quiz' },
              { id: 'founder', icon: <Shield className="h-4 w-4" />, label: 'Founder' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={cn(
                  "flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] transition-all whitespace-nowrap shrink-0",
                  activeTab === tab.id || (tab.id === 'courses' && ['sections', 'playlists', 'lessons'].includes(activeTab))
                   ? "bg-brand text-white shadow-xl shadow-brand/20"
                   : "text-slate-500 hover:text-slate-300"
                )}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        <main>
           <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'overview' && (
                  <div className="space-y-12">
                    {renderOverview()}
                    <div className="pt-12 border-t border-border-strong">
                      <div className="flex items-center gap-4 mb-10">
                        <div className="w-12 h-12 bg-brand/10 rounded-2xl flex items-center justify-center">
                          <Shield className="h-6 w-6 text-brand" />
                        </div>
                        <div>
                          <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">Platform Identity Baseline</h3>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Global Founder Presence</p>
                        </div>
                      </div>
                      <FounderProfile />
                    </div>
                  </div>
                )}
                {activeTab === 'course-creation' && renderCourseCreation()}
                {activeTab === 'courses' && renderCourses()}
                {activeTab === 'sections' && renderSections()}
                {activeTab === 'playlists' && renderPlaylists()}
                {activeTab === 'lessons' && renderLessons()}
                {activeTab === 'students' && renderStudents()}
                {activeTab === 'submissions' && renderSubmissions()}
                {activeTab === 'ai-quiz' && renderAIQuizGenerator()}
                {activeTab === 'books' && renderBooks()}
                {activeTab === 'founder' && renderFounderSettings()}
                {(activeTab === 'notifications' || activeTab === 'quizzes') && (
                  <div className="py-40 text-center bg-slate-900 border-2 border-dashed border-border-strong rounded-[40px]">
                     <Sparkles className="h-12 w-12 text-brand mx-auto mb-6 opacity-20" />
                     <h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-700">Sector Under Development</h3>
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-800 mt-2 italic">Connecting Neural Bridge... 98% Synchronized</p>
                  </div>
                )}
              </motion.div>
           </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

// testing push   s