// ========== FIREBASE CONFIG (ĐÃ CÓ KEY THẬT) ==========
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";
import { 
    getFirestore, 
    doc, setDoc, getDoc, updateDoc, increment, 
    collection, addDoc, query, where, getDocs, deleteDoc 
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

// 🔥 Config thật từ Firebase Console của bro
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

// Export tất cả để app.js và product-detail.js dùng
export {
    auth, db,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    doc, setDoc, getDoc, updateDoc, increment,
    collection, addDoc, query, where, getDocs, deleteDoc
};
