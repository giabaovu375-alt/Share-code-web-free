// ========== FIREBASE CONFIG (CHUẨN CHỈNH - TỰ ĐỘNG THÍCH ỨNG) ==========

// 1. Cấu hình Firebase từ Console của bro
const firebaseConfig = {
    apiKey: "AIzaSyAASY-FQ0p1rTB-WwU9I1iaWVsVk4D-O6M",
    authDomain: "codehub-9e1b4.firebaseapp.com",
    projectId: "codehub-9e1b4",
    storageBucket: "codehub-9e1b4.firebasestorage.app",
    messagingSenderId: "714965808705",
    appId: "1:714965808705:web:c6f44f0ca869db56c838c0"
};

// 2. Khai báo biến toàn cục
let auth, db, storage;
let firebaseReady = false;

// 3. Hàm khởi tạo Firebase (tự động thích ứng)
async function initFirebase() {
    // Kiểm tra xem đã có API Key thật chưa (bro đã có thật rồi nên sẽ chạy)
    if (firebaseConfig.apiKey.includes("YOUR_API_KEY") || firebaseConfig.apiKey.includes("Dummy")) {
        console.warn("ℹ️ Chưa có Firebase config thật. Web chạy offline.");
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
        console.log("✅ Firebase đã sẵn sàng với config thật!");
    } catch (e) {
        console.error("❌ Lỗi khởi tạo Firebase:", e);
    }
}

// 4. Khởi tạo và export
await initFirebase();

// 5. Export các đối tượng chính
export { auth, db, storage, firebaseReady };

// 6. Định nghĩa hàm dummy để tránh lỗi undefined
const dummyAsyncFunction = async () => { throw new Error("Firebase chưa được cấu hình."); };

// 7. Export các hàm (sử dụng hàm thật nếu có, nếu không thì dùng dummy)
export const createUserWithEmailAndPassword = auth?.createUserWithEmailAndPassword || dummyAsyncFunction;
export const signInWithEmailAndPassword = auth?.signInWithEmailAndPassword || dummyAsyncFunction;
export const signOut = auth?.signOut || dummyAsyncFunction;
export const onAuthStateChanged = auth?.onAuthStateChanged || ((callback) => callback(null));
export const updateProfile = auth?.updateProfile || dummyAsyncFunction;
export const sendPasswordResetEmail = auth?.sendPasswordResetEmail || dummyAsyncFunction;

export const doc = db?.doc || dummyAsyncFunction;
export const setDoc = db?.setDoc || dummyAsyncFunction;
export const getDoc = db?.getDoc || dummyAsyncFunction;
export const updateDoc = db?.updateDoc || dummyAsyncFunction;
export const increment = db?.increment || (() => {});
export const collection = db?.collection || dummyAsyncFunction;
export const query = db?.query || dummyAsyncFunction;
export const getDocs = db?.getDocs || dummyAsyncFunction;
export const addDoc = db?.addDoc || dummyAsyncFunction;
export const where = db?.where || dummyAsyncFunction;
export const deleteDoc = db?.deleteDoc || dummyAsyncFunction;
export const orderBy = db?.orderBy || dummyAsyncFunction;

export const ref = storage?.ref || dummyAsyncFunction;
export const uploadBytes = storage?.uploadBytes || dummyAsyncFunction;
export const getDownloadURL = storage?.getDownloadURL || dummyAsyncFunction;
export const deleteObject = storage?.deleteObject || dummyAsyncFunction;
