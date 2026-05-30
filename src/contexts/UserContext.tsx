import React, { createContext, useContext, useEffect, useState } from 'react';
import { syncUserProfile, UserProfile } from '../services/userService';
import { doc, setDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase'; 
import XpPopup from '../components/XpPopup';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'https://gyanamitra.onrender.com'}/api`;

interface UserContextType {
  user: { email: string; uid: string; emailVerified: boolean } | null;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => void;
  // 🚀 Added our new global XP function!
  addXP: (amount: number, reason: string) => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  profile: null,
  loading: true,
  logout: () => {},
  addXP: async () => {},
});

export const useUser = () => useContext(UserContext);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ email: string; uid: string; emailVerified: boolean } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 🚀 GAMIFICATION STATE
  const [xpNotification, setXpNotification] = useState<{amount: number, reason: string} | null>(null);

  useEffect(() => {
    const fetchFullProfile = async () => {
      const token = localStorage.getItem('gyanamitra_token');
      
      if (!token) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/users/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const pyUser = await response.json();
          
          const hybridUser = { 
            email: pyUser.email, 
            uid: pyUser.email, 
            emailVerified: pyUser.is_verified 
          };
          
          setUser(hybridUser);

          const firestoreGamification = await syncUserProfile(hybridUser);
          
          setProfile({
            ...firestoreGamification,
            ...pyUser 
          });

        } else {
          localStorage.removeItem('gyanamitra_token');
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error("Failed to fetch secure profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFullProfile();
  }, []);

  const logout = () => {
    localStorage.removeItem('gyanamitra_token');
    setUser(null);
    setProfile(null);
    window.location.reload();
  };

  // 🚀 THE GLOBAL GAMIFICATION ENGINE
  const addXP = async (amount: number, reason: string) => {
    if (!user || !user.uid) return;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      
      // Securely tell Firebase to do the math and add the XP
      await setDoc(userRef, {
        totalXP: increment(amount),
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      // Trigger the visual popup on the screen
      setXpNotification({ amount, reason });
      
      // Update local state instantly so the UI profile level bar updates without refreshing!
      setProfile(prev => prev ? { ...prev, totalXP: (prev.totalXP || 0) + amount } as UserProfile : prev);
      
    } catch (error) {
      console.error("Failed to add XP:", error);
    }
  };

  return (
    <UserContext.Provider value={{ user, profile, loading, logout, addXP }}>
      {children}
      
      {/* 🚀 Render the Gamification Popup on top of everything! */}
      {xpNotification && (
        <XpPopup 
          amount={xpNotification.amount} 
          reason={xpNotification.reason} 
          onClose={() => setXpNotification(null)} 
        />
      )}
    </UserContext.Provider>
  );
};