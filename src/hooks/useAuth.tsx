import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { AppUser } from '../types';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: () => Promise<void>;
  loginDemo: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  loginDemo: () => {},
  logout: async () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if there is an active demo session in sessionStorage
    const isDemo = sessionStorage.getItem('isDemoSession') === 'true';
    if (isDemo) {
      setUser({
        uid: 'demo-user',
        email: 'demo@examtracker.pro',
        displayName: 'Demo Guest',
        photoURL: null,
        isAnonymous: true,
        isDemo: true
      });
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          isAnonymous: currentUser.isAnonymous
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async () => {
    sessionStorage.removeItem('isDemoSession');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Google authentication error:", error);
      throw error;
    }
  };

  const loginDemo = () => {
    sessionStorage.setItem('isDemoSession', 'true');
    setUser({
      uid: 'demo-user',
      email: 'demo@examtracker.pro',
      displayName: 'Demo Guest',
      photoURL: null,
      isAnonymous: true,
      isDemo: true
    });
  };

  const logout = async () => {
    const isDemo = sessionStorage.getItem('isDemoSession') === 'true';
    if (isDemo) {
      sessionStorage.removeItem('isDemoSession');
      localStorage.removeItem('demo_exams'); // Reset demo session exams
      setUser(null);
      return;
    }

    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginDemo, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
