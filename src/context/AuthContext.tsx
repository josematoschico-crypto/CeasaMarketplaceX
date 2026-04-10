import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut, 
  createUserWithEmailAndPassword,
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

// Utility to remove undefined values from an object
const sanitizePayload = (obj: any) => {
  const sanitized = { ...obj };
  Object.keys(sanitized).forEach(key => {
    if (sanitized[key] === undefined) {
      delete sanitized[key];
    }
  });
  return sanitized;
};

interface User {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  role: 'buyer' | 'seller' | 'driver';
  barracaId?: string;
}

interface AuthContextType {
  user: User | null;
  login: (whatsapp: string, password: string) => Promise<void>;
  register: (whatsapp: string, password: string, name: string, role: 'buyer' | 'seller' | 'driver', barracaId?: string) => Promise<string>;
  updateUser: (uid: string, data: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getEmailFromWhatsapp = (whatsapp: string) => {
  const digits = whatsapp.replace(/\D/g, '');
  return `${digits}@ceasamarket.com`;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUser(userDoc.data() as User);
          } else {
            setUser(null);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (whatsapp: string, password: string) => {
    // Normalize whatsapp to digits only
    const normalizedWhatsapp = whatsapp.replace(/\D/g, '');
    
    // Check if it's a mock seller first for demo purposes
    const { MOCK_SELLERS } = await import('../data/mock');
    const mockSeller = MOCK_SELLERS.find(s => s.whatsapp === normalizedWhatsapp && s.password === password);
    
    if (mockSeller) {
      const mockUser: User = {
        id: `mock_${mockSeller.barracaId}`,
        name: mockSeller.name,
        email: `${normalizedWhatsapp}@mock.com`,
        whatsapp: normalizedWhatsapp,
        role: 'seller',
        barracaId: mockSeller.barracaId
      };
      setUser(mockUser);
      return;
    }

    const email = getEmailFromWhatsapp(normalizedWhatsapp);
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (whatsapp: string, password: string, name: string, role: 'buyer' | 'seller' | 'driver', barracaId?: string) => {
    const normalizedWhatsapp = whatsapp.replace(/\D/g, '');
    const email = getEmailFromWhatsapp(normalizedWhatsapp);
    const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
    
    const newUser: User = {
      id: firebaseUser.uid,
      name,
      email: '',
      whatsapp: normalizedWhatsapp,
      role,
      barracaId: barracaId || '', // Ensure it's not undefined
    };

    try {
      const sanitizedUser = sanitizePayload(newUser);
      await setDoc(doc(db, 'users', firebaseUser.uid), sanitizedUser);
      setUser(newUser);
      return firebaseUser.uid;
    } catch (error) {
      // CLEANUP: If Firestore fails, delete the Auth user to allow retry
      try {
        await firebaseUser.delete();
      } catch (deleteError) {
        console.error('Failed to cleanup auth user after firestore error:', deleteError);
      }
      
      handleFirestoreError(error, OperationType.WRITE, `users/${firebaseUser.uid}`);
      throw error;
    }
  };

  const updateUser = async (uid: string, data: Partial<User>) => {
    try {
      const sanitizedData = sanitizePayload(data);
      await updateDoc(doc(db, 'users', uid), sanitizedData);
      
      // Update local state if it's the current user
      if (user && user.id === uid) {
        setUser(prev => prev ? { ...prev, ...data } : null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      updateUser,
      logout, 
      isAuthenticated: !!user,
      loading 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
