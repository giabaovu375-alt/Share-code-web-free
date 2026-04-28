// ========== FIREBASE CONFIG (AN TOÀN TUYỆT ĐỐI) ==========

// 1. Cấu hình Firebase (đã điền thông tin thật của bro)
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
    // Kiểm tra xem đã có API Key thật chưa
    if (firebaseConfig.apiKey.includes("YOUR_API_KEY") || firebaseConfig.apiKey.includes("Dummy")) {
        console.warn("ℹ️ Chưa có Firebase config thật. Web chạy offline.");
        return; // Giữ auth và db là null
    }

    try {
        // Import các SDK cần thiết
        const [
            { initializeApp },
            { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, sendPasswordResetEmail },
            { getFirestore, doc, setDoc, getDoc, updateDoc, increment, collection, query, getDocs, addDoc, where, deleteDoc, orderBy },
            { getStorage, ref, uploadBytes, getDownloadURL, deleteObject }
        ] = await Promise.all([
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
    }
}

// 4. Khởi tạo và export
await initFirebase();

// 5. Export các đối tượng chính
export { auth, db, storage, firebaseReady };

// 6. Export các hàm Firebase (đảm bảo không undefined)
// Nếu Firebase chưa sẵn sàng, các hàm này sẽ là null, code của bro cần kiểm tra trước khi dùng.
export const createUserWithEmailAndPassword = auth?.createUserWithEmailAndPassword;
export const signInWithEmailAndPassword = auth?.signInWithEmailAndPassword;
export const signOut = auth?.signOut;
export const onAuthStateChanged = auth?.onAuthStateChanged;
export const updateProfile = auth?.updateProfile;
export const sendPasswordResetEmail = auth?.sendPasswordResetEmail;

export const doc = db?.doc;
export const setDoc = db?.setDoc;
export const getDoc = db?.getDoc;
export const updateDoc = db?.updateDoc;
export const increment = db?.increment;
export const collection = db?.collection;
export const query = db?.query;
export const getDocs = db?.getDocs;
export const addDoc = db?.addDoc;
export const where = db?.where;
export const deleteDoc = db?.deleteDoc;
export const orderBy = db?.orderBy;

export const ref = storage?.ref;
export const uploadBytes = storage?.uploadBytes;
export const getDownloadURL = storage?.getDownloadURL;
export const deleteObject = storage?.deleteObject;
