// Firebase Config - Premium (tự động thích ứng)
const firebaseConfig = {
    apiKey: "AIzaSyDummyKeyForNow", // <= THAY BẰNG KEY THẬT CỦA BRO
    authDomain: "dummy.firebaseapp.com",
    projectId: "dummy-project",
    storageBucket: "dummy.appspot.com",
    messagingSenderId: "000000000000",
    appId: "1:000000000000:web:dummy"
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

    try {
        const [{ initializeApp }, { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, sendPasswordResetEmail }, { getFirestore, doc, setDoc, getDoc, updateDoc, increment, collection, query, getDocs, addDoc, where, deleteDoc, orderBy }, { getStorage, ref, uploadBytes, getDownloadURL, deleteObject }] = await Promise.all([
            import("https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js"),
            import("https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js"),
            import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js"),
            import("https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js")
        ]);

        const app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        storage = getStorage(app);
        firebaseReady = true;
        console.log("✅ Firebase đã sẵn sàng");
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

// Xuất tất cả để app.js dùng
export { auth, db, storage, firebaseReady };
export const { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, sendPasswordResetEmail } = auth;
export const { doc, setDoc, getDoc, updateDoc, increment, collection, query, getDocs, addDoc, where, deleteDoc, orderBy } = db || {};
export const { ref, uploadBytes, getDownloadURL, deleteObject } = storage || {};
