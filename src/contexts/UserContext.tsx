import React, { createContext, useContext, useEffect, useState } from 'react';
// 🚀 ALL FIREBASE IMPORTS REMOVED

interface UserProfile {
  email: string;
  role: string;
  displayName?: string;
}

interface UserContextType {
  user: { email: string } | null;
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
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to decode the JWT token to see who is logged in
  const parseJwt = (token: string) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      // 1. Look for the token saved during login
      const token = localStorage.getItem('gyanamitra_token');
      
      if (token) {
        // 2. Decode token to get user info
        const decoded = parseJwt(token);
        
        if (decoded && decoded.exp * 1000 > Date.now()) {
          // Token is valid!
          const userEmail = decoded.sub;
          setUser({ email: userEmail });
          
          // Basic profile setup (You can later build an API to fetch the full profile)
          setProfile({
            email: userEmail,
            role: userEmail.includes('satyagyanedu') ? 'admin' : 'student',
            displayName: userEmail.split('@')[0]
          });
        } else {
          // Token is expired, clear it out
          localStorage.removeItem('gyanamitra_token');
          setUser(null);
          setProfile(null);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      
      setLoading(false);
    };

    checkAuth();
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