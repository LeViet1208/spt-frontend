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
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  logOut: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth state changed:", user ? user.email : "No user")
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    try {
      console.log("Starting Google sign-in...")

      // Tạo mới GoogleAuthProvider
      const provider = new GoogleAuthProvider()

      // Thêm các scopes
      provider.addScope("email")
      provider.addScope("profile")

      // Đặt prompt để luôn hiển thị popup chọn tài khoản
      provider.setCustomParameters({
        prompt: "select_account",
      })

      // Thực hiện đăng nhập với popup
      const result = await signInWithPopup(auth, provider)
      console.log("Sign-in successful:", result.user?.email)

      return result
    } catch (error) {
      console.error("Google Sign-in Error:", error)
      throw error
    }
  }

  const logOut = async () => {
    try {
      await signOut(auth)
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
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
