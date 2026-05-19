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

  // 🚀 NEW: SUBSCRIPTION SYSTEM
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

// 🚀 YOUR VIP ACCOUNTS
const VIP_ACCOUNTS = ['biswalsatya321@gmail.com', 'biswalsatyasubham274@gmail.com'];
const ADMIN_ACCOUNT = 'biswalsatyasubham274@gmail.com';

export async function syncUserProfile(user: User): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);

  const isVip = user.email ? VIP_ACCOUNTS.includes(user.email) : false;
  const isAdmin = user.email === ADMIN_ACCOUNT;

  if (snap.exists()) {
    const existingData = snap.data() as UserProfile;
    
    // Auto-upgrade your specific accounts if they aren't already VIP/Admin
    if (isVip && existingData.subscriptionPlan !== 'lifetime') {
       await updateDoc(userRef, { 
          subscriptionPlan: 'lifetime', 
          isPremium: true,
          role: isAdmin ? 'admin' : existingData.role 
       });
       return { ...existingData, subscriptionPlan: 'lifetime', isPremium: true, role: isAdmin ? 'admin' : existingData.role };
    }
    
    return existingData;
  } else {
    const now = new Date();
    // Calculate exactly 30 days from now for the free trial
    const trialEndDate = new Date();
    trialEndDate.setDate(now.getDate() + 30); 

    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      role: isAdmin ? 'admin' : 'student',
      createdAt: now,
      updatedAt: now,
      
      // 🚀 SUBSCRIPTION LOGIC APPLIED HERE
      isPremium: isVip, // VIPs get Premium instantly
      subscriptionPlan: isVip ? 'lifetime' : 'trial',
      trialEndsAt: trialEndDate,
      
      // Analytics
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

// 🚀 HELPER: Check if a user is allowed to access premium features
export function checkActiveSubscription(profile: UserProfile | null): boolean {
  if (!profile) return false;
  
  // 1. Lifetime VIPs always get access
  if (profile.subscriptionPlan === 'lifetime') return true;
  
  // 2. Check if trial is still active
  if (profile.subscriptionPlan === 'trial' && profile.trialEndsAt) {
    // Convert Firestore Timestamp to Date if necessary
    const trialEnd = profile.trialEndsAt instanceof Date ? profile.trialEndsAt : (profile.trialEndsAt as any).toDate();
    return trialEnd > new Date();
  }
  
  // 3. Check if paid subscription is active (for when they pay the ₹19)
  if (profile.subscriptionPlan === 'active' && profile.subscriptionEndsAt) {
    const subEnd = profile.subscriptionEndsAt instanceof Date ? profile.subscriptionEndsAt : (profile.subscriptionEndsAt as any).toDate();
    return subEnd > new Date();
  }

  return false;
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