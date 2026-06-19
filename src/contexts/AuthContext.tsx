import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth"
import { auth } from "@/firebase"

interface AuthContextValue {
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const googleProvider = new GoogleAuthProvider()

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    signInWithGoogle: async () => {
      await signInWithPopup(auth, googleProvider)
    },
    signUpWithEmail: async (email: string, password: string) => {
      await createUserWithEmailAndPassword(auth, email, password)
    },
    signInWithEmail: async (email: string, password: string) => {
      await signInWithEmailAndPassword(auth, email, password)
    },
    logout: async () => {
      await signOut(auth)
    },
  }), [loading, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }

  return context
}