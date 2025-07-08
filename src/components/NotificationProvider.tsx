"use client";

import { useEffect } from "react";
import { useNotifications } from "@/hooks/useNotifications";

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  // Initialize the notification system
  useNotifications();

  return <>{children}</>;
}; 