import { CalendarClock } from 'lucide-react'
import { sinCongelar } from '@/components/memberships/congelamiento'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { abreviarTexto } from '@/lib/format'
import { diasParaVencer } from '@/mocks/data'
import type { EstadoMembresia, Membresia, Plan, Socio } from '@/mocks/types'

const etiquetasEstado: Record<EstadoMembresia, string> = {
  vigente: 'vigente',
  'por-vencer': 'por vencer',
  vencida: 'vencida',
}

function etiquetaVencimiento(dias: number): string {
  if (dias === 0) return 'vence hoy'
  if (dias < 0) {
    const absolutos = Math.abs(dias)
    return `vencida hace ${absolutos} ${absolutos === 1 ? 'día' : 'días'}`
  }
  return `en ${dias} ${dias === 1 ? 'día' : 'días'}`
}

type VencimientosProximosProps = {
  membresias: readonly Membresia[]
  socios: ReadonlyMap<string, Socio>
  planes: ReadonlyMap<string, Plan>
  onRenovar: (membresiaId: string) => void
}

export function VencimientosProximos({
  membresias,
  socios,
  planes,
  onRenovar,
}: VencimientosProximosProps) {
  const proximas = sinCongelar(membresias)
    .filter((membresia) => diasParaVencer(membresia.fechaFin) <= 14)
    .sort((a, b) => diasParaVencer(a.fechaFin) - diasParaVencer(b.fechaFin))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="size-4 text-muted-foreground" />
          Vencimientos próximos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {proximas.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No hay vencimientos próximos. Todo al día.
          </p>
        ) : (
          <ul className="space-y-3">
            {proximas.map((membresia) => {
              const socio = socios.get(membresia.socioId)
              const plan = planes.get(membresia.planId)
              const dias = diasParaVencer(membresia.fechaFin)
              return (
                <li
                  key={membresia.id}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <p
                      className="text-sm font-medium"
                      title={socio?.nombre ?? 'Socio'}
                    >
                      {abreviarTexto(socio?.nombre ?? 'Socio', 20)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {plan?.nombre ?? '—'} · {etiquetasEstado[membresia.estado]}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge
                      className={
                        dias < 0
                          ? 'bg-red-500/15 text-red-700 dark:text-red-400'
                          : dias <= 7
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                            : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                      }
                    >
                      {etiquetaVencimiento(dias)}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => onRenovar(membresia.id)}>
                      Renovar
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
