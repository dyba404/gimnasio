import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatoSoles, formatoSolesCompacto } from '@/lib/format'
import type { IngresoMes } from '@/components/pagos/logica-pagos'

type ChartIngresosMesProps = {
  datos: readonly IngresoMes[]
}

export function ChartIngresosMes({ datos }: ChartIngresosMesProps) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Ingresos por mes</CardTitle>
      </CardHeader>
      <CardContent>
        {datos.length === 0 ? (
          <p className="rounded-lg border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
            Sin ingresos en este periodo
          </p>
        ) : (
          <div className="h-72 text-muted-foreground">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[...datos]} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  strokeOpacity={0.25}
                  vertical={false}
                />
                <XAxis
                  dataKey="etiqueta"
                  tick={{ fill: 'currentColor', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: 'currentColor', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={64}
                  tickFormatter={(valor: number) => formatoSolesCompacto(valor)}
                />
                <Tooltip
                  cursor={{ fill: 'currentColor', fillOpacity: 0.06 }}
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 12,
                    color: 'var(--card-foreground)',
                  }}
                  formatter={(valor) => [formatoSoles(Number(valor)), 'Ingresos']}
                />
                <Bar
                  dataKey="total"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
