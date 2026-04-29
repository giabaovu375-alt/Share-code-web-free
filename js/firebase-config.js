// ========== FIREBASE CONFIG (CHUẨN MODULE V12) ==========
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAASY-FQ0p1rTB-WwU9I1iaWVsVk4D-O6M",
  authDomain: "codehub-9e1b4.firebaseapp.com",
  projectId: "codehub-9e1b4",
  storageBucket: "codehub-9e1b4.firebasestorage.app",
  messagingSenderId: "714965808705",
  appId: "1:714965808705:web:c6f44f0ca869db56c838c0",
  measurementId: "G-JZX5SX1Y3K"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log("✅ Firebase đã sẵn sàng!");

export { app, auth, db };
