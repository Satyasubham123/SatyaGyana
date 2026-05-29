import React, { createContext, useContext, useEffect, useState } from 'react';
import { syncUserProfile, UserProfile } from '../services/userService';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'https://gyanamitra.onrender.com'}/api`;

interface UserContextType {
  user: { email: string; uid: string; emailVerified: boolean } | null;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => void;
}

const UserContext = createContext<UserContextType>({
  user: null,
  profile: null,
  loading: true,
  logout: () => {},
});

export const useUser = () => useContext(UserContext);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ email: string; uid: string; emailVerified: boolean } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

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
        // 🚀 1. Verify token & get secure data from Python Backend
        const response = await fetch(`${API_BASE_URL}/users/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const pyUser = await response.json();
          
          // Construct a hybrid user object that satisfies our React Router
          const hybridUser = { 
            email: pyUser.email, 
            uid: pyUser.email, // Use email as unique ID for Firestore
            emailVerified: pyUser.is_verified 
          };
          
          setUser(hybridUser);

          // 🚀 2. Sync with Firestore to grab Gamification Data (XP, Badges, Level)
          // We merge the Python strict data with the Firestore dynamic data
          const firestoreGamification = await syncUserProfile(hybridUser);
          
          setProfile({
            ...firestoreGamification,
            ...pyUser // Python data overrides Firestore data for secure fields (role, plan)
          });

        } else {
          // Token expired or invalid
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

  return (
    <UserContext.Provider value={{ user, profile, loading, logout }}>
      {children}
    </UserContext.Provider>
  );
};