import {
  LayoutDashboard,
  CreditCard,
  FileText,
  Megaphone,
  Users,
  Home,
  AlertTriangle,
  Calendar,
  CheckSquare,
  User,
  Settings,
  FolderOpen,
  Map,
  type LucideIcon
} from 'lucide-react'
import { NAVIGATION_DATA, type NavigationDataItem } from './navigationData'

export interface NavigationItem {
  href: string
  label: string
  icon: LucideIcon
  roles: string[]
}

// Map icon string names to actual Lucide component instances
const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  CreditCard,
  FileText,
  Megaphone,
  Users,
  Home,
  AlertTriangle,
  Calendar,
  CheckSquare,
  User,
  Settings,
  FolderOpen,
  Map
}

// Generate the runtime navigation items configuration
export const NAVIGATION_ITEMS: NavigationItem[] = NAVIGATION_DATA.map((item) => ({
  href: item.href,
  label: item.label,
  roles: item.roles,
  icon: ICON_MAP[item.iconName] || User // Fallback to User icon
}))

export const ROUTE_PERMISSIONS = NAVIGATION_DATA.reduce<Record<string, string[]>>((acc, item) => {
  acc[item.href] = item.roles
  return acc
}, {})

// Helper to filter nav items by role
export function getNavigationForRole(role: string): NavigationItem[] {
  return NAVIGATION_ITEMS.filter((item) => item.roles.includes(role))
}
