import { useCallback, useContext, useEffect, useMemo, useState, memo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeft,
  PanelLeftClose,
  Settings,
  User,
  X,
} from 'lucide-react'
import ROUTES, { getDashboardRoute, getPortfolioRoute, getSettingsRoute } from '../../constants/routes'
import { AuthContext } from '../../context/authContext.js'
import { useSidebar } from '../../context/SidebarContext.jsx'
import CANDIDATE_MENU from '../../navigation/candidateMenu'
import RECRUITER_MENU from '../../navigation/recruiterMenu'

function isPathActive(currentPath, itemPath) {
  return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`)
}

/**
 * NavItem — Single sidebar link.
 * When collapsed, only the icon is shown with a tooltip.
 */
const NavItem = memo(function NavItem({ item, collapsed, currentPath, onNavigate }) {
  const Icon = item.icon
  const active = isPathActive(currentPath, item.path)

  return (
    <Link
      to={item.path}
      onClick={onNavigate}
      className={`group flex items-center gap-3.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
        active
          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
          : collapsed
            ? 'justify-center px-0 text-slate-400 hover:bg-slate-800/60 hover:text-white'
            : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
      }`}
      title={collapsed ? item.label : undefined}
    >
      <Icon className={`h-4.5 w-4.5 shrink-0 ${active ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
    </Link>
  )
})

/**
 * SidebarSection — Accordion group with single-open logic.
 * In collapsed mode, shows a button that toggles a floating popover.
 */
