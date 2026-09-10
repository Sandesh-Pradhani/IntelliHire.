import { createContext, useContext, useState, useEffect, useCallback } from 'react'

function getSavedValue(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ?? fallback
  } catch {
    return fallback
  }
}

function saveValue(key, value) {
  try {
    if (value === null || value === undefined) {
      localStorage.removeItem(key)
      return
    }
    localStorage.setItem(key, String(value))
  } catch {
    // silent
  }
}

export const SidebarContext = createContext(null)

export function SidebarProvider({ children }) {
  const [collapsed, setCollapsed] = useState(() => getSavedValue('sidebar_collapsed', 'false') === 'true')

  useEffect(() => {
    saveValue('sidebar_collapsed', collapsed)
  }, [collapsed])

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => !prev)
  }, [])

  return (
    <SidebarContext.Provider value={{ collapsed, toggleCollapsed, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const ctx = useContext(SidebarContext)
  if (!ctx) {
    return { collapsed: false, toggleCollapsed: () => {}, setCollapsed: () => {} }
  }
  return ctx
}