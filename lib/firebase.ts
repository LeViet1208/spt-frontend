import { initializeApp } from "firebase/app"
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

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig)

// Khởi tạo Auth
export const auth = getAuth(app)

// Không cần export googleProvider từ đây nữa
// export const googleProvider = new GoogleAuthProvider()

export default app
