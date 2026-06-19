import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyBOPSgYWhUCg_LdFkBq3UfS7sTG8FPZx54",
  authDomain: "goru-gym.firebaseapp.com",
  projectId: "goru-gym",
  storageBucket: "goru-gym.firebasestorage.app",
  messagingSenderId: "1019553372324",
  appId: "1:1019553372324:web:b5bff66018f7c7300c2e31",
  measurementId: "G-Y8R3X8HBQY",
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export default app