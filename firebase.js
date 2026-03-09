import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAgLH8g-20u6zDAP2eQ0oU94DYpx5RjabI",
  authDomain: "mittens-ac688.firebaseapp.com",
  projectId: "mittens-ac688",
  storageBucket: "mittens-ac688.firebasestorage.app",
  messagingSenderId: "524822883656",
  appId: "1:524822883656:web:b03fc3d96e6925a3da977d",
  measurementId: "G-56J6FM1TLT"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion };