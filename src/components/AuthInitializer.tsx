"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/utils/firebase";
import { useAuthStore } from "@/hooks/stores/useAuthStore";
import { initializeAuthStore } from "@/utils/api";

export function AuthInitializer() {
  const { setFirebaseUser, setLoading, loadAuthFromStorage } = useAuthStore();

  useEffect(() => {
    // Initialize the auth store reference in api.ts
    initializeAuthStore(useAuthStore);

    // Load auth data from storage on app start
    loadAuthFromStorage();

    // Set up Firebase auth state listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth state changed:", user ? user.email : "No user");
      setFirebaseUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setFirebaseUser, setLoading, loadAuthFromStorage]);

  return null; // This component only handles initialization, no UI
}
