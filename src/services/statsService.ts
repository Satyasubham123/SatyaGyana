import { doc, getDoc, collection, query, where, getCountFromServer, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface UserStats {
  totalXP: number;
  dailyXP: number;
  nextMilestoneName: string;
  nextMilestoneDate: Date | null;
  globalPercentile: number;
}

export async function fetchUserDashboardStats(uid: string): Promise<UserStats> {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error("User profile not found in database.");
    }

    const userData = userSnap.data();
    const totalXP = userData.totalXP || 0;
    
    let milestoneDate = null;
    if (userData.nextMilestoneDate instanceof Timestamp) {
      milestoneDate = userData.nextMilestoneDate.toDate();
    } else if (userData.nextMilestoneDate) {
      milestoneDate = new Date(userData.nextMilestoneDate);
    }

    const usersRef = collection(db, 'users');
    
    const totalUsersSnap = await getCountFromServer(usersRef);
    const totalUsers = totalUsersSnap.data().count;

    const usersBelowQuery = query(usersRef, where('totalXP', '<=', totalXP));
    const usersBelowSnap = await getCountFromServer(usersBelowQuery);
    const usersBelow = usersBelowSnap.data().count;

    let topPercentile = 100;
    if (totalUsers > 1) {
      const percentileBelow = (usersBelow / totalUsers) * 100;
      topPercentile = Math.max(1, Math.round(100 - percentileBelow));
    }

    const todayString = new Date().toISOString().split('T')[0];
    const dailyXP = userData.dailyXPTracker?.date === todayString ? userData.dailyXPTracker.xp : 0;

    return {
      totalXP,
      dailyXP,
      nextMilestoneName: userData.nextMilestoneName || 'Next Exam',
      nextMilestoneDate: milestoneDate,
      globalPercentile: topPercentile
    };
  } catch (error) {
    console.error("Error fetching stats:", error);
    throw error;
  }
}