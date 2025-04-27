"use server"

import { executeQuery } from "./db"

export async function createUserProfile(email: string, name: string) {
  try {
    // Check if user already exists
    const existingUser = await executeQuery("SELECT * FROM users WHERE email = ?", [email])

    if (Array.isArray(existingUser) && existingUser.length > 0) {
      return { success: false, message: "User already exists" }
    }

    // Create user profile
    await executeQuery("INSERT INTO users (email, name, created_at) VALUES (?, ?, NOW())", [email, name])

    return { success: true }
  } catch (error) {
    console.error("Error creating user profile:", error)
    throw new Error("Failed to create user profile")
  }
}

export async function getUserProfile(email: string) {
  try {
    const user = await executeQuery("SELECT id, email, name, created_at FROM users WHERE email = ?", [email])

    if (Array.isArray(user) && user.length > 0) {
      return user[0]
    }

    return null
  } catch (error) {
    console.error("Error getting user profile:", error)
    throw new Error("Failed to get user profile")
  }
}

export async function updateUserProfile(email: string, name: string) {
  try {
    await executeQuery("UPDATE users SET name = ? WHERE email = ?", [name, email])

    return { success: true }
  } catch (error) {
    console.error("Error updating user profile:", error)
    throw new Error("Failed to update user profile")
  }
}
