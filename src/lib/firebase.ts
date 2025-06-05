
import { initializeApp } from "firebase/app";
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { getAuth } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyBxOznNGWn6FPUeACw3g2eJUjSTPoZylak",
  authDomain: "spt-ml-model-service.firebaseapp.com",
  projectId: "spt-ml-model-service",
  storageBucket: "spt-ml-model-service.firebasestorage.app",
  messagingSenderId: "1073048243362",
  appId: "1:1073048243362:web:8ac85d7032b6746fa69bfb",
  databaseURL: "https://spt-ml-model-service-default-rtdb.asia-southeast1.firebasedatabase.app/",
}

// Kiểm tra xem Firebase đã được khởi tạo chưa để tránh khởi tạo nhiều lần
let app
try {
  app = initializeApp(firebaseConfig)
} catch (error) {
  // Nếu Firebase đã được khởi tạo, sử dụng instance hiện có
  console.log("Firebase app already initialized")
}

export const auth = getAuth(app)
export default app
