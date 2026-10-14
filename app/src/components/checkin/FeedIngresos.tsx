import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Ingreso, ResultadoIngreso } from '@/mocks/caja-data'

const clasesResultado: Record<ResultadoIngreso, string> = {
  aceptado: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  cobrado: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
  denegado: 'bg-red-500/15 text-red-600 dark:text-red-400',
  legado: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
}

const etiquetaResultado: Record<ResultadoIngreso, string> = {
  aceptado: 'Ingresó',
  cobrado: 'Cobró y entró',
  denegado: 'Denegado',
  legado: 'QR legado',
}

type FeedIngresosProps = {
  ingresos: readonly Ingreso[]
}

export function FeedIngresos({ ingresos }: FeedIngresosProps) {
  const ingresosHoy = ingresos.filter(
    (ingreso) => ingreso.resultado !== 'denegado',
  ).length

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actividad del día</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-4xl font-semibold tabular-nums">{ingresosHoy}</p>
          <p className="text-sm text-muted-foreground">
            {ingresosHoy === 1 ? 'ingreso hoy' : 'ingresos hoy'}
          </p>
        </div>
        {ingresos.length === 0 ? (
          <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            Aún no hay ingresos registrados hoy
          </p>
        ) : (
          <ul className="max-h-[460px] space-y-2 overflow-y-auto">
            {ingresos.map((ingreso) => (
              <li
                key={ingreso.id}
                className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{ingreso.socioNombre}</p>
                  <p className="text-xs text-muted-foreground">{ingreso.socioCodigo}</p>
                  {ingreso.motivo && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{ingreso.motivo}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {ingreso.hora}
                  </span>
                  <Badge
                    variant="secondary"
                    className={cn('text-[11px]', clasesResultado[ingreso.resultado])}
                  >
                    {etiquetaResultado[ingreso.resultado]}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
