/**
 * Candidate Sidebar Navigation Configuration
 *
 * Candidate features only:
 * - Jobs (Browse Jobs, My Applications, Analytics)
 * - AI (Resume Analysis, Job Match, Career Insights)
 * - Communication (Notifications)
 */
import ROUTES from '../constants/routes'
import {
  Briefcase,
  FileCheck,
  BarChart3,
  Brain,
  MessageCircle,
  Route,
  Fingerprint,
  TrendingUp,
  Sparkles,
  Bell,
  BarChart2,
  MessageSquare,
  Code2,
  Award,
} from 'lucide-react'

const CANDIDATE_MENU = [
  {
    id: 'intelligence',
    label: 'Intelligence',
    icon: Fingerprint,
    items: [
      { path: ROUTES.CANDIDATE.DIGITAL_TWIN, label: 'Digital Twin', icon: Fingerprint },
    ],
  },
  {
    id: 'jobs',
    label: 'Jobs',
    icon: Briefcase,
    items: [
      { path: ROUTES.CANDIDATE.JOBS, label: 'Browse Jobs', icon: Briefcase },
      { path: ROUTES.CANDIDATE.APPLICATIONS, label: 'My Applications', icon: FileCheck },
      { path: ROUTES.CANDIDATE.ANALYTICS, label: 'Analytics', icon: BarChart2 },
    ],
  },
  {
    id: 'ai',
    label: 'AI',
    icon: Sparkles,
    items: [
      { path: ROUTES.CANDIDATE.COPILOT, label: 'AI Career Coach', icon: MessageCircle },
      { path: ROUTES.CANDIDATE.LEARNING_ROADMAP, label: 'Learning Roadmap', icon: Route },
      { path: ROUTES.CANDIDATE.RESUME_ANALYSIS, label: 'Resume Analysis', icon: BarChart3 },
      { path: ROUTES.CANDIDATE.JOB_MATCH, label: 'Job Match', icon: Brain },
      { path: ROUTES.CANDIDATE.CAREER_INSIGHTS, label: 'Career Insights', icon: TrendingUp },
      { path: ROUTES.CANDIDATE.CODING_PROFILE, label: 'Coding Profile', icon: Code2 },
      { path: ROUTES.CANDIDATE.PORTFOLIO_CERTIFICATES, label: 'Certificates', icon: Award },
    ],
  },
  {
    id: 'communication',
    label: 'Communication',
    icon: Bell,
    items: [
      { path: ROUTES.CANDIDATE.NOTIFICATIONS, label: 'Notifications', icon: Bell },
      { path: ROUTES.CANDIDATE.FEEDBACK, label: 'Feedback', icon: MessageSquare },
    ],
  },
]

export default CANDIDATE_MENU
