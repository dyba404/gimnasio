import { Badge } from '@/components/ui/badge'
import { diasParaVencer } from '@/mocks/data'

type VencimientoBadgeProps = {
  fechaFin: string
}

export function VencimientoBadge({ fechaFin }: VencimientoBadgeProps) {
  const dias = diasParaVencer(fechaFin)
  if (dias < 0) {
    return (
      <Badge className="bg-red-500/15 text-red-700 dark:text-red-400">
        Vencida
      </Badge>
    )
  }
  if (dias === 0) {
    return (
      <Badge className="bg-red-500/15 text-red-700 dark:text-red-400">
        Vence hoy
      </Badge>
    )
  }
  const texto = `${dias} ${dias === 1 ? 'día' : 'días'}`
  if (dias <= 7) {
    return (
      <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400">
        {texto}
      </Badge>
    )
  }
  return (
    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
      {texto}
    </Badge>
  )
}
