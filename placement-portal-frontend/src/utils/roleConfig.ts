import type { Role } from '../context/AuthContext'
import { GraduationCap, Shield, Briefcase, Building2, BookOpenCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface RoleTheme {
  label: string
  icon: LucideIcon
  /** Solid accent color (hex) for gradient hero, sidebar accent, etc. */
  accent: string
  accentLight: string
  /** Secondary accent for gradient end */
  accentEnd: string
  /** CSS gradient string for the dashboard hero banner */
  heroGradient: string
  /** Sidebar top-border accent */
  sidebarAccent: string
}

const roleThemes: Record<Role, RoleTheme> = {
  student: {
    label: 'Student',
    icon: GraduationCap,
    accent: '#2563eb',
    accentLight: '#dbeafe',
    accentEnd: '#3b82f6',
    heroGradient: 'linear-gradient(135deg, #1e40af 0%, #2563eb 55%, #60a5fa 100%)',
    sidebarAccent: '#2563eb',
  },
  admin: {
    label: 'Admin',
    icon: Shield,
    accent: '#7c3aed',
    accentLight: '#ede9fe',
    accentEnd: '#8b5cf6',
    heroGradient: 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 55%, #a78bfa 100%)',
    sidebarAccent: '#7c3aed',
  },
  recruiter: {
    label: 'Recruiter',
    icon: Briefcase,
    accent: '#059669',
    accentLight: '#d1fae5',
    accentEnd: '#10b981',
    heroGradient: 'linear-gradient(135deg, #047857 0%, #059669 55%, #34d399 100%)',
    sidebarAccent: '#059669',
  },
  hod: {
    label: 'HOD',
    icon: Building2,
    accent: '#059669',
    accentLight: '#d1fae5',
    accentEnd: '#10b981',
    heroGradient: 'linear-gradient(135deg, #047857 0%, #059669 55%, #34d399 100%)',
    sidebarAccent: '#059669',
  },
  tpo: {
    label: 'TPO',
    icon: BookOpenCheck,
    accent: '#0369a1',
    accentLight: '#e0f2fe',
    accentEnd: '#0ea5e9',
    heroGradient: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 55%, #38bdf8 100%)',
    sidebarAccent: '#0369a1',
  },
}

export function getRoleTheme(role: Role): RoleTheme {
  return roleThemes[role] ?? roleThemes.student
}

/** Dashboard title per role */
export function getDashboardTitle(role: Role): string {
  switch (role) {
    case 'student':
      return 'Student Dashboard'
    case 'admin':
      return 'Admin Dashboard'
    case 'tpo':
    case 'hod':
      return 'TPO Dashboard'
    case 'recruiter':
      return 'Recruiter Dashboard'
    default:
      return 'Dashboard'
  }
}
