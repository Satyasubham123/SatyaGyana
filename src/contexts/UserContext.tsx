import React, { createContext, useContext, useEffect, useState } from 'react';

// Make sure this matches your FastAPI server address
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'https://gyanamitra.onrender.com') + '/api';
// Expanded Profile Interface
interface UserProfile {
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  role: string;
  classLevel: string;
  state: string;
  medium: string;
  gender: string;
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
        // 🚀 Call the secure Python endpoint!
        const response = await fetch(`${API_BASE_URL}/users/me`, {
          method: 'GET',
          headers: {
            // This is how we pass the token to OAuth2PasswordBearer
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setUser({ email: userData.email });
          setProfile(userData); // Now contains firstName, classLevel, state, etc!
        } else {
          // If the server says 401 Unauthorized, the token expired
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