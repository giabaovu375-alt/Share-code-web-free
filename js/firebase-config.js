// ========== FIREBASE CONFIG (ỔN ĐỊNH - KHÔNG LỖI) ==========

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, increment, collection, query, getDocs, addDoc, where, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Cấu hình thật của bro
const firebaseConfig = {
    apiKey: "AIzaSyAASY-FQ0p1rTB-WwU9I1iaWVsVk4D-O6M",
    authDomain: "codehub-9e1b4.firebaseapp.com",
    projectId: "codehub-9e1b4",
    storageBucket: "codehub-9e1b4.firebasestorage.app",
    messagingSenderId: "714965808705",
    appId: "1:714965808705:web:c6f44f0ca869db56c838c0"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log("✅ Firebase đã sẵn sàng với config thật!");

// Export tất cả những gì cần thiết
export {
    auth, db,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    doc, setDoc, getDoc, updateDoc, increment,
    collection, query, getDocs, addDoc, where, deleteDoc
};
