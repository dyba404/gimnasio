import type { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export type KpiPanel = {
  titulo: string
  valor: string
  /** Etiqueta pequeña bajo el valor; ausente cuando no hay dato real. */
  tendencia?: string
  icono: LucideIcon
  /** Tooltip del valor, p. ej. cuando la carga remota falló. */
  title?: string
}

type KpiCardsProps = {
  kpis: readonly KpiPanel[]
}

export function KpiCards({ kpis }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {kpis.map((kpi) => (
        <Card key={kpi.titulo} className="gap-3 py-4 sm:gap-6 sm:py-6">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
              {kpi.titulo}
              <kpi.icono className="size-4" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 px-4 sm:px-6">
            <p className="text-2xl font-semibold tabular-nums sm:text-3xl" title={kpi.title}>
              {kpi.valor}
            </p>
            {kpi.tendencia !== undefined && (
              <p className="text-xs text-muted-foreground">{kpi.tendencia}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
