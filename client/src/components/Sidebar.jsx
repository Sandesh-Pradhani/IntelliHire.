import { useState, useEffect, useCallback, useContext, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
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
  ChevronDown,
  Menu,
  X,
  User,
  LogOut,
  BarChart3,
  Users
} from 'lucide-react'

// ─── Role-based Group Definitions ────────────────────────────────────────────
const CANDIDATE_GROUPS = [
  {
    id: 'candidate-management',
    label: 'My Profile',
    icon: User,
    role: 'candidate',
    items: [
      { path: '/resume-upload', label: 'Upload Resume', icon: UploadCloud },
      { path: '/resume-history', label: 'Resume History', icon: History },
      { path: '/academic-profile', label: 'Academic Profile', icon: GraduationCap },
      { path: '/projects', label: 'Projects', icon: FolderKanban, disabled: true, badge: 'Soon' },
      { path: '/certificates', label: 'Certificates', icon: Award, disabled: true, badge: 'Soon' },
      { path: '/coding-profiles', label: 'Coding Profiles', icon: Code2, disabled: true, badge: 'Soon' },
    ],
  },
  {
    id: 'candidate-applications',
    label: 'Applications',
    icon: FileCheck,
    role: 'candidate',
    items: [
      { path: '/jobs', label: 'Browse Jobs', icon: Briefcase },
      { path: '/candidate/applications', label: 'My Applications', icon: FileCheck },
    ],
  },
]

const RECRUITER_GROUPS = [
  {
    id: 'recruitment',
    label: 'Recruitment',
    icon: Briefcase,
    role: 'recruiter',
    items: [
      { path: '/jobs', label: 'Jobs', icon: Briefcase },
      { path: '/applications', label: 'Applications', icon: FileCheck },
      { path: '/job-match', label: 'AI Job Matching', icon: Sparkles },
      { path: '/rankings', label: 'Candidate Rankings', icon: Award },
    ],
  },
  {
    id: 'communication',
    label: 'Communication',
    icon: MessageSquare,
    role: 'recruiter',
    items: [{ path: '/feedback', label: 'Feedback', icon: MessageSquare }],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    role: 'recruiter',
    items: [],
  },
]

// ─── Persisted expanded state ────────────────────────────────────────────────
function getExpandedDefaults(groups) {
  try {
    const saved = localStorage.getItem('sidebar_expanded_groups')
    if (saved) return JSON.parse(saved)
  } catch {
    /* ignore */
  }
  const path = window.location.pathname
  for (const group of groups) {
    if (group.items.some((item) => item.path === path)) return { [group.id]: true }
  }
  return {}
}

// ─── NavItem ─────────────────────────────────────────────────────────────────
function NavItem({ item, currentPath, onClick }) {
  const Icon = item.icon
  const active = currentPath === item.path

  if (item.disabled) {
    return (
      <div className="group flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 cursor-not-allowed select-none">
        <div className="flex items-center gap-3.5">
          <Icon className="h-4.5 w-4.5 shrink-0 text-slate-600" />
          <span>{item.label}</span>
        </div>
        {item.badge && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
            {item.badge}
          </span>
        )}
      </div>
    )
  }

  return (
    <Link
      to={item.path}
      onClick={onClick}
      className={`group flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
        active
          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
          : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
      }`}
    >
      <Icon
        className={`h-4.5 w-4.5 shrink-0 ${
          active ? 'text-white' : 'text-slate-500 group-hover:text-white'
        }`}
      />
      {item.label}
    </Link>
  )
}

