import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '../common/Navbar'
import CollapsibleSidebar from '../common/CollapsibleSidebar'

/**
 * RecruiterLayout — Used for all recruiter pages.
 * Fixed navbar (72px) at top.
 * Fixed collapsible sidebar on left.
 * Content scrolls in the remaining area.
 *
 * Sidebar width: 280px expanded, 80px collapsed.
 * Content adjusts via padding-left to prevent layout jumps.
 */
function RecruiterLayout() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebar_collapsed') === 'true'
    } catch {
      return false
    }
  })

  // Listen for collapse changes from sidebar
  useEffect(() => {
    const checkCollapsed = () => {
      try {
        const val = localStorage.getItem('sidebar_collapsed') === 'true'
        setCollapsed(val)
      } catch { /* ignore */ }
    }

    const interval = setInterval(checkCollapsed, 200)
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

      {/* Main Content */}
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

export default RecruiterLayout