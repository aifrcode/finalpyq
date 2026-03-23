import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { auth, onAuthStateChanged, db, doc, getDoc, updateDoc, setDoc, serverTimestamp, FirebaseUser, signInWithPopup, googleProvider, handleFirestoreError, OperationType, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from './firebase';
import { UserProfile, UserRole } from './types';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Fetch profile
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        let userDoc;
        try {
          userDoc = await getDoc(userDocRef);
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`, 'useAuth: Fetch Profile');
          setLoading(false);
          return;
        }
        
        const initialAdminEmail = import.meta.env.VITE_INITIAL_ADMIN_EMAIL || 'rajan.fr0911@gmail.com';
        const isInitialAdmin = firebaseUser.email === initialAdminEmail;

        if (userDoc.exists()) {
          const data = userDoc.data() as UserProfile;
          // Ensure initial admin always has admin role and is verified
          if (isInitialAdmin && (data.role !== 'admin' || !data.verified)) {
            const updatedProfile = { ...data, role: 'admin' as const, verified: true };
            try {
              await updateDoc(userDocRef, { role: 'admin', verified: true });
            } catch (err) {
              handleFirestoreError(err, OperationType.UPDATE, `users/${firebaseUser.uid}`, 'useAuth: Update Initial Admin Role');
            }
            setProfile(updatedProfile);
          } else {
            setProfile(data);
          }
        } else {
          // Check if this is the initial admin bootstrap
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || (isInitialAdmin ? 'Initial Admin' : 'Student'),
            role: isInitialAdmin ? 'admin' : 'student',
            verified: isInitialAdmin,
            createdAt: serverTimestamp() as any
          };
          
          try {
            await setDoc(userDocRef, newProfile);
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}`, 'useAuth: Create Profile');
          }
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error('Email sign in error:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(user, { displayName: name });
    } catch (error) {
      console.error('Email sign up error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signInWithEmail, signUpWithEmail, resetPassword, signOut }}>
      {children}
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
