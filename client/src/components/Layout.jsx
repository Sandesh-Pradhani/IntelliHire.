import Sidebar from './Sidebar'

function Layout({ children }) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50 relative">
      <Sidebar />

      {/* MAIN CONTENT */}
      <div className="flex-1 md:pl-72 w-full transition-all duration-300">
        <div className="p-5 md:p-8 lg:p-10 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Layout