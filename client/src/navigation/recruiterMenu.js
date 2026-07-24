/**
 * Recruiter Sidebar Navigation Configuration
 *
 * Recruiter features only:
 * - Jobs (Create Job, Manage Jobs)
 * - Candidates (Applications, Candidate Rankings, Portfolio Viewer, Settings)
 * - AI (Candidate Match)
 * - Communication (Feedback, Notifications)
 */
import ROUTES from '../constants/routes'
import {
  Briefcase,
  Plus,
  Users,
  FileCheck,
  Award,
  TrendingUp,
  Brain,
  MessageSquare,
  Sparkles,
  Settings,
  Bell,
  BarChart2,
} from 'lucide-react'

const RECRUITER_MENU = [
  {
    id: 'jobs',
    label: 'Jobs',
    icon: Briefcase,
    items: [
      { path: ROUTES.RECRUITER.JOB_CREATE, label: 'Create Job', icon: Plus },
      { path: ROUTES.RECRUITER.JOB_MANAGE, label: 'Manage Jobs', icon: Briefcase },
    ],
  },
  {
    id: 'candidates',
    label: 'Candidates',
    icon: Users,
    items: [
      { path: ROUTES.RECRUITER.APPLICATIONS, label: 'Applications', icon: FileCheck },
      { path: ROUTES.RECRUITER.RANKINGS, label: 'Candidate Rankings', icon: Award },
      { path: ROUTES.RECRUITER.PORTFOLIO, label: 'Portfolio Viewer', icon: TrendingUp },
      { path: ROUTES.RECRUITER.ANALYTICS, label: 'Analytics', icon: BarChart2 },
      { path: ROUTES.RECRUITER.SETTINGS, label: 'Settings', icon: Settings },
    ],
  },
  {
    id: 'ai',
    label: 'AI',
    icon: Sparkles,
    items: [
      { path: ROUTES.RECRUITER.JOB_MATCH, label: 'Candidate Match', icon: Brain },
    ],
  },
  {
    id: 'communication',
    label: 'Communication',
    icon: MessageSquare,
    items: [
      { path: ROUTES.RECRUITER.FEEDBACK, label: 'Feedback', icon: MessageSquare },
      { path: ROUTES.RECRUITER.NOTIFICATIONS, label: 'Notifications', icon: Bell },
    ],
  },
]

export default RECRUITER_MENU
