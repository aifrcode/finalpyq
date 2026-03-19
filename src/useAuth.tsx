import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { auth, onAuthStateChanged, db, doc, getDoc, updateDoc, setDoc, serverTimestamp, FirebaseUser, signInWithPopup, googleProvider, handleFirestoreError, OperationType } from './firebase';
import { UserProfile, UserRole } from './types';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
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
        
        if (userDoc.exists()) {
          const data = userDoc.data() as UserProfile;
          // Ensure initial admin always has admin role
          const initialAdminEmail = process.env.VITE_INITIAL_ADMIN_EMAIL || 'rajan.fr0911@gmail.com';
          if (firebaseUser.email === initialAdminEmail && data.role !== 'admin') {
            const updatedProfile = { ...data, role: 'admin' as const };
            try {
              await updateDoc(userDocRef, { role: 'admin' });
            } catch (err) {
              handleFirestoreError(err, OperationType.UPDATE, `users/${firebaseUser.uid}`, 'useAuth: Update Initial Admin Role');
            }
            setProfile(updatedProfile);
          } else {
            setProfile(data);
          }
        } else {
          // Check if this is the initial admin bootstrap
          const initialAdminEmail = process.env.VITE_INITIAL_ADMIN_EMAIL || 'rajan.fr0911@gmail.com';
          if (firebaseUser.email === initialAdminEmail) {
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || 'Initial Admin',
              role: 'admin',
              createdAt: serverTimestamp() as any
            };
            try {
              await setDoc(userDocRef, newProfile);
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}`, 'useAuth: Create Initial Admin');
            }
            setProfile(newProfile);
          } else {
            // No profile and not initial admin - user is unauthorized
            setProfile(null);
          }
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
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut }}>
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
