import { Badge } from '@/components/ui/badge'
import type { EstadoSocio } from '@/mocks/types'

const estilos: Record<EstadoSocio, string> = {
  activo: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  moroso: 'bg-red-500/15 text-red-700 dark:text-red-400',
  congelado: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
}

const etiquetas: Record<EstadoSocio, string> = {
  activo: 'Activo',
  moroso: 'Moroso',
  congelado: 'Congelado',
}

type SocioEstadoBadgeProps = {
  estado: EstadoSocio
}

export function SocioEstadoBadge({ estado }: SocioEstadoBadgeProps) {
  return <Badge className={estilos[estado]}>{etiquetas[estado]}</Badge>
}