// ─── SidebarGroup (collapsible accordion) ────────────────────────────────────
function SidebarGroup({ group, currentPath, isOpen, onToggle, onClick }) {
  const Icon = group.icon
  const hasActiveChild = group.items.some((item) => item.path === currentPath)

  return (
    <div className="select-none">
      {/* Group Header */}
      <button
        onClick={onToggle}
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
              onClick={onClick}
            />
          ))}
          {group.items.length === 0 && (
            <p className="px-4 py-2 text-xs text-slate-600 italic">
              Coming soon
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── UserProfile ─────────────────────────────────────────────────────────────
function UserProfile({ user, onLogout, closeMenu }) {
  const handleLogout = () => {
    if (closeMenu) closeMenu()
    onLogout()
  }

  return (
    <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
      <div className="flex items-center gap-3 px-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-inner">
          {user.name ? user.name[0].toUpperCase() : <User className="h-5 w-5" />}
        </div>
        <div className="overflow-hidden">
          <h4 className="font-semibold text-sm text-white truncate leading-tight">
            {user.name}
          </h4>
          <p className="text-xs text-slate-500 truncate leading-tight mt-0.5">
            {user.email || 'Recruiter Account'}
          </p>
        </div>
      </div>
      <button
        onClick={handleLogout}
        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-500/10 active:bg-rose-500/20 transition-all duration-200"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>
    </div>
  )
}

// ─── Sidebar (main export) ───────────────────────────────────────────────────
export default function Sidebar() {
  const { user, logout } = useContext(AuthContext)
  const location = useLocation()
  const currentPath = location.pathname
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  // Determine which groups to show based on user role (defined before useState that uses it)
  const sidebarGroups = useMemo(() => {
    if (!user) return []
    return user.role === 'candidate' ? CANDIDATE_GROUPS : RECRUITER_GROUPS
  }, [user])

  const [expandedGroups, setExpandedGroups] = useState(() => getExpandedDefaults(sidebarGroups))

  // Persist expanded state
  useEffect(() => {
    try {
      localStorage.setItem('sidebar_expanded_groups', JSON.stringify(expandedGroups))
    } catch {
      /* ignore */
    }
  }, [expandedGroups])

  const toggleGroup = useCallback((groupId) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }))
  }, [])

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false)
  }, [])

  // Auto-expand group containing active route
  useEffect(() => {
    for (const group of sidebarGroups) {
      if (group.items.some((item) => item.path === currentPath)) {
        setExpandedGroups((prev) => {
          if (prev[group.id]) return prev
          return { ...prev, [group.id]: true }
        })
        break
      }
    }
  }, [currentPath, sidebarGroups])

  // ── Shared sidebar content ──────────────────────────────────────────────
  const sidebarContent = (
    <>
      {/* Dashboard (standalone, always visible) */}
      <div className="mb-2">
        <NavItem
          item={{
            path: user?.role === 'candidate' ? '/candidate/dashboard' : '/recruiter/dashboard',
            label: 'Dashboard',
            icon: LayoutDashboard
          }}
          currentPath={currentPath}
          onClick={closeMobileMenu}
        />
      </div>

      {/* Collapsible Groups */}
      <div className="space-y-0.5">
        {sidebarGroups.map((group) => (
          <SidebarGroup
            key={group.id}
            group={group}
            currentPath={currentPath}
            isOpen={!!expandedGroups[group.id]}
            onToggle={() => toggleGroup(group.id)}
            onClick={closeMobileMenu}
          />
        ))}
      </div>
    </>
  )

  return (
    <>
      {/* MOBILE TOGGLE BUTTON (fixed bottom-right) */}
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

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-72 bg-slate-900 text-slate-300 fixed left-0 top-16 bottom-0 border-r border-slate-800 z-30 transition-all duration-300">
        <div className="flex-1 flex flex-col justify-between p-6">
          <div>
            <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Recruitment ATS
            </p>
            <nav className="space-y-1" aria-label="Main Navigation">
              {sidebarContent}
            </nav>
          </div>
          {user && <UserProfile user={user} onLogout={logout} />}
        </div>
      </aside>

      {/* MOBILE SIDEBAR (slide-in) */}
      <aside
        className={`fixed inset-y-0 left-0 w-72 bg-slate-900 text-slate-300 z-50 flex flex-col justify-between p-6 transform transition-transform duration-300 ease-in-out md:hidden border-r border-slate-800 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!mobileMenuOpen}
      >
        <div>
          <div className="flex items-center justify-between mb-6">
            <span className="text-xl font-bold text-blue-500">IntelliHire Menu</span>
            <button
              onClick={closeMobileMenu}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Close Navigation Menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Recruitment ATS
          </p>
          <nav className="space-y-1" aria-label="Main Navigation">
            {sidebarContent}
          </nav>
        </div>
        {user && (
          <UserProfile user={user} onLogout={logout} closeMenu={closeMobileMenu} />
        )}
      </aside>
    </>
  )
}