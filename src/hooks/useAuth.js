import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, getUserDoc } from '../services/firebase';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const doc = await getUserDoc(firebaseUser.uid);
        setUserDoc(doc);
      } else {
        setUser(null);
        setUserDoc(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { user, userDoc, loading };
};