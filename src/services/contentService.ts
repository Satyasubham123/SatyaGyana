import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  getDoc,
  setDoc,
  DocumentData
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Course {
  id: string;
  classLevel: string;
  subject: string;
  title: string;
  description: string;
  thumbnail: string;
  board?: string;
  isPublished?: boolean;
  isArchived?: boolean;
}

export interface Section {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  icon?: string;
  order: number;
}

export interface Playlist {
  id: string;
  sectionId: string;
  courseId: string;
  title: string;
  description?: string;
  thumbnail?: string;
  order: number;
}

export interface Lesson {
  id: string;
  playlistId: string;
  sectionId: string;
  courseId: string;
  title: string;
  type: 'video' | 'note' | 'quiz' | 'assignment';
  content?: string;
  videoUrl?: string;
  pdfUrl?: string;
  dueDate?: string;
  submissionInstructions?: string;
  order: number;
}

export interface Submission {
  id: string;
  userId: string;
  lessonId: string;
  content: string;
  submissionUrl?: string;
  submittedAt: any;
  score?: number;
  feedback?: string;
  status: 'pending' | 'graded';
}

export interface Quiz {
  id: string;
  moduleId: string;
  courseId: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  format: 'mcq' | 'tf' | 'short' | 'mixed';
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  type: 'mcq' | 'tf' | 'short';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface UserProgress {
  userId: string;
  courseId: string;
  sectionId: string;
  playlistId: string;
  lessonId: string;
  completed: boolean;
  lastWatchedAt: any;
}

export interface UserHistory {
  userId: string;
  courseId: string;
  lastViewedAt: any;
}

export interface QuizAttemptRecord {
  id?: string;
  userId: string;
  quizId: string;
  courseId: string;
  sectionId: string;
  playlistId: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  completedAt: any;
}

export const contentService = {
  // Save Student Quiz Attempts directly to Firestore permanently
  async saveQuizAttempt(record: Omit<QuizAttemptRecord, 'completedAt'>) {
    try {
      const attemptRef = collection(db, 'quizAttempts');
      await addDoc(attemptRef, {
        ...record,
        completedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error logging database quiz metrics entry node:", error);
    }
  },

  // User Progress & History
  async markLessonComplete(userId: string, lesson: Lesson) {
    const progressRef = doc(db, 'userProgress', `${userId}_${lesson.id}`);
    await setDoc(progressRef, {
      userId,
      courseId: lesson.courseId,
      sectionId: lesson.sectionId,
      playlistId: lesson.playlistId,
      lessonId: lesson.id,
      completed: true,
      lastWatchedAt: serverTimestamp()
    }, { merge: true });
  },

  async updateViewingHistory(userId: string, courseId: string) {
    const historyRef = doc(db, 'userHistory', `${userId}_${courseId}`);
    await setDoc(historyRef, {
      userId,
      courseId,
      lastViewedAt: serverTimestamp()
    }, { merge: true });
  },

  async getUserProgress(userId: string, courseId?: string) {
    let q = query(collection(db, 'userProgress'), where('userId', '==', userId));
    if (courseId) {
      q = query(q, where('courseId', '==', courseId));
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as UserProgress);
  },

  async getUserHistory(userId: string) {
    const q = query(
      collection(db, 'userHistory'), 
      where('userId', '==', userId),
      orderBy('lastViewedAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as UserHistory);
  },

  // Courses
  async getCourses(includeArchived = false) {
    const q = query(collection(db, 'courses'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const courses = snap.docs.map(d => ({ id: d.id, ...d.data() } as Course));
    return includeArchived ? courses : courses.filter(c => c.isArchived !== true);
  },

  async getCoursesByClass(classLevel: string) {
    const q = query(
      collection(db, 'courses'), 
      where('classLevel', '==', classLevel),
      where('isPublished', '==', true)
    );
    const snap = await getDocs(q);
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() } as Course))
      .filter(c => c.isArchived !== true);
  },

  async addCourse(course: Omit<Course, 'id'>) {
    const docRef = await addDoc(collection(db, 'courses'), {
      ...course,
      isPublished: course.isPublished ?? false,
      isArchived: course.isArchived ?? false,
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp()
    });
    return docRef.id;
  },

  async updateCourse(id: string, course: Partial<Course>) {
    await updateDoc(doc(db, 'courses', id), {
      ...course,
      lastUpdated: serverTimestamp()
    });
  },

  async deleteCourse(id: string) {
    await deleteDoc(doc(db, 'courses', id));
  },

  async duplicateCourse(courseId: string) {
    const courseSnap = await getDoc(doc(db, 'courses', courseId));
    if (!courseSnap.exists()) return null;
    const data = courseSnap.data();
    
    const newCourseId = await this.addCourse({
      ...data,
      title: `${data.title} (Copy)`,
      isPublished: false,
      isArchived: false
    } as any);

    const sections = await this.getSections(courseId);
    for (const sec of sections) {
      const { id: oldSecId, ...secData } = sec;
      const newSecId = await this.addSection(newCourseId, secData);
      
      const playlists = await this.getPlaylists(courseId, oldSecId);
      for (const pl of playlists) {
        const { id: oldPlId, ...plData } = pl;
        const newPlId = await this.addPlaylist(newCourseId, newSecId, plData);
        
        const lessons = await this.getLessons(courseId, oldSecId, oldPlId);
        for (const lesson of lessons) {
          const { id: oldLessonId, ...lessonData } = lesson;
          await this.addLesson(newCourseId, newSecId, newPlId, lessonData);
        }
      }
    }

    return newCourseId;
  },

  // Sections
  async getSections(courseId: string) {
    const q = query(
      collection(db, `courses/${courseId}/sections`), 
      orderBy('order', 'asc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, courseId, ...d.data() } as Section));
  },

  async addSection(courseId: string, section: Omit<Section, 'id' | 'courseId'>) {
    const docRef = await addDoc(collection(db, `courses/${courseId}/sections`), {
      ...section,
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp()
    });
    return docRef.id;
  },

  async updateSection(courseId: string, sectionId: string, section: Partial<Section>) {
    await updateDoc(doc(db, `courses/${courseId}/sections`, sectionId), {
      ...section,
      lastUpdated: serverTimestamp()
    });
  },

  async deleteSection(courseId: string, sectionId: string) {
    await deleteDoc(doc(db, `courses/${courseId}/sections`, sectionId));
  },

  // Playlists (formerly Modules)
  async getPlaylists(courseId: string, sectionId: string) {
    const q = query(
      collection(db, `courses/${courseId}/sections/${sectionId}/playlists`), 
      orderBy('order', 'asc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, courseId, sectionId, ...d.data() } as Playlist));
  },

  async addPlaylist(courseId: string, sectionId: string, playlist: Omit<Playlist, 'id' | 'courseId' | 'sectionId'>) {
    const docRef = await addDoc(collection(db, `courses/${courseId}/sections/${sectionId}/playlists`), {
      ...playlist,
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp()
    });
    return docRef.id;
  },

  async updatePlaylist(courseId: string, sectionId: string, playlistId: string, playlist: Partial<Playlist>) {
    await updateDoc(doc(db, `courses/${courseId}/sections/${sectionId}/playlists`, playlistId), {
      ...playlist,
      lastUpdated: serverTimestamp()
    });
  },

  async deletePlaylist(courseId: string, sectionId: string, playlistId: string) {
    await deleteDoc(doc(db, `courses/${courseId}/sections/${sectionId}/playlists`, playlistId));
  },

  // Lessons
  async getLessons(courseId: string, sectionId: string, playlistId: string) {
    const q = query(
      collection(db, `courses/${courseId}/sections/${sectionId}/playlists/${playlistId}/lessons`), 
      orderBy('order', 'asc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, courseId, sectionId, playlistId, ...d.data() } as Lesson));
  },

  async addLesson(courseId: string, sectionId: string, playlistId: string, lesson: Omit<Lesson, 'id' | 'courseId' | 'sectionId' | 'playlistId'>) {
    const docRef = await addDoc(collection(db, `courses/${courseId}/sections/${sectionId}/playlists/${playlistId}/lessons`), {
      ...lesson,
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp()
    });
    return docRef.id;
  },

  async updateLesson(courseId: string, sectionId: string, playlistId: string, lessonId: string, lesson: Partial<Lesson>) {
    await updateDoc(doc(db, `courses/${courseId}/sections/${sectionId}/playlists/${playlistId}/lessons`, lessonId), {
      ...lesson,
      lastUpdated: serverTimestamp()
    });
  },

  async deleteLesson(courseId: string, sectionId: string, playlistId: string, lessonId: string) {
    await deleteDoc(doc(db, `courses/${courseId}/sections/${sectionId}/playlists/${playlistId}/lessons`, lessonId));
  },

  async moveLesson(
    sourceCourseId: string, sourceSectionId: string, sourcePlaylistId: string, lessonId: string,
    targetCourseId: string, targetSectionId: string, targetPlaylistId: string
  ) {
    const lessonRef = doc(db, `courses/${sourceCourseId}/sections/${sourceSectionId}/playlists/${sourcePlaylistId}/lessons`, lessonId);
    const lessonSnap = await getDoc(lessonRef);
    if (!lessonSnap.exists()) throw new Error("Source lesson not found.");
    const lessonData = lessonSnap.data();

    await this.addLesson(targetCourseId, targetSectionId, targetPlaylistId, {
      ...lessonData,
      order: 99 
    } as any);

    await this.deleteLesson(sourceCourseId, sourceSectionId, sourcePlaylistId, lessonId);
  },

  // Quizzes
  async getQuizzes(courseId: string, moduleId: string) {
    const snap = await getDocs(collection(db, `courses/${courseId}/modules/${moduleId}/quizzes`));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Quiz));
  },

  async addQuiz(courseId: string, moduleId: string, quiz: Omit<Quiz, 'id' | 'courseId' | 'moduleId'>) {
    const docRef = await addDoc(collection(db, `courses/${courseId}/modules/${moduleId}/quizzes`), {
      ...quiz,
      courseId,
      moduleId,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  },

  async deleteQuiz(courseId: string, moduleId: string, quizId: string) {
    await deleteDoc(doc(db, `courses/${courseId}/modules/${moduleId}/quizzes`, quizId));
  },

  // Submissions
  async submitAssignment(submission: Omit<Submission, 'id' | 'submittedAt' | 'status'>) {
    const docRef = await addDoc(collection(db, 'submissions'), {
      ...submission,
      status: 'pending',
      submittedAt: serverTimestamp()
    });
    return docRef.id;
  },

  async getSubmissions(lessonId?: string, userId?: string) {
    let q = query(collection(db, 'submissions'), orderBy('submittedAt', 'desc'));
    if (lessonId) q = query(q, where('lessonId', '==', lessonId));
    if (userId) q = query(q, where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Submission));
  },

  async gradeSubmission(submissionId: string, grade: { score: number, feedback: string }) {
    await updateDoc(doc(db, 'submissions', submissionId), {
      ...grade,
      status: 'graded'
    });
  }
};