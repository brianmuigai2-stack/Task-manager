import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db, getUserDoc } from '../services/firebase';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);

        // Listen for real-time updates to user document
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const unsubscribeUserDoc = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            setUserDoc(doc.data());
          } else {
            setUserDoc(null);
          }
          setLoading(false);
        });

        // Return cleanup function for user doc listener
        return unsubscribeUserDoc;
      } else {
        setUser(null);
        setUserDoc(null);
        setLoading(false);
      }
    });

    return unsubscribeAuth;
  }, []);

  return { user, userDoc, loading };
};