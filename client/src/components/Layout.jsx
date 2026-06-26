/**
 * Legacy Layout — kept for backward compatibility.
 * All pages now receive layout from the route structure.
 * This component is no longer imported by any page.
 */
import CollapsibleSidebar from './common/CollapsibleSidebar'
import Navbar from './common/Navbar'

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <CollapsibleSidebar />
      <main className="pt-[72px] pl-[280px] min-h-screen transition-all duration-300 ease-in-out">
        <div className="p-5 md:p-8 lg:p-10 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  )
}

export default Layout