const SidebarSection = memo(function SidebarSection({ group, currentPath, collapsed, open, onToggle, onNavigate }) {
  const Icon = group.icon
  const hasActiveChild = group.items.some((item) => isPathActive(currentPath, item.path))

  if (collapsed) {
    return (
      <div className="relative flex justify-center">
        <button
          type="button"
          onClick={onToggle}
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 ${
            hasActiveChild
              ? 'bg-blue-500/10 text-blue-400'
              : 'text-slate-500 hover:bg-slate-800/60 hover:text-slate-300'
          }`}
          title={group.label}
        >
          <Icon className="h-4.5 w-4.5 shrink-0" />
        </button>
        {open ? (
          <>
            <div className="absolute top-0 left-full z-50 ml-2 min-w-[220px] rounded-2xl border border-slate-800 bg-slate-900 p-3 shadow-2xl">
              <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavItem
                    key={item.path}
                    item={item}
                    collapsed={false}
                    currentPath={currentPath}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            </div>
            <div className="absolute top-4 left-full z-50 ml-1.5 h-2 w-2 rotate-45 border-l border-t border-slate-800 bg-slate-900" />
          </>
        ) : null}
      </div>
    )
  }

  return (
    <div className="select-none">
      <button
        type="button"
        onClick={onToggle}
        className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
          hasActiveChild ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon className="h-4.5 w-4.5 shrink-0" />
          <span>{group.label}</span>
        </div>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-300 ${open ? 'rotate-0' : '-rotate-90'} ${
            hasActiveChild ? 'text-blue-400' : 'text-slate-600'
          }`}
        />
      </button>

      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="ml-2 mt-1 space-y-0.5 border-l border-slate-800 pl-3">
          {group.items.map((item) => (
            <NavItem
              key={item.path}
              item={item}
              collapsed={false}
              currentPath={currentPath}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </div>
    </div>
  )
})

/**
 * ProfileSection — Fixed at bottom with overlay menu.
 * Menu appears as a floating overlay (not inline), so it never pushes layout.
 */
const ProfileSection = memo(function ProfileSection({ user, collapsed, onLogout, onNavigate }) {
  const [open, setOpen] = useState(false)

  const handleToggle = useCallback(() => {
    setOpen((prev) => !prev)
  }, [])

  const handleClose = useCallback(() => {
    setOpen(false)
  }, [])

  return (
    <div className="relative flex-shrink-0 border-t border-slate-800 pt-3">
      <button
        type="button"
        onClick={handleToggle}
        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 hover:bg-slate-800/40 ${
          collapsed ? 'justify-center' : ''
        }`}
        title={collapsed ? user?.name : undefined}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 font-bold text-white shadow-inner">
          {user?.name ? user.name[0].toUpperCase() : <User className="h-4.5 w-4.5" />}
        </div>
        {!collapsed ? (
          <>
            <div className="flex-1 overflow-hidden text-left">
              <h4 className="truncate text-sm font-semibold leading-tight text-white">{user?.name || 'User'}</h4>
            </div>
            <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
          </>
        ) : null}
      </button>

      {open ? (
        <>
          {/* Backdrop for click-outside */}
          <div className="fixed inset-0 z-40" onClick={handleClose} />
          {/* Floating menu — overlays, does not push layout */}
          <div className={`absolute bottom-full left-0 z-50 mb-2 min-w-[200px] rounded-2xl border border-slate-800 bg-slate-900 p-2 shadow-2xl ${collapsed ? 'left-1/2 -translate-x-1/2' : ''}`}>
            <Link
              to={getPortfolioRoute(user?.role)}
              onClick={() => {
                handleClose()
                onNavigate()
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 transition-all duration-200 hover:bg-slate-800/60 hover:text-white"
            >
              <User className="h-4 w-4" />
              <span>Portfolio</span>
            </Link>
            <Link
              to={getSettingsRoute(user?.role)}
              onClick={() => {
                handleClose()
                onNavigate()
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 transition-all duration-200 hover:bg-slate-800/60 hover:text-white"
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                handleClose()
                onLogout()
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-rose-400 transition-all duration-200 hover:bg-rose-500/10 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </>
      ) : null}
    </div>
  )
})

/**
 * CollapsibleSidebar — Main sidebar component.
 *
 * Architecture:
 * - Dynamic width via SidebarContext (280px expanded / 80px collapsed)
 * - Single accordion via expandedSection state
 * - Profile always fixed at bottom, outside scroll area
 * - overflow-x-hidden on container, overflow-y-auto on nav area
 * - 300ms transition on width
 * - No horizontal scrollbars
 */
export default function CollapsibleSidebar() {
  const { user, logout } = useContext(AuthContext)
  const location = useLocation()
  const navigate = useNavigate()
  const { collapsed, toggleCollapsed } = useSidebar()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [expandedSection, setExpandedSection] = useState('')

  const currentPath = location.pathname

  const sidebarGroups = useMemo(() => {
    if (!user) {
      return []
    }
    return user.role === 'candidate' ? CANDIDATE_MENU : RECRUITER_MENU
  }, [user])

  // Auto-open the group whose child is active, but only if no section is manually expanded
  const activeGroupId = useMemo(() => {
    const group = sidebarGroups.find((g) => g.items.some((entry) => isPathActive(currentPath, entry.path)))
    return group?.id ?? ''
  }, [currentPath, sidebarGroups])

  const openSectionId = expandedSection || activeGroupId

  const handleToggleSection = useCallback((groupId) => {
    setExpandedSection((prev) => (prev === groupId ? '' : groupId))
  }, [])

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false)
  }, [])

  const handleLogout = useCallback(() => {
    logout()
    closeMobileMenu()
    navigate(ROUTES.LOGIN, { replace: true })
  }, [logout, closeMobileMenu, navigate])

  const dashboardRoute = user ? getDashboardRoute(user.role) : ROUTES.LOGIN
  const dashboardActive = currentPath === dashboardRoute

  const sidebarWidth = collapsed ? '80px' : '280px'

  const navContent = (
    <>
      {/* Top: collapse toggle */}
      <div className={`mb-4 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed ? (
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Recruitment ATS
          </p>
        ) : null}
        <button
          type="button"
          onClick={toggleCollapsed}
          className="rounded-lg p-1.5 text-slate-500 transition-all duration-200 hover:bg-slate-800 hover:text-white"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      {/* Scrollable navigation area — independent of profile */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <nav className="space-y-1">
          {/* Dashboard link */}
          <div className={collapsed ? 'flex justify-center' : ''}>
            <Link
              to={dashboardRoute}
              onClick={closeMobileMenu}
              className={`flex items-center gap-3.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                dashboardActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                  : collapsed
                    ? 'justify-center px-0 text-slate-400 hover:bg-slate-800/60 hover:text-white'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
              }`}
              title={collapsed ? 'Dashboard' : undefined}
            >
              <LayoutDashboard className={`h-4.5 w-4.5 shrink-0 ${dashboardActive ? 'text-white' : 'text-slate-500'}`} />
              {!collapsed ? <span>Dashboard</span> : null}
            </Link>
          </div>

          {/* Accordion groups */}
          <div className={`space-y-0.5 ${collapsed ? 'flex flex-col items-center gap-1' : ''}`}>
            {sidebarGroups.map((group) => (
              <SidebarSection
                key={group.id}
                group={group}
                currentPath={currentPath}
                collapsed={collapsed}
                open={openSectionId === group.id}
                onToggle={() => handleToggleSection(group.id)}
                onNavigate={closeMobileMenu}
              />
            ))}
          </div>
        </nav>
      </div>

      {/* Profile — always fixed at bottom, never scrolls */}
      {user ? (
        <ProfileSection user={user} collapsed={collapsed} onLogout={handleLogout} onNavigate={closeMobileMenu} />
      ) : null}
    </>
  )

  return (
    <>
      {/* Mobile toggle button */}
      <div className="fixed right-6 bottom-6 z-50 md:hidden">
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="rounded-full bg-blue-600 p-4 text-white shadow-2xl transition-all duration-300 hover:scale-105 hover:bg-blue-700 active:bg-blue-800"
          aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile overlay backdrop */}
      {mobileMenuOpen ? (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 md:hidden"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      ) : null}

      {/* Desktop sidebar */}
      <aside
        className="fixed top-[72px] bottom-0 left-0 z-30 hidden border-r border-slate-800 bg-slate-900 text-slate-300 md:flex md:flex-col overflow-x-hidden transition-all duration-300"
        style={{ width: sidebarWidth }}
      >
        <div className="flex flex-1 flex-col overflow-hidden p-4">
          {navContent}
        </div>
      </aside>

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-slate-800 bg-slate-900 text-slate-300 transition-transform duration-300 ease-in-out md:hidden overflow-x-hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!mobileMenuOpen}
      >
        <div className="flex flex-1 flex-col overflow-hidden p-6">
          <div className="mb-6 flex items-center justify-between">
            <span className="text-xl font-bold text-blue-500">IntelliHire</span>
            <button
              type="button"
              onClick={closeMobileMenu}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              aria-label="Close Navigation Menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {navContent}
          </div>
        </div>
      </aside>
    </>
  )
}