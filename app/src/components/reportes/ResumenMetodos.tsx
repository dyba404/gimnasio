import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatoSoles } from '@/lib/format'
import { cn } from '@/lib/utils'
import { etiquetaMetodo } from '@/mocks/caja-data'
import type { MetodoPago } from '@/mocks/caja-data'
import type { ResumenMetodo } from '@/components/pagos/logica-pagos'

const clasesMetodo: Record<MetodoPago, string> = {
  efectivo: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  yape: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
  plin: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
}

const barraMetodo: Record<MetodoPago, string> = {
  efectivo: 'bg-emerald-500',
  yape: 'bg-purple-500',
  plin: 'bg-sky-500',
}

type ResumenMetodosProps = {
  datos: readonly ResumenMetodo[]
}

export function ResumenMetodos({ datos }: ResumenMetodosProps) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Pagos por método</CardTitle>
      </CardHeader>
      <CardContent>
        {datos.every((dato) => dato.cantidad === 0) ? (
          <p className="rounded-lg border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
            Sin cobros por método en este periodo
          </p>
        ) : (
          <div className="space-y-5">
            {datos.map((dato) => (
              <div key={dato.metodo} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span
                    className={cn(
                      'inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium',
                      clasesMetodo[dato.metodo],
                    )}
                  >
                    {etiquetaMetodo[dato.metodo]}
                  </span>
                  <span className="flex items-baseline gap-2 tabular-nums">
                    <span className="text-xs text-muted-foreground">{dato.porcentaje}%</span>
                    <span className="font-medium">{formatoSoles(dato.total)}</span>
                  </span>
                </div>
                <div
                  className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-valuenow={dato.porcentaje}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Porcentaje de cobros con ${etiquetaMetodo[dato.metodo]}`}
                >
                  <div
                    className={cn('h-full rounded-full transition-all', barraMetodo[dato.metodo])}
                    style={{ width: `${dato.porcentaje}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {dato.cantidad} {dato.cantidad === 1 ? 'pago' : 'pagos'}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
