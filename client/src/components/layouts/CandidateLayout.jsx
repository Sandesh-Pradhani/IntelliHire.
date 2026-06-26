import { useState, useContext, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import Navbar from '../common/Navbar'
import CollapsibleSidebar from '../common/CollapsibleSidebar'

/**
 * CandidateLayout — Used for all candidate pages.
 * Fixed navbar (72px) at top.
 * Fixed collapsible sidebar on left.
 * Content scrolls in the remaining area.
 *
 * Sidebar width: 280px expanded, 80px collapsed.
 * Content adjusts via padding-left to prevent layout jumps.
 */
function CandidateLayout() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebar_collapsed') === 'true'
    } catch {
      return false
    }
  })

  // Listen for collapse changes from sidebar (localStorage is shared)
  useEffect(() => {
    const checkCollapsed = () => {
      try {
        const val = localStorage.getItem('sidebar_collapsed') === 'true'
        setCollapsed(val)
      } catch { /* ignore */ }
    }

    // Poll for changes (simplest approach without creating a context)
    const interval = setInterval(checkCollapsed, 200)
    // Also listen for storage events (cross-tab)
    window.addEventListener('storage', checkCollapsed)

    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', checkCollapsed)
    }
  }, [])

  const sidebarWidth = collapsed ? '80px' : '280px'

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Fixed Navbar */}
      <Navbar />

      {/* Fixed Sidebar */}
      <CollapsibleSidebar />

      {/* Main Content — adjusts padding-left based on sidebar width */}
      <main
        className="pt-[72px] min-h-screen transition-all duration-300 ease-in-out"
        style={{ paddingLeft: sidebarWidth }}
      >
        <div className="p-5 md:p-8 lg:p-10 max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default CandidateLayout