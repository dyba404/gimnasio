import type { LucideIcon } from 'lucide-react'
import {
  Banknote,
  BarChart3,
  CreditCard,
  Dumbbell,
  Gift,
  LayoutDashboard,
  QrCode,
  Settings,
  ShoppingCart,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react'

export type NavItem = {
  title: string
  path: string
  icon: LucideIcon
}

export const navItems: readonly NavItem[] = [
  { title: 'Panel', path: '/', icon: LayoutDashboard },
  { title: 'Socios', path: '/socios', icon: Users },
  { title: 'Prospectos', path: '/prospectos', icon: UserPlus },
  { title: 'Membresías', path: '/membresias', icon: CreditCard },
  { title: 'Pagos', path: '/pagos', icon: Banknote },
  { title: 'Check-in', path: '/checkin', icon: QrCode },
  { title: 'Clases', path: '/clases', icon: Dumbbell },
  { title: 'Caja', path: '/caja', icon: Wallet },
  { title: 'Tienda', path: '/tienda', icon: ShoppingCart },
  { title: 'Reportes', path: '/reportes', icon: BarChart3 },
  { title: 'Marketing', path: '/marketing', icon: Gift },
  { title: 'Cobranza', path: '/cobranza', icon: Banknote },
  { title: 'Configuración', path: '/config', icon: Settings },
] as const
