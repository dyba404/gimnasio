import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { claseEstado, etiquetaEstado } from '@/mocks/prospectos'
import type { EstadoProspecto } from '@/mocks/prospectos'

type ProspectoEstadoBadgeProps = {
  estado: EstadoProspecto
}

export function ProspectoEstadoBadge({ estado }: ProspectoEstadoBadgeProps) {
  return (
    <Badge variant="secondary" className={cn('text-[11px]', claseEstado[estado])}>
      {etiquetaEstado[estado]}
    </Badge>
  )
}
