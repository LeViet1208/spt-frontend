"use client"

import { createContext, useContext } from "react"

export type OnBackFn = () => void

const OnBackContext = createContext<OnBackFn | null>(null)

export const OnBackProvider = OnBackContext.Provider
export const useOnBack = () => {
  const fn = useContext(OnBackContext)
  if (!fn) throw new Error("useOnBack must be inside OnBackProvider")
  return fn
}
