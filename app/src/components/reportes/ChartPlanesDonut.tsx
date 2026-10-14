import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatoSoles } from '@/lib/format'
import type { ResumenPlan } from '@/components/pagos/logica-pagos'

const PALETA = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
] as const

type ChartPlanesDonutProps = {
  datos: readonly ResumenPlan[]
}

export function ChartPlanesDonut({ datos }: ChartPlanesDonutProps) {
  const total = datos.reduce((suma, plan) => suma + plan.total, 0)

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Distribución por plan</CardTitle>
      </CardHeader>
      <CardContent>
        {datos.length === 0 ? (
          <p className="rounded-lg border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
            Sin cobros por plan en este periodo
          </p>
        ) : (
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="h-56 w-full max-w-56 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[...datos]}
                    dataKey="total"
                    nameKey="planNombre"
                    innerRadius="55%"
                    outerRadius="85%"
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {datos.map((plan, indice) => (
                      <Cell
                        key={plan.planId}
                        fill={PALETA[indice % PALETA.length] ?? 'var(--chart-1)'}
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
              {datos.map((plan, indice) => {
                const porcentaje = total > 0 ? Math.round((plan.total / total) * 100) : 0
                return (
                  <li
                    key={plan.planId}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: PALETA[indice % PALETA.length] }}
                      />
                      <span className="truncate">{plan.planNombre}</span>
                    </span>
                    <span className="flex shrink-0 items-baseline gap-2 tabular-nums">
                      <span className="text-xs text-muted-foreground">{porcentaje}%</span>
                      <span className="font-medium">{formatoSoles(plan.total)}</span>
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
