import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import { auth } from '../firebase/config';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isDevUser: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  enableDevSession: (email?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEV_STORAGE_KEY = 'nfc_factory_dev_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDevUser, setIsDevUser] = useState(false);

  useEffect(() => {
    // Check if dev session was saved
    const storedDev = localStorage.getItem(DEV_STORAGE_KEY);
    if (storedDev) {
      try {
        const parsed = JSON.parse(storedDev);
        setCurrentUser(parsed as User);
        setIsDevUser(true);
        setLoading(false);
        return;
      } catch {
        localStorage.removeItem(DEV_STORAGE_KEY);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!isDevUser) {
        setCurrentUser(user);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isDevUser]);

  const login = async (email: string, pass: string) => {
    localStorage.removeItem(DEV_STORAGE_KEY);
    setIsDevUser(false);
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const register = async (email: string, pass: string) => {
    localStorage.removeItem(DEV_STORAGE_KEY);
    setIsDevUser(false);
    await createUserWithEmailAndPassword(auth, email, pass);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    localStorage.removeItem(DEV_STORAGE_KEY);
    setIsDevUser(false);
    setCurrentUser(null);
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
  };

  // Helper for instant local administrator testing if Firebase Email Auth is not enabled in console yet
  const enableDevSession = (customEmail?: string) => {
    const devUser = {
      uid: 'admin-prod-001',
      email: customEmail || 'megashopofc11@gmail.com',
      displayName: 'Administrador Fábrica',
      emailVerified: true,
      isAnonymous: false,
      metadata: {},
      providerData: [],
      refreshToken: '',
      tenantId: null,
      delete: async () => {},
      getIdToken: async () => 'mock-token',
      getIdTokenResult: async () => ({
        token: 'mock-token',
        signInProvider: 'password',
        claims: {},
        authTime: '',
        issuedAtTime: '',
        expirationTime: '',
      }),
      reload: async () => {},
      toJSON: () => ({}),
      phoneNumber: null,
      photoURL: null,
      providerId: 'firebase',
    } as unknown as User;

    localStorage.setItem(DEV_STORAGE_KEY, JSON.stringify({
      uid: devUser.uid,
      email: devUser.email,
      displayName: devUser.displayName,
    }));

    setCurrentUser(devUser);
    setIsDevUser(true);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        isDevUser,
        login,
        register,
        resetPassword,
        logout,
        enableDevSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
