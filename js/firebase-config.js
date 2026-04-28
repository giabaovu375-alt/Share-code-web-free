// ========== FIREBASE CONFIG (TỰ ĐỘNG THÍCH ỨNG + CONFIG THẬT) ==========
const firebaseConfig = {
    apiKey: "AIzaSyAASY-FQ0p1rTB-WwU9I1iaWVsVk4D-O6M",
    authDomain: "codehub-9e1b4.firebaseapp.com",
    projectId: "codehub-9e1b4",
    storageBucket: "codehub-9e1b4.firebasestorage.app",
    messagingSenderId: "714965808705",
    appId: "1:714965808705:web:c6f44f0ca869db56c838c0"
};

let auth, db, storage;
let firebaseReady = false;

async function initFirebase() {
    // Nếu config vẫn là placeholder -> chạy offline, không crash
    if (firebaseConfig.apiKey.includes("YOUR_API_KEY") || firebaseConfig.apiKey.includes("Dummy")) {
        console.warn("ℹ️ Chưa có Firebase config thật. Web chạy offline.");
        auth = {
            onAuthStateChanged: (cb) => { cb(null); return () => {}; },
            signOut: async () => {},
            currentUser: null
        };
        db = null;
        storage = null;
        return;
    }

    // Nếu có config thật -> khởi tạo Firebase
    try {
        const [{ initializeApp }, { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, sendPasswordResetEmail }, { getFirestore, doc, setDoc, getDoc, updateDoc, increment, collection, query, getDocs, addDoc, where, deleteDoc, orderBy }, { getStorage, ref, uploadBytes, getDownloadURL, deleteObject }] = await Promise.all([
            import("https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js"),
            import("https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js"),
            import("https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js"),
            import("https://www.gstatic.com/firebasejs/12.12.1/firebase-storage.js")
        ]);

        const app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        storage = getStorage(app);
        firebaseReady = true;
        console.log("✅ Firebase đã sẵn sàng với config thật!");
    } catch (e) {
        console.error("❌ Lỗi khởi tạo Firebase:", e);
        auth = {
            onAuthStateChanged: (cb) => { cb(null); return () => {}; },
            signOut: async () => {},
            currentUser: null
        };
        db = null;
        storage = null;
    }
}

await initFirebase();

// Xuất tất cả để app.js và product-detail.js dùng
export { auth, db, storage, firebaseReady };
export const { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, sendPasswordResetEmail } = auth;
export const { doc, setDoc, getDoc, updateDoc, increment, collection, query, getDocs, addDoc, where, deleteDoc, orderBy } = db || {};
export const { ref, uploadBytes, getDownloadURL, deleteObject } = storage || {};
