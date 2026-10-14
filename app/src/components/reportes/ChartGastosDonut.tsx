import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatoSoles } from '@/lib/format'
import { coloresCategoria } from '@/mocks/gastos'
import type { ResumenCategoriaGasto } from '@/mocks/gastos'

type ChartGastosDonutProps = {
  datos: readonly ResumenCategoriaGasto[]
}

export function ChartGastosDonut({ datos }: ChartGastosDonutProps) {
  const total = datos.reduce((suma, dato) => suma + dato.total, 0)

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Gastos por categoría</CardTitle>
      </CardHeader>
      <CardContent>
        {datos.length === 0 ? (
          <p className="rounded-lg border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
            Sin gastos en este periodo
          </p>
        ) : (
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="h-56 w-full max-w-56 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[...datos]}
                    dataKey="total"
                    nameKey="etiqueta"
                    innerRadius="55%"
                    outerRadius="85%"
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {datos.map((dato) => (
                      <Cell
                        key={dato.categoria}
                        fill={coloresCategoria[dato.categoria] ?? '#64748b'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      fontSize: 12,
                      color: 'var(--card-foreground)',
                    }}
                    formatter={(valor) => formatoSoles(Number(valor))}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="w-full space-y-2">
              {datos.map((dato) => {
                const porcentaje = total > 0 ? Math.round((dato.total / total) * 100) : 0
                return (
                  <li
                    key={dato.categoria}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: coloresCategoria[dato.categoria] }}
                      />
                      <span className="truncate">{dato.etiqueta}</span>
                    </span>
                    <span className="flex shrink-0 items-baseline gap-2 tabular-nums">
                      <span className="text-xs text-muted-foreground">{porcentaje}%</span>
                      <span className="font-medium">{formatoSoles(dato.total)}</span>
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
