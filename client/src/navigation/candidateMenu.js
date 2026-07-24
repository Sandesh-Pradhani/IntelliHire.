/**
 * Candidate Sidebar Navigation Configuration
 *
 * Candidate features only:
 * - Jobs (Browse Jobs, My Applications)
 * - AI (Resume Analysis, Job Match, Career Insights)
 * - Portfolio (My Portfolio, Settings)
 * - Communication (Notifications)
 */
import ROUTES from '../constants/routes'
import {
  Briefcase,
  FileCheck,
  BarChart3,
  Brain,
  TrendingUp,
  FolderKanban,
  Award,
  Sparkles,
  Settings,
  Bell,
  BarChart2,
} from 'lucide-react'

const CANDIDATE_MENU = [
  {
    id: 'jobs',
    label: 'Jobs',
    icon: Briefcase,
    items: [
      { path: ROUTES.CANDIDATE.JOBS, label: 'Browse Jobs', icon: Briefcase },
      { path: ROUTES.CANDIDATE.APPLICATIONS, label: 'My Applications', icon: FileCheck },
    ],
  },
  {
    id: 'ai',
    label: 'AI',
    icon: Sparkles,
    items: [
      { path: ROUTES.CANDIDATE.RESUME_ANALYSIS, label: 'Resume Analysis', icon: BarChart3 },
      { path: ROUTES.CANDIDATE.JOB_MATCH, label: 'Job Match', icon: Brain },
      { path: ROUTES.CANDIDATE.CAREER_INSIGHTS, label: 'Career Insights', icon: TrendingUp },
    ],
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    icon: FolderKanban,
    items: [
      { path: ROUTES.CANDIDATE.PORTFOLIO, label: 'My Portfolio', icon: Award },
      { path: ROUTES.CANDIDATE.ANALYTICS, label: 'Analytics', icon: BarChart2 },
      { path: ROUTES.CANDIDATE.SETTINGS, label: 'Settings', icon: Settings },
    ],
  },
  {
    id: 'communication',
    label: 'Communication',
    icon: Bell,
    items: [
      { path: ROUTES.CANDIDATE.NOTIFICATIONS, label: 'Notifications', icon: Bell },
    ],
  },
]

export default CANDIDATE_MENU
