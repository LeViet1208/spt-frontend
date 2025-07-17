"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { devtools } from "zustand/middleware";
import { type User } from "firebase/auth";

interface AuthState {
	// Firebase user
	firebaseUser: User | null;

	// Backend authentication
	accessToken: string | null;
	userId: string | null;

	// UI states
	isAuthenticated: boolean;
	isLoading: boolean;
	error: string | null;
}

interface AuthActions {
	// Setters
	setFirebaseUser: (user: User | null) => void;
	setAccessToken: (token: string | null) => void;
	setUserId: (userId: string | null) => void;
	setLoading: (isLoading: boolean) => void;
	setError: (error: string | null) => void;

	// Auth methods
	signInWithBackend: (firebaseIdToken: string) => Promise<void>;
	logout: () => Promise<void>;
	getIdToken: () => Promise<string | null>;

	// Storage methods
	loadAuthFromStorage: () => void;
	clearAuth: () => void;
}

type AuthStore = AuthState & AuthActions;

const STORAGE_KEYS = {
	ACCESS_TOKEN: "access_token",
	USER_ID: "user_id",
	FIREBASE_ID_TOKEN: "firebaseIdToken",
} as const;

export const useAuthStore = create<AuthStore>()(
	devtools(
		persist(
			(set, get) => ({
				// Initial state
				firebaseUser: null,
				accessToken: null,
				userId: null,
				isAuthenticated: false,
				isLoading: false,
				error: null,

				// Setters
				setFirebaseUser: (user: User | null) => {
					set({ firebaseUser: user });

					// Update authentication status based on both Firebase user and backend tokens
					const { accessToken, userId } = get();
					set({ isAuthenticated: !!(user && accessToken && userId) });
				},

				setAccessToken: (token: string | null) => {
					set({ accessToken: token });

					if (typeof window !== "undefined") {
						if (token) {
							localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
						} else {
							localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
						}
					}

					// Update authentication status
					const { firebaseUser, userId } = get();
					set({ isAuthenticated: !!(firebaseUser && token && userId) });
				},

				setUserId: (userId: string | null) => {
					set({ userId });

					if (typeof window !== "undefined") {
						if (userId) {
							localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
						} else {
							localStorage.removeItem(STORAGE_KEYS.USER_ID);
						}
					}

					// Update authentication status
					const { firebaseUser, accessToken } = get();
					set({ isAuthenticated: !!(firebaseUser && accessToken && userId) });
				},

				setLoading: (isLoading: boolean) => {
					set({ isLoading });
				},

				setError: (error: string | null) => {
					set({ error });
				},

				// Sign in with backend using Firebase ID token
				signInWithBackend: async (firebaseIdToken: string) => {
					try {
						set({ isLoading: true, error: null });

						const response = await fetch(
							`${
								process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
							}/auth/`,
							{
								method: "POST",
								headers: {
									"Content-Type": "application/json",
								},
								body: JSON.stringify({
									firebase_id_token: firebaseIdToken,
								}),
							}
						);

						if (!response.ok) {
							throw new Error(
								`Backend authentication failed: ${response.status}`
							);
						}

						const data = await response.json();

						// Check if the response has the expected structure
						if (
							!data.success ||
							!data.payload?.access_token ||
							!data.payload?.user_id
						) {
							throw new Error(
								"Invalid response format from authentication endpoint"
							);
						}

						// Store the tokens from the payload
						const { setAccessToken, setUserId } = get();
						setAccessToken(data.payload.access_token);
						setUserId(data.payload.user_id);

						// Store Firebase ID token in session storage for potential refresh
						if (typeof window !== "undefined") {
							sessionStorage.setItem(
								STORAGE_KEYS.FIREBASE_ID_TOKEN,
								firebaseIdToken
							);
						}
					} catch (error: unknown) {
						let errorMessage = "Backend authentication failed";
						if (error instanceof Error) {
							errorMessage = error.message;
						}
						set({ error: errorMessage });
						throw error;
					} finally {
						set({ isLoading: false });
					}
				},

				// Get Firebase ID token
				getIdToken: async (): Promise<string | null> => {
					try {
						const { firebaseUser } = get();
						if (firebaseUser) {
							const idToken = await firebaseUser.getIdToken();
							return idToken;
						}
						return null;
					} catch (error) {
						console.error("Error getting ID token:", error);
						return null;
					}
				},

				// Logout
				logout: async () => {
					try {
						set({ isLoading: true });

						// Clear all auth data
						get().clearAuth();

						// Clear session storage
						if (typeof window !== "undefined") {
							sessionStorage.removeItem("user");
							sessionStorage.removeItem(STORAGE_KEYS.FIREBASE_ID_TOKEN);
						}
					} catch (error: unknown) {
						console.warn("Logout error:", error);
					} finally {
						set({ isLoading: false });
					}
				},

				// Load auth from storage
				loadAuthFromStorage: () => {
					if (typeof window === "undefined") return;

					try {
						const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
						const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);

						if (accessToken && userId) {
							set({
								accessToken,
								userId,
								error: null,
							});
						}
					} catch (error) {
						console.warn("Failed to load auth from storage:", error);
						get().clearAuth();
					}
				},

				// Clear all auth data
				clearAuth: () => {
					set({
						firebaseUser: null,
						accessToken: null,
						userId: null,
						isAuthenticated: false,
						error: null,
					});

					if (typeof window !== "undefined") {
						localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
						localStorage.removeItem(STORAGE_KEYS.USER_ID);
						sessionStorage.removeItem("user");
						sessionStorage.removeItem(STORAGE_KEYS.FIREBASE_ID_TOKEN);
					}
				},
			}),
			{
				name: "auth-storage",
				storage: createJSONStorage(() => localStorage),
				partialize: (state) => ({
					accessToken: state.accessToken,
					userId: state.userId,
				}),
			}
		),
		{ name: "auth-store" }
	)
);
