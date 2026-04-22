import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc, db, auth, onAuthStateChanged, signOut } from './firebase';

interface AuthContextType {
  user: any | null;
  role: 'super_admin' | 'admin' | 'director' | null;
  directorId: string | null;
  outletId: string | null;
  userId: string | null;
  customUserId: string | null;
  loading: boolean;
  logout: () => void;
  appSettings: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const specialAdmins = ["cmrabbi@gmail.com", "aspsbazar@gmail.com", "cmrabbicarromking@gmail.com", "shanubegumts@gmail.com", "balkoy72@gmail.com", "mohammadrabbi617@gmail.com"];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [role, setRole] = useState<'super_admin' | 'admin' | 'director' | null>(null);
  const [directorId, setDirectorId] = useState<string | null>(null);
  const [outletId, setOutletId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [customUserId, setCustomUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [appSettings, setAppSettings] = useState({
    loadingTitle: 'Al-Arafah Islami Bank Plc',
    loadingSubtitle: 'Halal income, for a better future',
    appName: 'Al-Arafah Islami Bank Plc'
  });

  useEffect(() => {
    // App Settings Listener
    const settingsRef = doc(db, 'app_settings', 'config');
    const unsubSettings = onSnapshot(settingsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setAppSettings(prev => ({
          ...prev,
          ...data
        }));
      }
    }, (err) => console.warn("Settings snapshot inhibited:", err));

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      console.log("Auth State Changed:", firebaseUser?.email);
      
      if (!firebaseUser) {
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);
      const emailLower = firebaseUser.email?.toLowerCase() || '';
      const isSpecial = specialAdmins.includes(emailLower);
      
      if (isSpecial) setRole('super_admin');
      setLoading(false);

      // Fetch Profile without crashing if not found
      const userRef = doc(db, 'users', firebaseUser.uid);
      const unsubProfile = onSnapshot(userRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setRole(data.role || (isSpecial ? 'super_admin' : 'admin'));
          setDirectorId(data.directorId || null);
          setOutletId(data.outletId || null);
          setUserId(data.userId || null);
          setCustomUserId(data.customUserId || null);
        } else if (isSpecial) {
          // Auto create profile for special admins in background
          setDoc(userRef, {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: 'super_admin',
            createdAt: new Date().toISOString()
          }).catch(console.error);
        }
      }, (err) => console.warn("Profile snapshot inhibited:", err));

      return () => unsubProfile && unsubProfile();
    });

    return () => {
      unsubscribeAuth();
      unsubSettings();
    };
  }, []);

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, role, directorId, outletId, userId, customUserId, loading, logout, appSettings }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
