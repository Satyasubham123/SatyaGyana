import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, orderBy, limit, addDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { User } from 'firebase/auth';
import imageCompression from 'browser-image-compression';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'student' | 'admin' | 'teacher';
  createdAt: Date;
  updatedAt: Date;
  
  // Academic Data
  classLevel?: string;
  school?: string;
  medium?: string;
  learningGoals?: string[];
  
  // Personalization & Identity
  username?: string;
  bio?: string;
  interests?: string[];
  timezone?: string;
  state?: string;
  mood?: string;
  themeColor?: string;
  avatarUrl?: string;
  bannerUrl?: string;

  // Analytics
  xpPoints: number;
  totalXP?: number;
  level: number;
  streakCount: number;
  badges: string[];
  studyHours?: number;
  accuracy?: number;
  weakTopics?: string[];
}

export interface ActivitySignal {
  id: string;
  title: string;
  description: string;
  type: 'achievement' | 'learning' | 'system';
  timestamp: Date;
  read: boolean;
}

// 🚀 THESE ARE THE EXACT TWO EXPORTS YOUR AI TEACHER PAGE IS LOOKING FOR:
export type OperationType = 'read' | 'write' | 'update' | 'delete';

export function handleFirestoreError(error: any, operation: OperationType) {
  console.error(`[Firestore Error - ${operation}]:`, error);
  throw error;
}

export async function syncUserProfile(user: User): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    return snap.data() as UserProfile;
  } else {
    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      role: 'student',
      createdAt: new Date(),
      updatedAt: new Date(),
      xpPoints: 0,
      totalXP: 0,
      level: 1,
      streakCount: 0,
      badges: ['Newcomer'],
      studyHours: 0,
      accuracy: 0
    };
    await setDoc(userRef, newProfile);
    return newProfile;
  }
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { ...data, updatedAt: new Date() });
}

export async function uploadProfileImage(uid: string, file: File, type: 'avatar' | 'banner'): Promise<string> {
  const options = {
    maxSizeMB: type === 'avatar' ? 0.5 : 1,
    maxWidthOrHeight: type === 'avatar' ? 800 : 1920,
    useWebWorker: true,
  };
  const compressedFile = await imageCompression(file, options);

  const fileExt = compressedFile.name.split('.').pop();
  const storageRef = ref(storage, `users/${uid}/${type}_${Date.now()}.${fileExt}`);
  const uploadTask = await uploadBytesResumable(storageRef, compressedFile);
  
  const downloadURL = await getDownloadURL(uploadTask.ref);
  await updateUserProfile(uid, { [type === 'avatar' ? 'avatarUrl' : 'bannerUrl']: downloadURL });
  
  return downloadURL;
}

export async function getUserSignals(uid: string): Promise<ActivitySignal[]> {
  const signalsRef = collection(db, `users/${uid}/signals`);
  const q = query(signalsRef, orderBy('timestamp', 'desc'), limit(10));
  const snap = await getDocs(q);
  
  return snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp?.toDate() || new Date()
  })) as ActivitySignal[];
}

export async function addActivitySignal(
  uid: string, 
  title: string, 
  description: string, 
  type: 'achievement' | 'learning' | 'system'
) {
  try {
    const signalsRef = collection(db, `users/${uid}/signals`);
    await addDoc(signalsRef, {
      title,
      description,
      type,
      timestamp: new Date(),
      read: false
    });
  } catch (error) {
    console.error("Failed to push signal:", error);
  }
}