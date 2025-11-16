import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  signOut as fbSignOut,
  onAuthStateChanged
} from "firebase/auth";
import {
  getFirestore, doc, setDoc, getDoc, updateDoc,
  collection, addDoc, query, where, onSnapshot, orderBy, deleteDoc, serverTimestamp
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBZ6Of3Ow2lSX-8svE08kSXpdS67c1wVZA",
  authDomain: "task-manager-14ce4.firebaseapp.com",
  projectId: "task-manager-14ce4",
  storageBucket: "task-manager-14ce4.appspot.com",
  messagingSenderId: "770612132429",
  appId: "1:770612132429:web:e07578a974f55c7446fa04",
  measurementId: "G-ET1Z1WG3W5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

setPersistence(auth, browserLocalPersistence).catch(err => {
  console.warn('setPersistence warning', err);
});

export const normalizeUsername = (raw) => (raw || '').toString().trim().toLowerCase();
export const usernameToEmail = (normalizedUsername) => `${normalizedUsername}@taskmanager.local`;

export const createUserFirestore = async (uid, normalizedUsername, displayName) => {
  const userRef = doc(db, 'users', uid);
  const usernameRef = doc(db, 'usernames', normalizedUsername);
  const snap = await getDoc(userRef);
  if (snap.exists()) return { ok: false, reason: 'exists' };
  
  try {
    await setDoc(userRef, {
      username: normalizedUsername,
      displayName: displayName || normalizedUsername,
      createdAt: serverTimestamp(),
      friends: [],
      friendRequests: {},
      categories: ['General']
    });
    await setDoc(usernameRef, { uid });
    return { ok: true };
  } catch (err) {
    console.error('createUserFirestore error', err);
    return { ok: false, error: err };
  }
};

export const getUserDoc = async (uid) => {
  if (!uid) return null;
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.error('getUserDoc error', err);
    return null;
  }
};

export const getUidForUsername = async (normalizedUsername) => {
  if (!normalizedUsername) return null;
  try {
    const ref = doc(db, 'usernames', normalizedUsername);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const d = snap.data();
    return d && d.uid ? d.uid : null;
  } catch (err) {
    console.error('getUidForUsername error', err);
    return null;
  }
};