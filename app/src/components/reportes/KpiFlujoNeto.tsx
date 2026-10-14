import { Receipt, TrendingUp, Wallet } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatoSoles } from '@/lib/format'
import { cn } from '@/lib/utils'

type KpiFlujoNetoProps = {
  ingresos: number
  gastos: number
}

export function KpiFlujoNeto({ ingresos, gastos }: KpiFlujoNetoProps) {
  const utilidad = ingresos - gastos
  const positivo = utilidad >= 0
  const margen = ingresos > 0 ? Math.round((utilidad / ingresos) * 100) : 0

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      <Card className="gap-3 py-4 sm:gap-6 sm:py-6">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
            Ingresos del periodo
            <TrendingUp className="size-4" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 px-4 sm:px-6">
          <p className="text-2xl font-semibold tabular-nums sm:text-3xl">{formatoSoles(ingresos)}</p>
          <p className="text-xs text-muted-foreground">Cobros completados del periodo</p>
        </CardContent>
      </Card>
      <Card className="gap-3 py-4 sm:gap-6 sm:py-6">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
            Gastos del periodo
            <Receipt className="size-4" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 px-4 sm:px-6">
          <p className="text-2xl font-semibold tabular-nums sm:text-3xl">{formatoSoles(gastos)}</p>
          <p className="text-xs text-muted-foreground">Pagos a proveedores y servicios</p>
        </CardContent>
      </Card>
      <Card className="gap-3 py-4 sm:gap-6 sm:py-6">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
            Utilidad neta
            <Wallet className="size-4" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 px-4 sm:px-6">
          <p
            className={cn(
              'text-2xl font-semibold tabular-nums sm:text-3xl',
              positivo
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400',
            )}
          >
            {formatoSoles(utilidad)}
          </p>
          <p className="text-xs text-muted-foreground">
            {ingresos > 0
              ? `Margen de ${margen}% sobre ingresos`
              : 'Sin ingresos en este periodo'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
