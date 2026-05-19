import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, orderBy, limit, addDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { User } from 'firebase/auth';
import imageCompression from 'browser-image-compression';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
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

  isPremium: boolean;
  subscriptionPlan: 'trial' | 'active' | 'expired' | 'lifetime';
  trialEndsAt?: Date;
  subscriptionEndsAt?: Date;

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

const VIP_ACCOUNTS = ['biswalsatya321@gmail.com', 'biswalsatyasubham274@gmail.com'];
const ADMIN_ACCOUNT = 'biswalsatyasubham274@gmail.com';

const USER_EDITABLE_FIELDS: (keyof UserProfile)[] = [
  'displayName',
  'photoURL',
  'classLevel',
  'school',
  'medium',
  'learningGoals',
  'username',
  'bio',
  'interests',
  'timezone',
  'state',
  'mood',
  'themeColor',
  'avatarUrl',
  'bannerUrl',
  'xpPoints',
  'totalXP',
  'level',
  'streakCount',
  'badges',
  'studyHours',
  'accuracy',
  'weakTopics'
];

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function normalizeUserProfile(user: User, data: Partial<UserProfile>): UserProfile {
  const email = user.email ?? data.email ?? null;
  const isVip = email ? VIP_ACCOUNTS.includes(email) : false;
  const isAdmin = email === ADMIN_ACCOUNT;
  const now = new Date();

  return {
    uid: data.uid || user.uid,
    email,
    displayName: data.displayName ?? user.displayName ?? null,
    photoURL: data.photoURL ?? user.photoURL ?? null,
    role: isAdmin ? 'admin' : data.role || 'student',
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now,
    classLevel: data.classLevel,
    school: data.school,
    medium: data.medium,
    learningGoals: data.learningGoals,
    username: data.username,
    bio: data.bio,
    interests: data.interests,
    timezone: data.timezone,
    state: data.state,
    mood: data.mood,
    themeColor: data.themeColor,
    avatarUrl: data.avatarUrl,
    bannerUrl: data.bannerUrl,
    isPremium: data.isPremium ?? isVip,
    subscriptionPlan: data.subscriptionPlan || (isVip ? 'lifetime' : 'trial'),
    trialEndsAt: data.trialEndsAt,
    subscriptionEndsAt: data.subscriptionEndsAt,
    xpPoints: data.xpPoints ?? 0,
    totalXP: data.totalXP ?? data.xpPoints ?? 0,
    level: data.level ?? 1,
    streakCount: data.streakCount ?? 0,
    badges: data.badges || ['Newcomer'],
    studyHours: data.studyHours ?? 0,
    accuracy: data.accuracy ?? 0,
    weakTopics: data.weakTopics
  };
}

export async function syncUserProfile(user: User): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);
  const now = new Date();
  const email = user.email ?? null;
  const isVip = email ? VIP_ACCOUNTS.includes(email) : false;
  const isAdmin = email === ADMIN_ACCOUNT;

  if (snap.exists()) {
    const existingData = snap.data() as Partial<UserProfile>;
    const protectedPatch: Partial<UserProfile> = {};

    if (isAdmin && existingData.role !== 'admin') {
      protectedPatch.role = 'admin';
    }

    if (isVip && existingData.subscriptionPlan !== 'lifetime') {
      protectedPatch.isPremium = true;
      protectedPatch.subscriptionPlan = 'lifetime';
    }

    if (Object.keys(protectedPatch).length > 0) {
      await updateDoc(userRef, { ...protectedPatch, updatedAt: now });
    }

    return normalizeUserProfile(user, { ...existingData, ...protectedPatch });
  } else {
    const trialEndsAt = addDays(now, 30);
    const newProfile: UserProfile = {
      uid: user.uid,
      email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      role: isAdmin ? 'admin' : 'student',
      createdAt: now,
      updatedAt: now,
      isPremium: isVip,
      subscriptionPlan: isVip ? 'lifetime' : 'trial',
      trialEndsAt,
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
  const updates: Partial<UserProfile> = {};

  for (const key of USER_EDITABLE_FIELDS) {
    const value = data[key];
    if (value !== undefined) {
      (updates as any)[key] = value;
    }
  }

  await updateDoc(userRef, { ...updates, updatedAt: new Date() });
}

export function checkActiveSubscription(profile: UserProfile | null): boolean {
  if (!profile) return false;
  if (profile.subscriptionPlan === 'lifetime') return true;

  if (profile.subscriptionPlan === 'trial' && profile.trialEndsAt) {
    const trialEnd = profile.trialEndsAt instanceof Date ? profile.trialEndsAt : (profile.trialEndsAt as any).toDate();
    return trialEnd > new Date();
  }

  if (profile.subscriptionPlan === 'active' && profile.subscriptionEndsAt) {
    const subEnd = profile.subscriptionEndsAt instanceof Date ? profile.subscriptionEndsAt : (profile.subscriptionEndsAt as any).toDate();
    return subEnd > new Date();
  }

  return false;
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
