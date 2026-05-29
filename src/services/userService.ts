import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, orderBy, limit, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
// 🚀 FIXED: We remove the strict Firebase User import so we can accept your Python backend user

// --- INTERFACES ---
export interface UserProfile {
  uid: string;
  email: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  displayName: string;
  photoURL?: string | null;
  role: 'student' | 'admin' | 'teacher';
  createdAt: Date;
  updatedAt: Date;
  classLevel?: string;
  state?: string;
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
  xpPoints: number;
  totalXP?: number;
  level: number;
  streakCount: number;
  badges: string[];
  studyHours?: number;
  accuracy?: number;
  weakTopics?: string[];
  gender?: string;
  
  // Real-time dashboard tracking fields
  nextMilestoneDate?: Date | any; 
  nextMilestoneName?: string;
  dailyXPTracker?: { date: string, xp: number };
}

export interface ActivitySignal {
  id: string;
  title: string;
  description: string;
  type: 'achievement' | 'learning' | 'system';
  timestamp: Date;
  read: boolean;
}

// --- HELPERS ---
const ADMIN_ACCOUNT = 'satyagyanaedu@gmail.com';
const VIP_ACCOUNTS = ['biswalsatya321@gmail.com', ADMIN_ACCOUNT];

const USER_EDITABLE_FIELDS: (keyof UserProfile)[] = [
  'firstName', 'middleName', 'lastName', 'displayName',
  'photoURL', 'classLevel', 'school', 'medium', 'learningGoals', 
  'username', 'bio', 'interests', 'timezone', 'state', 'mood', 
  'themeColor', 'avatarUrl', 'bannerUrl', 'xpPoints', 'totalXP', 
  'level', 'streakCount', 'badges', 'studyHours', 'accuracy', 'weakTopics',
  'nextMilestoneDate', 'nextMilestoneName', 'dailyXPTracker', 'gender'
];

// Helper to convert Firestore Timestamps to JS Dates
const toDate = (val: any) => (val?.toDate ? val.toDate() : new Date(val));

// 🚀 FIXED: Accept 'any' so it works with both Python JWTs and standard Firebase users
export async function syncUserProfile(user: any): Promise<UserProfile> {
  // 🚀 FIXED: Safely fallback to using their email as the database ID if uid doesn't exist
  const userId = user?.uid || user?.email;
  
  if (!userId) throw new Error("No valid user identifier found");

  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  
  if (snap.exists()) {
    const data = snap.data();
    return {
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
      trialEndsAt: data.trialEndsAt ? toDate(data.trialEndsAt) : undefined,
      subscriptionEndsAt: data.subscriptionEndsAt ? toDate(data.subscriptionEndsAt) : undefined,
    } as UserProfile;
  } 
  
  // Create Initial Profile
  const now = new Date();
  const email = user.email ?? 'unknown@user.com';
  const isAdmin = email === ADMIN_ACCOUNT;
  const isVip = VIP_ACCOUNTS.includes(email);

  const newProfile: UserProfile = {
    uid: userId,
    email,
    displayName: user.displayName || 'Student',
    photoURL: user.photoURL,
    role: isAdmin ? 'admin' : 'student',
    createdAt: now,
    updatedAt: now,
    isPremium: isVip,
    subscriptionPlan: isVip ? 'lifetime' : 'trial',
    trialEndsAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
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

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  if (!uid) return;
  const userRef = doc(db, 'users', uid);
  const updates: any = {};
  for (const key of USER_EDITABLE_FIELDS) {
    if (data[key] !== undefined) updates[key] = data[key];
  }
  await updateDoc(userRef, { ...updates, updatedAt: new Date() });
}

export const isProfileComplete = (profile: UserProfile | null): boolean => {
  if (!profile) return false;
  return !!(profile.firstName && profile.lastName && profile.classLevel && profile.state && profile.gender);
};

// --- ACTIVITY SIGNALS ---
export async function addActivitySignal(uid: string, title: string, description: string, type: 'achievement' | 'learning' | 'system') {
  if (!uid) return;
  try {
    await addDoc(collection(db, `users/${uid}/signals`), { title, description, type, timestamp: new Date(), read: false });
  } catch (error) { console.error("Signal Push Failed", error); }
}

export async function getUserSignals(uid: string): Promise<ActivitySignal[]> {
  if (!uid) return [];
  const snap = await getDocs(query(collection(db, `users/${uid}/signals`), orderBy('timestamp', 'desc'), limit(10)));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data(), timestamp: toDate(doc.data().timestamp) })) as ActivitySignal[];
}