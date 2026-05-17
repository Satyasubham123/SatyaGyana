import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { User as FirebaseUser } from 'firebase/auth';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  const errorJson = JSON.stringify(errInfo);
  console.error('Firestore Error: ', errorJson);
  throw new Error(errorJson);
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role: 'admin' | 'student';
  classLevel?: string;
  medium?: 'English' | 'Hindi' | 'Odia';
  isPremium: boolean;
  xpPoints: number;
  level: number;
  badges: string[];
  streakCount: number;
  weakTopics: string[];
  lastLoginAt: any;
  createdAt: any;
}

export const syncUserProfile = async (user: FirebaseUser): Promise<UserProfile> => {
  const userRef = doc(db, 'users', user.uid);
  const path = `users/${user.uid}`;
  
  let userSnap;
  try {
    userSnap = await getDoc(userRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    throw error; // unreachable due to handleFirestoreError throw
  }
  
  const isAdminEmail = user.email === 'biswalsatyasubham274@gmail.com';

  if (!userSnap.exists()) {
    const newUser: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || null,
      photoURL: user.photoURL || null,
      role: isAdminEmail ? 'admin' : 'student',
      isPremium: isAdminEmail, 
      xpPoints: 0,
      level: 1,
      badges: [],
      streakCount: 0,
      weakTopics: [],
      lastLoginAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    };
    try {
      await setDoc(userRef, newUser);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
    return newUser;
  } else {
    const existingData = userSnap.data() as UserProfile;
    const updates: Partial<UserProfile> = { lastLoginAt: serverTimestamp() };
    
    if (isAdminEmail && existingData.role !== 'admin') {
      updates.role = 'admin';
      updates.isPremium = true;
    }
    
    try {
      await updateDoc(userRef, updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
    return { ...existingData, ...updates };
  }
};

export const calculateLevel = (xp: number): number => {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
  const userRef = doc(db, 'users', uid);
  const path = `users/${uid}`;
  
  if (data.xpPoints !== undefined) {
    const newLevel = calculateLevel(data.xpPoints);
    data.level = newLevel;
  }
  
  try {
    await updateDoc(userRef, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};
