const firebaseConfig = {
    apiKey: "AIzaSyDummyKeyForNow",
    authDomain: "dummy.firebaseapp.com",
    projectId: "dummy-project",
    storageBucket: "dummy.appspot.com",
    messagingSenderId: "000000000000",
    appId: "1:000000000000:web:dummy"
};

let auth, db, storage, firebaseReady = false;

async function initFirebase() {
    if (firebaseConfig.apiKey.includes("YOUR_API_KEY") || firebaseConfig.apiKey.includes("Dummy")) {
        console.warn("⚠️ Firebase chưa được cấu hình. Chạy ở chế độ offline.");
        auth = { onAuthStateChanged: (cb) => cb(null), signOut: async () => {}, currentUser: null };
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
        auth = { onAuthStateChanged: (cb) => cb(null), signOut: async () => {} };
        db = null;
    }
}

await initFirebase();

export { auth, db, storage, firebaseReady };
export const { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, sendPasswordResetEmail } = auth;
export const { doc, setDoc, getDoc, updateDoc, increment, collection, query, getDocs, addDoc, where, deleteDoc, orderBy } = db || {};
export const { ref, uploadBytes, getDownloadURL, deleteObject } = storage || {};
