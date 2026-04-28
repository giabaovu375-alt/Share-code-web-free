// ========== FIREBASE CONFIG ==========
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    sendPasswordResetEmail,
    signOut, 
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { 
    getFirestore, 
    doc, setDoc, getDoc, updateDoc, increment, 
    collection, query, getDocs, addDoc, where, deleteDoc, orderBy 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { 
    getStorage, 
    ref, uploadBytes, getDownloadURL, deleteObject 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";

// ⚠️ THAY THÔNG TIN DƯỚI ĐÂY BẰNG CONFIG THẬT CỦA BRO
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

console.log("✅ Firebase đã được khởi tạo");

// Export tất cả để các file khác dùng
export {
    auth, db, storage,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut,
    onAuthStateChanged,
    updateProfile,
    doc, setDoc, getDoc, updateDoc, increment,
    collection, query, getDocs, addDoc, where, deleteDoc, orderBy,
    ref, uploadBytes, getDownloadURL, deleteObject
};
