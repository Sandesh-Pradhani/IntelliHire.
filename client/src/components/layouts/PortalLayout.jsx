import { Outlet } from 'react-router-dom'
import Navbar from '../common/Navbar'
import CollapsibleSidebar from '../common/CollapsibleSidebar'
import { useSidebar } from '../../context/SidebarContext.jsx'

function PortalLayout() {
  const { collapsed } = useSidebar()

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <CollapsibleSidebar />
      <main
        className="min-h-screen pt-[72px] transition-all duration-300 ease-in-out"
        style={{ paddingLeft: collapsed ? '80px' : '280px' }}
      >
        <div className="mx-auto w-full max-w-7xl p-5 md:p-8 lg:p-10">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default PortalLayout
