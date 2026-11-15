import { Outlet } from 'react-router-dom'
import Navbar from '../common/Navbar'

/**
 * AuthLayout — Used for Login/Register pages.
 * Navbar is shown, but no sidebar.
 * Navigation bar is fixed, content fills the viewport.
 */
function AuthLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="pt-[72px] min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}

export default AuthLayout