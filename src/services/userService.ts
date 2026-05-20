import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, orderBy, limit, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User } from 'firebase/auth';
import imageCompression from 'browser-image-compression';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

export interface UserProfile {
  uid: string;
  email: string;
  // Structured Identity
  firstName?: string;
  middleName?: string;
  lastName?: string;
  displayName: string;
  photoURL?: string | null;
  role: 'student' | 'admin' | 'teacher';
  createdAt: Date;
  updatedAt: Date;
  
  // Mandatory Academic Data
  classLevel?: string;
  state?: string;
  
  // Optional Data
  school?: string;
  medium?: string;
  learningGoals?: string[];
  username?: string;
  bio?: string;
  interests?: string[];
  timezone?: string;
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

export type OperationType = 'read' | 'write' | 'update' | 'delete';

const ADMIN_ACCOUNT = 'biswalsatyasubham274@gmail.com';
const VIP_ACCOUNTS = ['biswalsatya321@gmail.com', ADMIN_ACCOUNT];

const USER_EDITABLE_FIELDS: (keyof UserProfile)[] = [
  'firstName', 'middleName', 'lastName', 'displayName',
  'photoURL', 'classLevel', 'school', 'medium', 'learningGoals', 
  'username', 'bio', 'interests', 'timezone', 'state', 'mood', 
  'themeColor', 'avatarUrl', 'bannerUrl', 'xpPoints', 'totalXP', 
  'level', 'streakCount', 'badges', 'studyHours', 'accuracy', 'weakTopics'
];

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Helper to safely normalize names
function normalizeName(data: Partial<UserProfile>, user: User) {
  if (data.firstName && data.lastName) return `${data.firstName} ${data.middleName || ''} ${data.lastName}`.replace(/\s+/g, ' ').trim();
  return data.displayName || user.displayName || 'Student';
}

export async function syncUserProfile(user: User): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);
  const now = new Date();
  const email = user.email ?? 'unknown@user.com';
  const isAdmin = email === ADMIN_ACCOUNT;
  const isVip = VIP_ACCOUNTS.includes(email);

  if (snap.exists()) {
    const data = snap.data() as UserProfile;
    return { ...data, ...data }; // Return existing
  } else {
    // Create Initial Profile
    const newProfile: UserProfile = {
      uid: user.uid,
      email,
      displayName: user.displayName || 'Student',
      photoURL: user.photoURL,
      role: isAdmin ? 'admin' : 'student',
      createdAt: now,
      updatedAt: now,
      isPremium: isVip,
      subscriptionPlan: isVip ? 'lifetime' : 'trial',
      trialEndsAt: addDays(now, 30),
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
    if (data[key] !== undefined) {
      (updates as any)[key] = data[key];
    }
  }

  await updateDoc(userRef, { ...updates, updatedAt: new Date() });
}

export const isProfileComplete = (profile: UserProfile | null): boolean => {
  if (!profile) return false;
  // Mandatory Checks
  return !!(
    profile.firstName && 
    profile.lastName && 
    profile.classLevel && 
    profile.state
  );
};

// --- SIGNAL SERVICES ---
export async function getUserSignals(uid: string): Promise<ActivitySignal[]> {
  const signalsRef = collection(db, `users/${uid}/signals`);
  const q = query(signalsRef, orderBy('timestamp', 'desc'), limit(10));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data(), timestamp: doc.data().timestamp?.toDate() || new Date() })) as ActivitySignal[];
}