import { useState, useEffect, useCallback, useContext, useMemo, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import {
  LayoutDashboard,
  UploadCloud,
  History,
  Briefcase,
  Award,
  MessageSquare,
  FileCheck,
  Sparkles,
  GraduationCap,
  UserPlus,
  FolderKanban,
  Code2,
  Settings,
  Bell,
  ChevronDown,
  Menu,
  X,
  User,
  LogOut,
  BarChart3,
  Users,
  Plus,
  Brain,
  TrendingUp,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react'

// ─── Candidate Sidebar Groups ──────────────────────────────────────────
const CANDIDATE_GROUPS = [
  {
    id: 'jobs',
    label: 'Jobs',
    icon: Briefcase,
    items: [
      { path: '/jobs', label: 'Browse Jobs', icon: Briefcase },
      { path: '/candidate/applications', label: 'My Applications', icon: FileCheck },
    ],
  },
  {
    id: 'ai',
    label: 'AI',
    icon: Sparkles,
    items: [
      { path: '/resume-upload', label: 'Resume Analysis', icon: BarChart3 },
      { path: '/job-match', label: 'Job Match', icon: Brain },
      { path: '/career-insights', label: 'Career Insights', icon: TrendingUp },
    ],
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    icon: Award,
    items: [
      { path: '/resume-upload', label: 'Resume', icon: FileCheck },
      { path: '/academic-profile', label: 'Academic Profile', icon: GraduationCap },
      { path: '/projects', label: 'Projects', icon: FolderKanban, disabled: true, badge: 'Soon' },
      { path: '/certificates', label: 'Certificates', icon: Award, disabled: true, badge: 'Soon' },
      { path: '/coding-profiles', label: 'Coding Profiles', icon: Code2, disabled: true, badge: 'Soon' },
      { path: '/github', label: 'GitHub', icon: Code2, disabled: true, badge: 'Soon' },
      { path: '/linkedin', label: 'LinkedIn', icon: UserPlus, disabled: true, badge: 'Soon' },
    ],
  },
  {
    id: 'communication',
    label: 'Communication',
    icon: MessageSquare,
    items: [
      { path: '/candidate/feedback', label: 'Feedback', icon: MessageSquare, disabled: true, badge: 'Soon' },
      { path: '/candidate/notifications', label: 'Notifications', icon: Bell, disabled: true, badge: 'Soon' },
    ],
  },
]

// ─── Recruiter Sidebar Groups ──────────────────────────────────────────
const RECRUITER_GROUPS = [
  {
    id: 'jobs',
    label: 'Jobs',
    icon: Briefcase,
    items: [
      { path: '/jobs/create', label: 'Create Job', icon: Plus },
      { path: '/jobs/manage', label: 'Manage Jobs', icon: Briefcase },
    ],
  },
  {
    id: 'candidates',
    label: 'Candidates',
    icon: Users,
    items: [
      { path: '/applications', label: 'Applications', icon: FileCheck },
      { path: '/rankings', label: 'Candidate Rankings', icon: Award },
      { path: '/pipeline', label: 'Pipeline', icon: TrendingUp, disabled: true, badge: 'Soon' },
    ],
  },
  {
    id: 'ai',
    label: 'AI',
    icon: Sparkles,
    items: [
      { path: '/job-match', label: 'Job Match', icon: Brain },
      { path: '/rankings', label: 'Rankings', icon: Award },
    ],
  },
  {
    id: 'communication',
    label: 'Communication',
    icon: MessageSquare,
    items: [
      { path: '/feedback', label: 'Feedback', icon: MessageSquare },
    ],
  },
]


// ─── Persist Collapse State ────────────────────────────────────────────
function getSavedCollapsed() {
  try {
    const saved = localStorage.getItem('sidebar_collapsed')
    return saved === 'true'
  } catch {
    return false
  }
}

function saveCollapsed(val) {
  try {
    localStorage.setItem('sidebar_collapsed', String(val))
  } catch { /* ignore */ }
}

// ─── Persist Expanded Section ──────────────────────────────────────────
function getSavedExpanded() {
  try {
    return localStorage.getItem('sidebar_expanded_section') || null
  } catch {
    return null
  }
}

function saveExpanded(val) {
  try {
    if (val) localStorage.setItem('sidebar_expanded_section', val)
    else localStorage.removeItem('sidebar_expanded_section')
  } catch { /* ignore */ }
}

// ─── NavItem ───────────────────────────────────────────────────────────
function NavItem({ item, currentPath, collapsed, onClick }) {
  const Icon = item.icon
  const active = currentPath === item.path

  const content = (
    <div
      className={`group flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
        active
          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
          : collapsed
            ? 'text-slate-400 hover:bg-slate-800/60 hover:text-white justify-center px-0'
            : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
      } ${collapsed && item.disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      title={collapsed ? item.label : undefined}
    >
      <Icon className={`h-4.5 w-4.5 shrink-0 ${active ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {!collapsed && item.badge && (
        <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
          {item.badge}
        </span>
      )}
    </div>
  )

  if (item.disabled) {
    return <div className="select-none">{content}</div>
  }

  return (
    <Link to={item.path} onClick={onClick} className="block no-underline">
      {content}
    </Link>
  )
}

// ─── Sidebar Section (accordion, only one open) ────────────────────────
function SidebarSection({ group, currentPath, isOpen, onToggle, collapsed, onClick }) {
  const Icon = group.icon
  const hasActiveChild = group.items.some((item) => item.path === currentPath)

  const handleToggle = () => {
    if (collapsed) {
      // In collapsed mode, open as popover-style
      onToggle()
    } else {
      onToggle()
    }
  }

  if (collapsed) {
    // Collapsed mode: show icon only, tooltip on hover
    return (
      <div className="group relative flex justify-center">
        <button
          onClick={handleToggle}
          className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${
            hasActiveChild
              ? 'text-blue-400 bg-blue-500/10'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/60'
          }`}
          title={group.label}
        >
          <Icon className="h-4.5 w-4.5 shrink-0" />
        </button>
        {/* When clicked in collapsed mode, show a temporary popover */}
        {isOpen && (
          <>
            <div
              className="absolute left-full ml-2 top-0 bg-slate-900 border border-slate-800 rounded-2xl p-3 min-w-[200px] shadow-2xl z-50"
              onMouseLeave={onToggle}
            >
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavItem
                    key={item.path}
                    item={item}
                    currentPath={currentPath}
                    collapsed={false}
                    onClick={onClick}
                  />
                ))}
              </div>
            </div>
            {/* Arrow */}
            <div className="absolute left-full ml-1.5 top-4 w-2 h-2 bg-slate-900 border-l border-t border-slate-800 rotate-45 z-50" />
          </>
        )}
      </div>
    )
  }

  return (
    <div className="select-none">
      {/* Section Header */}
      <button
        onClick={handleToggle}
        className={`group flex w-full items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
          hasActiveChild
            ? 'text-blue-400'
            : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon className="h-4.5 w-4.5 shrink-0" />
          <span>{group.label}</span>
        </div>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-300 ease-in-out ${
            isOpen ? 'rotate-0' : '-rotate-90'
          } ${hasActiveChild ? 'text-blue-400' : 'text-slate-600'}`}
        />
      </button>

      {/* Collapsible Items */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="ml-2 mt-1 space-y-0.5 border-l border-slate-800 pl-3">
          {group.items.map((item) => (
            <NavItem
              key={item.path}
              item={item}
              currentPath={currentPath}
              collapsed={false}
              onClick={onClick}
            />
          ))}
          {group.items.length === 0 && (
            <p className="px-4 py-2 text-xs text-slate-600 italic">Coming soon</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Profile Section (fixed at bottom) ─────────────────────────────────
function ProfileSection({ user, collapsed, onLogout }) {
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <div className="flex-shrink-0 border-t border-slate-800 pt-3 mt-auto">
      {/* Avatar + Name (or just avatar when collapsed) */}
      <button
        onClick={() => setProfileOpen(!profileOpen)}
        className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 hover:bg-slate-800/40 ${
          collapsed ? 'justify-center' : ''
        }`}
        title={collapsed ? user?.name : undefined}
      >
        <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-inner shrink-0">
          {user?.name ? user.name[0].toUpperCase() : <User className="h-4.5 w-4.5" />}
        </div>
        {!collapsed && (
          <>
            <div className="flex-1 overflow-hidden text-left">
              <h4 className="font-semibold text-sm text-white truncate leading-tight">
                {user?.name || 'User'}
              </h4>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${
                profileOpen ? 'rotate-180' : ''
              }`}
            />
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          profileOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className={`mt-1 space-y-0.5 ${collapsed ? 'px-0' : 'px-2'}`}>
          <button className="flex w-full items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all duration-200">
            <User className="h-4 w-4" />
            {!collapsed && <span>Portfolio</span>}
          </button>
          <button className="flex w-full items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all duration-200">
            <Settings className="h-4 w-4" />
            {!collapsed && <span>Settings</span>}
          </button>
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-xl text-sm text-rose-400 hover:text-white hover:bg-rose-500/10 transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── CollapsibleSidebar (main export) ──────────────────────────────────
export default function CollapsibleSidebar() {
  const { user, logout } = useContext(AuthContext)
  const location = useLocation()
  const currentPath = location.pathname
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(getSavedCollapsed)
  const [hoverSection, setHoverSection] = useState(null)

  // Determine which groups to show based on role
  const sidebarGroups = useMemo(() => {
    if (!user) return []
    return user.role === 'candidate' ? CANDIDATE_GROUPS : RECRUITER_GROUPS
  }, [user])

  // Single expanded section state (one at a time)
  const [expandedSection, setExpandedSection] = useState(() => {
    const saved = getSavedExpanded()
    if (saved) return saved
    // Auto-expand section containing active route
    const groups = !user ? [] : user.role === 'candidate' ? CANDIDATE_GROUPS : RECRUITER_GROUPS
    for (const group of groups) {
      if (group.items.some((item) => item.path === currentPath)) {
        return group.id
      }
    }
    return null
  })

  // Persist collapse state
  useEffect(() => {
    saveCollapsed(collapsed)
  }, [collapsed])

  // Persist expanded section
  useEffect(() => {
    saveExpanded(expandedSection)
  }, [expandedSection])

  // Toggle section: close others, open only clicked
  const toggleSection = useCallback((sectionId) => {
    setExpandedSection((prev) => (prev === sectionId ? null : sectionId))
    // When something is clicked in collapsed mode, clear hover popup concept
    setHoverSection(null)
  }, [])

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false)
  }, [])

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => !prev)
  }, [])

  // Auto-expand section containing active route when navigating
  useEffect(() => {
    for (const group of sidebarGroups) {
      if (group.items.some((item) => item.path === currentPath)) {
        setExpandedSection((prev) => {
          if (prev === group.id) return prev
          return group.id
        })
        break
      }
    }
  }, [currentPath, sidebarGroups])

  // Dashboard icon style - always visible
  const DashboardIcon = LayoutDashboard
  const isDashboardActive = currentPath === (user?.role === 'candidate' ? '/candidate/dashboard' : '/recruiter/dashboard')

  // ── Shared sidebar content ──────────────────────────────────────────
  const navigationContent = (
    <div className="flex flex-col h-full">
      {/* Collapse Button + Header */}
      <div className={`flex items-center mb-4 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Recruitment ATS
          </p>
        )}
        <button
          onClick={toggleCollapsed}
          className={`p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all duration-200 ${
            collapsed ? '' : ''
          }`}
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation - scrollable area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        <nav className="space-y-1">
          {/* Dashboard (standalone, always visible) */}
          <div className={collapsed ? 'flex justify-center' : ''}>
            <Link
              to={user?.role === 'candidate' ? '/candidate/dashboard' : '/recruiter/dashboard'}
              onClick={closeMobileMenu}
              className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isDashboardActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                  : collapsed
                    ? 'text-slate-400 hover:bg-slate-800/60 hover:text-white justify-center px-0'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
              }`}
              title={collapsed ? 'Dashboard' : undefined}
            >
              <DashboardIcon className={`h-4.5 w-4.5 shrink-0 ${isDashboardActive ? 'text-white' : 'text-slate-500'}`} />
              {!collapsed && <span>Dashboard</span>}
            </Link>
          </div>

          {/* Collapsible Sections */}
          <div className={`space-y-0.5 ${collapsed ? 'flex flex-col items-center gap-1' : ''}`}>
            {sidebarGroups.map((group) => (
              <SidebarSection
                key={group.id}
                group={group}
                currentPath={currentPath}
                isOpen={expandedSection === group.id}
                onToggle={() => toggleSection(group.id)}
                collapsed={collapsed}
                onClick={closeMobileMenu}
              />
            ))}
          </div>
        </nav>
      </div>

      {/* Profile Section - always at bottom */}
      {user && (
        <ProfileSection user={user} collapsed={collapsed} onLogout={logout} />
      )}
    </div>
  )

  return (
    <>
      {/* MOBILE TOGGLE BUTTON */}
      <div className="md:hidden fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-105"
          aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* MOBILE OVERLAY */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* DESKTOP SIDEBAR - fixed, collapsible */}
      <aside
        className={`hidden md:flex flex-col bg-slate-900 text-slate-300 fixed left-0 top-[72px] bottom-0 border-r border-slate-800 z-30 transition-all duration-300 ease-in-out ${
          collapsed ? 'w-[80px]' : 'w-[280px]'
        }`}
      >
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          {navigationContent}
        </div>
      </aside>

      {/* MOBILE SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 w-[280px] bg-slate-900 text-slate-300 z-50 flex flex-col transform transition-transform duration-300 ease-in-out md:hidden border-r border-slate-800 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!mobileMenuOpen}
      >
        <div className="flex-1 flex flex-col p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <span className="text-xl font-bold text-blue-500">IntelliHire</span>
            <button
              onClick={closeMobileMenu}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Close Navigation Menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {navigationContent}
          </div>
        </div>
      </aside>
    </>
  )
}
