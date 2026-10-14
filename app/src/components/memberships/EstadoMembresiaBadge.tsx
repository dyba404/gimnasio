import { Badge } from '@/components/ui/badge'
import type { EstadoMembresia } from '@/mocks/types'

const estilos: Record<EstadoMembresia, string> = {
  vigente: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  'por-vencer': 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  vencida: 'bg-red-500/15 text-red-700 dark:text-red-400',
}

const etiquetas: Record<EstadoMembresia, string> = {
  vigente: 'Vigente',
  'por-vencer': 'Por vencer',
  vencida: 'Vencida',
}

type EstadoMembresiaBadgeProps = {
  estado: EstadoMembresia
}

export function EstadoMembresiaBadge({ estado }: EstadoMembresiaBadgeProps) {
  return <Badge className={estilos[estado]}>{etiquetas[estado]}</Badge>
}
