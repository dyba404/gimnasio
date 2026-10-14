import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatoSoles } from '@/lib/format'
import { cn } from '@/lib/utils'
import { formatoFecha } from '@/mocks/data'
import { etiquetaCategoria } from '@/mocks/gastos'
import type { CategoriaGasto, Gasto } from '@/mocks/gastos'

const clasesCategoria: Record<CategoriaGasto, string> = {
  alquiler: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  servicios: 'bg-teal-500/15 text-teal-600 dark:text-teal-400',
  sueldos: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  equipamiento: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  marketing: 'bg-pink-500/15 text-pink-600 dark:text-pink-400',
  otros: 'bg-slate-500/15 text-slate-600 dark:text-slate-400',
}

type TablaGastosRecientesProps = {
  gastos: readonly Gasto[]
}

export function TablaGastosRecientes({ gastos }: TablaGastosRecientesProps) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Últimos gastos</CardTitle>
      </CardHeader>
      <CardContent>
        {gastos.length === 0 ? (
          <p className="rounded-lg border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
            Sin gastos registrados en este periodo
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs tracking-wide text-muted-foreground uppercase">
                  <th className="hidden h-9 pb-2 font-medium md:table-cell">Fecha</th>
                  <th className="h-9 pb-2 font-medium">Descripción</th>
                  <th className="h-9 pb-2 font-medium">Categoría</th>
                  <th className="hidden h-9 pb-2 font-medium md:table-cell">Proveedor</th>
                  <th className="h-9 pb-2 text-right font-medium">Monto</th>
                </tr>
              </thead>
              <tbody>
                {gastos.map((gasto) => (
                  <tr key={gasto.id} className="border-t">
                    <td className="hidden py-2.5 whitespace-nowrap text-muted-foreground md:table-cell">
                      {formatoFecha(gasto.fecha)}
                    </td>
                    <td className="max-w-32 truncate py-2.5 font-medium md:max-w-48">
                      {gasto.descripcion}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={cn(
                          'inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium',
                          clasesCategoria[gasto.categoria],
                        )}
                      >
                        {etiquetaCategoria[gasto.categoria]}
                      </span>
                    </td>
                    <td className="hidden max-w-40 truncate py-2.5 text-muted-foreground md:table-cell">
                      {gasto.proveedor}
                    </td>
                    <td className="py-2.5 text-right font-medium tabular-nums">
                      {formatoSoles(gasto.monto)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
