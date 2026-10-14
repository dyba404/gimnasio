import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatoSoles } from '@/lib/format'
import { cn } from '@/lib/utils'
import { etiquetaMetodo, etiquetaConcepto } from '@/mocks/caja-data'
import type { MetodoPago, MovimientoCaja } from '@/mocks/caja-data'

const clasesMetodo: Record<MetodoPago, string> = {
  efectivo: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  yape: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
  plin: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
}

const metodos: readonly MetodoPago[] = ['efectivo', 'yape', 'plin']

type TablaMovimientosProps = {
  movimientos: readonly MovimientoCaja[]
}

export function TablaMovimientos({ movimientos }: TablaMovimientosProps) {
  const subtotal = (metodo: MetodoPago) =>
    movimientos
      .filter((m) => m.metodo === metodo)
      .reduce((suma, m) => suma + m.monto, 0)
  const subtotales = metodos
    .map((metodo) => ({ metodo, monto: subtotal(metodo) }))
    .filter((item) => item.monto > 0)
  const total = movimientos.reduce((suma, m) => suma + m.monto, 0)

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Movimientos del día</CardTitle>
      </CardHeader>
      <CardContent>
        {movimientos.length === 0 ? (
          <p className="rounded-lg border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
            Sin movimientos registrados todavía
          </p>
        ) : (
          <div className="-mx-2 overflow-x-auto px-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs tracking-wide text-muted-foreground uppercase">
                  <th className="h-10 px-1 font-medium md:px-3">Hora</th>
                  <th className="h-10 px-1 font-medium md:px-3">Socio</th>
                  <th className="h-10 px-1 font-medium md:px-3">Concepto</th>
                  <th className="hidden h-10 px-1 font-medium md:table-cell md:px-3">
                    Método
                  </th>
                  <th className="h-10 px-1 text-right font-medium md:px-3">Monto</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((m) => (
                  <tr key={m.id} className="border-t">
                    <td className="px-1 py-3 tabular-nums text-muted-foreground md:px-3">
                      {m.hora}
                    </td>
                    <td className="max-w-24 truncate px-1 py-3 font-medium md:max-w-48 md:px-3">
                      {m.socioNombre}
                    </td>
                    <td className="px-1 py-3 text-muted-foreground md:px-3">
                      {etiquetaConcepto[m.concepto]}
                    </td>
                    <td className="hidden px-1 py-3 md:table-cell md:px-3">
                      <Badge
                        variant="secondary"
                        className={cn('text-[11px]', clasesMetodo[m.metodo])}
                      >
                        {etiquetaMetodo[m.metodo]}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-1 py-3 text-right font-medium tabular-nums md:px-3">
                      {formatoSoles(m.monto)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 bg-muted/50">
                  <td colSpan={5} className="px-3 py-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
                      <span className="text-xs font-medium text-muted-foreground">
                        Subtotales por método
                      </span>
                      <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1.5">
                        {subtotales.map(({ metodo, monto }) => (
                          <span
                            key={metodo}
                            className="flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums"
                          >
                            <Badge
                              variant="secondary"
                              className={cn('text-[11px]', clasesMetodo[metodo])}
                            >
                              {etiquetaMetodo[metodo]}
                            </Badge>
                            {formatoSoles(monto)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </td>
                </tr>
                <tr className="border-t bg-muted/50">
                  <td colSpan={5} className="px-3 py-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Total</span>
                      <span className="text-base font-semibold tabular-nums">
                        {formatoSoles(total)}
                      </span>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
