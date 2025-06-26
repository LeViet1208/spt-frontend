"use client"

import React, { useState, createContext, useContext } from 'react'
import Sidebar from '@/components/Sidebar'

interface AppLayoutProps {
  children: React.ReactNode
}

const SidebarContext = createContext<{
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
}>({
  isCollapsed: false,
  setIsCollapsed: () => {}
})

export const useSidebar = () => useContext(SidebarContext)

export default function AppLayout({ children }: AppLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
      <div className="min-h-screen bg-background">
        <Sidebar />
        {/* Main Content */}
        <main className={`pb-16 lg:pb-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        }`}>
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </main>
      </div>
    </SidebarContext.Provider>
  )
}
