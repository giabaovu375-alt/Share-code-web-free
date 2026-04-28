// Firebase Config - Premium (tự động thích ứng)
const firebaseConfig = {
    apiKey: "AIzaSyDummyKeyForNow", // <= THAY BẰNG KEY THẬT CỦA BRO
    authDomain: "dummy.firebaseapp.com",
    projectId: "dummy-project",
    storageBucket: "dummy.appspot.com",
    messagingSenderId: "000000000000",
    appId: "1:000000000000:web:dummy"
};

// Khai báo các biến sẽ export
let auth, db, storage;
let firebaseReady = false;

async function initFirebase() {
    // Nếu config vẫn là placeholder -> chạy offline, không crash
    if (firebaseConfig.apiKey.includes("YOUR_API_KEY") || firebaseConfig.apiKey.includes("Dummy")) {
        console.warn("ℹ️ Chưa có Firebase config thật. Web chạy offline.");

        // Tạo một đối tượng auth giả để không làm lỗi các lời gọi auth
        auth = {
            onAuthStateChanged: (cb) => {
                cb(null);
                return () => {}; // Trả về unsubscribe function
            },
            signOut: async () => {},
            currentUser: null
        };
        db = null;
        storage = null;
        return;
    }

    try {
        const [
            { initializeApp },
            { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, sendPasswordResetEmail },
            { getFirestore, doc, setDoc, getDoc, updateDoc, increment, collection, query, getDocs, addDoc, where, deleteDoc, orderBy },
            { getStorage, ref, uploadBytes, getDownloadURL, deleteObject }
        ] = await Promise.all([
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
        // Fallback nếu lỗi
        auth = {
            onAuthStateChanged: (cb) => { cb(null); return () => {}; },
            signOut: async () => {},
            currentUser: null
        };
        db = null;
        storage = null;
    }
}

// Đợi khởi tạo xong rồi mới export
await initFirebase();

// Export các đối tượng và hàm cần thiết
export { auth, db, storage, firebaseReady };

// Export các hàm từ auth (nếu auth null thì dùng object rỗng để tránh lỗi)
export const {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    sendPasswordResetEmail
} = auth || {};

// Export các hàm từ Firestore (nếu db null thì dùng object rỗng)
export const {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    increment,
    collection,
    query,
    getDocs,
    addDoc,
    where,
    deleteDoc,
    orderBy
} = db || {};

// Export các hàm từ Storage (nếu storage null thì dùng object rỗng)
export const {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} = storage || {};
