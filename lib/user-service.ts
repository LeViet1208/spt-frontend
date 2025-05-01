"use server"

// import { executeQuery } from "./db"
import type { RowDataPacket } from "mysql2"

// Define interface for user data
interface UserProfile extends RowDataPacket {
  id: number
  email: string
  name: string
  photo_url?: string
  created_at: Date
  updated_at?: Date
}

// Mock user data for testing
const mockUsers = {
  "test@example.com": {
    id: 1,
    email: "test@example.com",
    name: "Test User",
    photo_url: null,
    created_at: new Date(),
  },
}

export async function createUserProfile(email: string, name: string, photoURL?: string) {
  try {
    // Comment out database operations
    /*
    // Check if user already exists
    const existingUser = await executeQuery("SELECT * FROM users WHERE email = ?", [email])

    if (Array.isArray(existingUser) && existingUser.length > 0) {
      // Update existing user
      await executeQuery("UPDATE users SET name = ?, photo_url = ?, updated_at = NOW() WHERE email = ?", [
        name,
        photoURL || null,
        email,
      ])
      return { success: true, message: "User profile updated" }
    }

    // Create new user profile
    await executeQuery("INSERT INTO users (email, name, photo_url, created_at) VALUES (?, ?, ?, NOW())", [
      email,
      name,
      photoURL || null,
    ])
    */

    // Mock implementation
    if (mockUsers[email]) {
      mockUsers[email].name = name
      mockUsers[email].photo_url = photoURL || null
      return { success: true, message: "User profile updated" }
    }

    mockUsers[email] = {
      id: Object.keys(mockUsers).length + 1,
      email,
      name,
      photo_url: photoURL || null,
      created_at: new Date(),
    }

    return { success: true, message: "User profile created" }
  } catch (error) {
    console.error("Error creating/updating user profile:", error)
    throw new Error("Failed to create/update user profile")
  }
}

export async function getUserProfile(email: string) {
  try {
    // Comment out database operations
    /*
    const result = await executeQuery("SELECT id, email, name, photo_url, created_at FROM users WHERE email = ?", [
      email,
    ])

    if (Array.isArray(result) && result.length > 0) {
      // Cast the result to UserProfile type
      return result[0] as UserProfile
    }
    */

    // Mock implementation
    if (mockUsers[email]) {
      return mockUsers[email] as UserProfile
    }

    // If user doesn't exist in our mock data, create a new one
    const newUser = {
      id: Object.keys(mockUsers).length + 1,
      email,
      name: email.split("@")[0], // Use part of email as name
      photo_url: null,
      created_at: new Date(),
    }

    mockUsers[email] = newUser
    return newUser as UserProfile
  } catch (error) {
    console.error("Error getting user profile:", error)
    throw new Error("Failed to get user profile")
  }
}

export async function updateUserProfile(email: string, name: string, photoURL?: string) {
  try {
    // Comment out database operations
    /*
    await executeQuery("UPDATE users SET name = ?, photo_url = ?, updated_at = NOW() WHERE email = ?", [
      name,
      photoURL || null,
      email,
    ])
    */

    // Mock implementation
    if (mockUsers[email]) {
      mockUsers[email].name = name
      mockUsers[email].photo_url = photoURL || null
    } else {
      mockUsers[email] = {
        id: Object.keys(mockUsers).length + 1,
        email,
        name,
        photo_url: photoURL || null,
        created_at: new Date(),
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Error updating user profile:", error)
    throw new Error("Failed to update user profile")
  }
}
