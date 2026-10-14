import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatoSoles, formatoSolesCompacto } from '@/lib/format'
import type { FlujoMes } from '@/components/reportes/logica-flujo'

type ChartFlujoNetoMesProps = {
  datos: readonly FlujoMes[]
}

export function ChartFlujoNetoMes({ datos }: ChartFlujoNetoMesProps) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Ingresos vs gastos por mes</CardTitle>
      </CardHeader>
      <CardContent>
        {datos.length === 0 ? (
          <p className="rounded-lg border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
            Sin movimientos en este periodo
          </p>
        ) : (
          <div className="space-y-3">
            <div className="h-72 text-muted-foreground">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={[...datos]} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
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
                    formatter={(valor, nombre) => [formatoSoles(Number(valor)), String(nombre)]}
                  />
                  <Bar dataKey="ingresos" name="Ingresos" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="gastos" name="Gastos" fill="#f87171" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Line
                    type="monotone"
                    dataKey="utilidad"
                    name="Utilidad"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-[#3b82f6]" />
                Ingresos
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-[#f87171]" />
                Gastos
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 rounded-full bg-[#f59e0b]" />
                Utilidad
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
