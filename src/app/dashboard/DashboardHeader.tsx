"use client"

import React, { useState } from 'react'
import { BarChart3, User, Database, Megaphone, Settings } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation"

export default function DashboardHeader() {
  const { user, logOut } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get active tab from URL or default to datasets
  const activeTab = searchParams.get('tab') || 'datasets'

  const handleLogout = async () => {
    try {
      await logOut()
      router.push("/")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const handleSettings = () => {
    router.push('/dashboard?tab=setting')
    setShowUserMenu(false)
  }

  const handleTabChange = (tabId: string) => {
    router.push(`/dashboard?tab=${tabId}`)
  }

  const tabs = [
    { id: "datasets", label: "Datasets"},
    { id: "campaigns", label: "Campaigns"},
  ]

  return (
    <header className="relative bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo - Left */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">SPT Analytics</h1>
            <p className="text-xs text-gray-500">Smart Promotion Tools</p>
          </div>
        </div>

        {/* Navigation - Center */}
        <nav className="absolute left-0 right-0 top-0 bottom-0 flex justify-center gap-x-16">
          {tabs.map((tab) => {
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`relative py-2 px-3 text-lg transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? "font-bold text-gray-900"
                    : "font-medium text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>
                )}
              </button>
            )
          })}
        </nav>

        {/* User Menu - Right */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            {user?.photoURL ? (
              <img src={user.photoURL || "/placeholder.svg"} alt="User avatar" className="w-8 h-8 rounded-full" />
            ) : (
              <User className="h-5 w-5 text-gray-600" />
            )}
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">{user?.displayName || "User"}</p>
                <p className="text-xs text-gray-500">{user?.email || "user@example.com"}</p>
              </div>
              <button
                onClick={handleSettings}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
