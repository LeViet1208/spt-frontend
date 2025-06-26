"use client"

import React, { useState } from 'react'
import { useRouter } from "next/navigation"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { signOut } from "firebase/auth"
import { auth } from "@/utils/firebase"
import { useAuthStore } from "@/hooks/stores/useAuthStore"
import { 
  BarChart3, 
  User, 
  Database, 
  Megaphone, 
  Settings, 
  Moon, 
  Sun,
  Home,
  LogOut,
  PanelLeft,
  PanelLeftClose
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/app/(main)/layout"

interface SidebarProps {
  className?: string
}

export default function Sidebar({ className }: SidebarProps) {
  const { firebaseUser, logout } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { isCollapsed, setIsCollapsed } = useSidebar()

  const handleLogout = async () => {
    try {
      await signOut(auth)
      await logout()
      router.push("/")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const handleNavigation = (href: string) => {
    router.push(href)
  }


  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const navigationItems = [
    { 
      id: "dashboard", 
      label: "Dashboard", 
      icon: Home,
      href: "/dashboard"
    },
    { 
      id: "datasets", 
      label: "Datasets", 
      icon: Database,
      href: "/datasets"
    },
    { 
      id: "campaigns", 
      label: "Campaigns", 
      icon: Megaphone,
      href: "/campaigns"
    },
    { 
      id: "settings", 
      label: "Settings", 
      icon: Settings,
      href: "/settings"
    },
  ]

  const isActiveRoute = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard"
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 bg-background border-r border-border transition-all duration-300 ease-in-out",
        isCollapsed ? "lg:w-16" : "lg:w-64",
        className
      )}>
        {/* Logo */}
        <div className={cn(
          "flex items-center border-b border-border transition-all duration-300",
          isCollapsed ? "p-4 justify-center" : "p-6 gap-3"
        )}>
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <BarChart3 className="h-6 w-6 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground">SPT Analytics</h1>
              <p className="text-xs text-muted-foreground">Smart Promotion Tools</p>
            </div>
          )}
        </div>

        {/* Toggle Button - positioned at the middle of the right border */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute top-1/2 -translate-y-1/2 -right-3 z-10 h-6 w-6 p-0 rounded-full bg-background border-border hover:bg-accent shadow-md"
        >
          {isCollapsed ? (
            <PanelLeft className="h-3 w-3" />
          ) : (
            <PanelLeftClose className="h-3 w-3" />
          )}
        </Button>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = isActiveRoute(item.href)
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full h-11 transition-all duration-200",
                  isCollapsed ? "justify-center px-0" : "justify-start gap-3",
                  isActive && "bg-secondary text-secondary-foreground font-medium"
                )}
                onClick={() => handleNavigation(item.href)}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </Button>
            )
          })}
        </nav>

        {/* Theme Toggle & User Menu */}
        <div className="p-4 border-t border-border space-y-3">
          {/* Theme Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleTheme}
            className={cn(
              "w-full transition-all duration-200",
              isCollapsed ? "justify-center px-0" : "justify-start gap-3"
            )}
            title={isCollapsed ? (theme === "dark" ? "Light Mode" : "Dark Mode") : undefined}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 flex-shrink-0" />
            ) : (
              <Moon className="h-4 w-4 flex-shrink-0" />
            )}
            {!isCollapsed && <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className={cn(
                  "w-full h-11 transition-all duration-200",
                  isCollapsed ? "justify-center px-0" : "justify-start gap-3"
                )}
                title={isCollapsed ? (firebaseUser?.displayName || "User") : undefined}
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={firebaseUser?.photoURL || ""} />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="flex flex-col items-start text-left flex-1 min-w-0">
                    <span className="text-sm font-medium truncate w-full">
                      {firebaseUser?.displayName || "User"}
                    </span>
                    <span className="text-xs text-muted-foreground truncate w-full">
                      {firebaseUser?.email || "user@example.com"}
                    </span>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
        <nav className="flex items-center justify-around p-2">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = isActiveRoute(item.href)
            
            return (
              <Button
                key={item.id}
                variant="ghost"
                size="sm"
                className={cn(
                  "flex-col gap-1 h-auto py-2 px-3",
                  isActive && "text-primary"
                )}
                onClick={() => handleNavigation(item.href)}
              >
                <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
                <span className="text-xs">{item.label}</span>
              </Button>
            )
          })}
          
          {/* User Menu for Mobile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex-col gap-1 h-auto py-2 px-3">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={firebaseUser?.photoURL || ""} />
                  <AvatarFallback>
                    <User className="h-3 w-3" />
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs">Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mb-2">
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </>
  )
}
