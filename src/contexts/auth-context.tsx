"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { type User, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { auth } from "@/lib/firebase"

interface AuthContextType {
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<any>
  logOut: () => Promise<void>
  getIdToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  logOut: async () => {},
  getIdToken: async () => null,
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Sử dụng null làm giá trị khởi tạo để tránh hydration mismatch
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Chỉ chạy ở phía client
    if (typeof window !== "undefined") {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        console.log("Auth state changed:", user ? user.email : "No user")
        setUser(user)
        setLoading(false)
      })

      return () => unsubscribe()
    }
  }, [])

  const signInWithGoogle = async () => {
    try {
      console.log("Starting Google sign-in...")

      const provider = new GoogleAuthProvider()
      provider.addScope("email")
      provider.addScope("profile")
      provider.setCustomParameters({
        prompt: "select_account",
      })

      const result = await signInWithPopup(auth, provider)
      console.log("Sign-in successful:", result.user?.email)

      // Lấy ID token
      const idToken = await result.user.getIdToken()
      console.log("ID Token:", idToken)

      // Lưu user info và ID token
      sessionStorage.setItem("user", JSON.stringify(result.user))
      sessionStorage.setItem("firebaseIdToken", idToken)

      return { ...result, idToken }
    } catch (error) {
      console.error("Google Sign-in Error:", error)
      throw error
    }
  }

  const getIdToken = async (): Promise<string | null> => {
    try {
      if (user) {
        const idToken = await user.getIdToken()
        return idToken
      }
      return null
    } catch (error) {
      console.error("Error getting ID token:", error)
      return null
    }
  }

  const logOut = async () => {
    try {
      await signOut(auth)
      sessionStorage.removeItem("user")
      sessionStorage.removeItem("firebaseIdToken")
      localStorage.removeItem("access_token")
      localStorage.removeItem("user_id")
    } catch (error) {
      console.error("Error signing out:", error)
      throw error
    }
  }

  const value = {
    user,
    loading,
    signInWithGoogle,
    logOut,
    getIdToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
